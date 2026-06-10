import { NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma"; // Assuming this exists based on common Next.js + Prisma setups

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  let redirectPath = "/settings";
  let origin = url.origin;
  if (state) {
    try {
      const decodedState = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
      if (decodedState.redirectPath) redirectPath = decodedState.redirectPath;
      if (decodedState.origin) origin = decodedState.origin;
    } catch (e) {
      console.error("Failed to parse state", e);
    }
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Google OAuth credentials not configured" }, { status: 500 });
  }

  const redirectUri = `${origin}/api/auth/google/callback`;
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    if (!email) {
      throw new Error("Could not retrieve email from Google");
    }

    // For a single-user app (or if we have a default user), we just get the first user
    // Since there's no auth session implemented yet, let's just tie it to the first user or create one
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { email: email, name: userInfo.data.name || "Default User" }
      });
    }

    // Save tokens to LinkedGmailAccount
    await prisma.linkedGmailAccount.upsert({
      where: {
        userId_email: {
          userId: user.id,
          email: email
        }
      },
      update: {
        accessToken: tokens.access_token || "",
        refreshToken: tokens.refresh_token || undefined, // keep existing if not provided
        expiresAt: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null
      },
      create: {
        userId: user.id,
        email: email,
        accessToken: tokens.access_token || "",
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null
      }
    });

    return NextResponse.redirect(`${origin}${redirectPath}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json({ error: "Failed to exchange authorization code" }, { status: 500 });
  }
}

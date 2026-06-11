import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { google } from "googleapis";
import { prisma, getDefaultUserId } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam === "access_denied") {
    // If the user cancels the Google auth flow
    return NextResponse.redirect(new URL("/settings?error=access_denied", process.env.NEXT_PUBLIC_APP_URL || url.origin));
  }

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  let redirectPath = "/settings";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let origin = appUrl;
  let stateCsrfToken = "";

  if (state) {
    try {
      const decodedState = JSON.parse(atob(state));
      if (decodedState.redirectPath) redirectPath = decodedState.redirectPath;
      if (decodedState.origin) origin = decodedState.origin;
      if (decodedState.csrfToken) stateCsrfToken = decodedState.csrfToken;
    } catch (e) {
      console.error("Failed to parse state", e);
    }
  }

  // Validate CSRF token
  const cookieStore = await cookies();
  const storedCsrfToken = cookieStore.get("oauth_csrf_token")?.value;

  if (!stateCsrfToken || !storedCsrfToken || stateCsrfToken !== storedCsrfToken) {
    return NextResponse.json({ error: "Invalid CSRF token. Request rejected." }, { status: 403 });
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

    // For a single-user app (or if we have a default user), get the actual default user
    const userId = await getDefaultUserId();

    // Save tokens to LinkedGmailAccount
    await prisma.linkedGmailAccount.upsert({
      where: {
        userId_email: {
          userId: userId,
          email: email
        }
      },
      update: {
        accessToken: tokens.access_token || "",
        refreshToken: tokens.refresh_token || undefined, // keep existing if not provided
        expiresAt: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null
      },
      create: {
        userId: userId,
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

import { NextResponse } from "next/server";
import { google } from "googleapis";
import crypto from "crypto";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Google OAuth credentials not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const redirectPath = searchParams.get("redirect") || "/settings";

  // Use the stable NEXT_PUBLIC_APP_URL to construct the callback URL safely
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const csrfToken = crypto.randomBytes(16).toString("hex");

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent", // Force consent screen to always get a refresh token
    state: btoa(JSON.stringify({ redirectPath, origin: appUrl, csrfToken })),
  });

  const response = NextResponse.redirect(authUrl);
  
  // Set HttpOnly cookie for CSRF validation
  response.cookies.set("oauth_csrf_token", csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15, // 15 minutes
  });

  return response;
}

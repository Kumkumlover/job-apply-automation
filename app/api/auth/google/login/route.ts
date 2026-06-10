import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Google OAuth credentials not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const redirectPath = searchParams.get("redirect") || "/settings";

  // Use the origin of the request to construct the callback URL dynamically
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/google/callback`;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent", // Force consent screen to always get a refresh token
    state: Buffer.from(JSON.stringify({ redirectPath, origin: url.origin })).toString("base64"),
  });

  return NextResponse.redirect(authUrl);
}

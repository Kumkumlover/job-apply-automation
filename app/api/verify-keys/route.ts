import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { hunterKey, apolloKey } = await req.json();
    
    let hunterValid = false;
    let apolloValid = false;

    if (hunterKey) {
      try {
        const res = await fetch(`https://api.hunter.io/v2/account?api_key=${hunterKey.trim()}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json"
          }
        });
        if (res.status === 200) {
          hunterValid = true;
        }
      } catch (e: any) {}
    }

    if (apolloKey) {
      try {
        const res = await fetch("https://api.apollo.io/v1/people/match", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          body: JSON.stringify({ api_key: apolloKey.trim() })
        });
        if (res.status !== 401) {
          apolloValid = true;
        }
      } catch (e: any) {}
    }

    return NextResponse.json({
      hunter: hunterKey ? { valid: hunterValid } : null,
      apollo: apolloKey ? { valid: apolloValid } : null
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

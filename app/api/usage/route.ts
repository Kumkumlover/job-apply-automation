import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const hunterKey = req.headers.get("x-hunter-key") || req.nextUrl.searchParams.get("hunterKey");
    const apolloKey = req.headers.get("x-apollo-key") || req.nextUrl.searchParams.get("apolloKey");

    const usage: any = {
      hunter: null,
      apollo: null,
    };

    // Fetch Hunter.io Usage
    if (hunterKey) {
      try {
        const hRes = await fetch(`https://api.hunter.io/v2/account?api_key=${hunterKey}`);
        if (hRes.ok) {
          const hData = await hRes.json();
          usage.hunter = {
            requestsUsed: hData?.data?.requests?.searches?.used || 0,
            requestsAvailable: hData?.data?.requests?.searches?.available || 0,
            callsUsed: hData?.data?.calls?.used || 0,
            callsAvailable: hData?.data?.calls?.available || 0,
          };
        }
      } catch (e) {
        console.error("Failed to fetch Hunter usage", e);
      }
    }

    // Fetch Apollo.io Usage
    if (apolloKey) {
      try {
        const aRes = await fetch("https://api.apollo.io/api/v1/usage_stats/api_usage_stats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "Authorization": `Bearer ${apolloKey}`,
          },
        });
        if (aRes.ok) {
          const aData = await aRes.json();
          // Find any overarching "search" limits
          const searchKey = Object.keys(aData).find(k => k.includes("contacts") && k.includes("search"));
          
          if (searchKey && aData[searchKey]?.day) {
            usage.apollo = {
              dailyLimit: aData[searchKey].day.limit || 0,
              dailyConsumed: aData[searchKey].day.consumed || 0,
            };
          } else {
             // Fallback to general API limits if specific search limits aren't surfaced
            usage.apollo = {
              dailyLimit: aData.overall?.day?.limit || "Rate Limited",
              dailyConsumed: aData.overall?.day?.consumed || 0,
            };
          }
        } else {
          usage.apollo = {
            dailyLimit: "N/A (Free Plan)",
            dailyConsumed: "?",
          };
        }
      } catch (e) {
        console.error("Failed to fetch Apollo usage", e);
        usage.apollo = { dailyLimit: "Error", dailyConsumed: "?" };
      }
    }

    return NextResponse.json(usage);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Internal server error" },
      { status: 500 }
    );
  }
}

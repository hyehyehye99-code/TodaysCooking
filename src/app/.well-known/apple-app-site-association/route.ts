import { NextResponse } from "next/server";

// Lets iOS open an invite link (/join?code=...) directly in the app instead
// of Safari, when the app is installed — Apple fetches this file itself
// (over HTTPS, no redirects, at this exact well-known path) and needs
// `application/json`, not the .well-known route's default HTML/octet-stream
// guess. Team ID (6NTUXY85FS) matches ios/App/App.xcodeproj's
// DEVELOPMENT_TEAM; bundle ID matches capacitor.config.ts's appId.
//
// Scoped to /join* only — every other page on this domain (the marketing
// site, a shared recipe link opened by someone without the app, etc.) should
// keep opening in a normal browser.
export async function GET() {
  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: [
          {
            appID: "6NTUXY85FS.com.hyeji.ourmenu",
            paths: ["/join", "/join?*"],
          },
        ],
      },
    },
    { headers: { "Content-Type": "application/json" } }
  );
}

import { redirect } from "next/navigation";
import { getCurrentHousehold } from "@/lib/household";
import { WelcomeContent } from "./welcome-content";

// The native app opens straight into this route (capacitor.config.ts
// server.url), so a returning logged-in user must be bounced onward
// instead of seeing the onboarding carousel every time it launches.
export default async function WelcomePage() {
  const { user, household } = await getCurrentHousehold();
  if (user && household) redirect("/recipes");
  if (user && !household) redirect("/onboarding");

  return <WelcomeContent />;
}

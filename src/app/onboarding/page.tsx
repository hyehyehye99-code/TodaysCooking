import { redirect } from "next/navigation";
import { getCurrentHousehold } from "@/lib/household";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const { user, household } = await getCurrentHousehold();

  if (user && household) redirect("/recipes");

  return <OnboardingWizard authed={!!user} />;
}

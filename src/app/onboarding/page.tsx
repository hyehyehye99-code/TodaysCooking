import { redirect } from "next/navigation";
import { getCurrentHousehold } from "@/lib/household";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const { user, household, previousHouseholdMissing } = await getCurrentHousehold();

  if (!user) redirect("/login");
  if (household) redirect("/recipes");

  return <OnboardingWizard householdMissingNotice={previousHouseholdMissing} />;
}

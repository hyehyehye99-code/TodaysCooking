import { redirect } from "next/navigation";
import { getCurrentHousehold } from "@/lib/household";

export default async function RootPage() {
  const { user, household } = await getCurrentHousehold();

  if (!user) redirect("/login");
  if (!household) redirect("/onboarding");
  redirect("/recipes");
}

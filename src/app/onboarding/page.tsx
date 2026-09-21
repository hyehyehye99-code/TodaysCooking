import { redirect } from "next/navigation";

// Household setup no longer has its own screen: signed-in users without a
// household get one created automatically (see /auth/setup). Kept as a
// redirect for old links and installed builds that still point here.
export default function OnboardingPage() {
  redirect("/recipes");
}

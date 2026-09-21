import { redirect } from "next/navigation";

// The intro slides are gone — the app opens straight into recipes. This
// route stays only as a redirect because already-installed native builds
// still load /welcome as their start URL (see capacitor.config.ts).
export default function WelcomePage() {
  redirect("/recipes");
}

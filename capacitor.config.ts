import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.hyeji.ourmenu",
  appName: "우리집 메뉴판",
  webDir: "native/www",
  server: {
    // The app is server-rendered (cookies, Server Actions, revalidatePath)
    // and can't be statically exported into the bundle, so the WKWebView
    // just loads the live deployment instead of shipping its own copy.
    // Starts at /welcome (the app onboarding), not "/" — that's the
    // desktop marketing landing page and should never appear inside the
    // native app.
    url: "https://ourhomemenu.vercel.app/welcome",
  },
};

export default config;

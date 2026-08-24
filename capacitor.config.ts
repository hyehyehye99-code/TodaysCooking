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
    // Distribution (TestFlight/App Store) builds enforce a much stricter
    // WKWebView navigation policy than dev builds — without the app's own
    // domain listed here, even a same-origin server redirect (e.g. an
    // already-logged-in user hitting /welcome and being sent to /recipes)
    // gets treated as "external" and kicked out to Safari.
    allowNavigation: ["ourhomemenu.vercel.app"],
  },
  plugins: {
    // launchAutoHide: false + manual .hide() (see SplashScreenBridge) keeps
    // the splash image up for the whole time the WKWebView is fetching and
    // rendering the remote page. With auto-hide, the default duration was
    // shorter than that fetch, so the splash disappeared into a blank white
    // webview before there was anything to show — reading as "no splash".
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#ffffff",
      showSpinner: false,
    },
  },
};

export default config;

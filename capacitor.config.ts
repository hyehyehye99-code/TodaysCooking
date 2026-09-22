import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.hyeji.ourmenu",
  appName: "우리집 레시피",
  webDir: "native/www",
  server: {
    // The app is server-rendered (cookies, Server Actions, revalidatePath)
    // and can't be statically exported into the bundle, so the WKWebView
    // just loads the live deployment instead of shipping its own copy.
    // Starts at /recipes (guest mode works without login), not "/" — that's
    // the desktop marketing landing page and should never appear inside
    // the native app. Older builds still start at /welcome, which now just
    // redirects here.
    url: "https://ourhomemenu.vercel.app/recipes",
    // Distribution (TestFlight/App Store) builds enforce a much stricter
    // WKWebView navigation policy than dev builds — without the app's own
    // domain listed here, even a same-origin server redirect (e.g. an
    // already-logged-in user hitting /login and being sent to /recipes)
    // gets treated as "external" and kicked out to Safari.
    allowNavigation: ["ourhomemenu.vercel.app"],
  },
  plugins: {
    // launchAutoHide stays true (the default) specifically so the OS/native
    // side guarantees the splash comes down on its own after
    // launchShowDuration — with no dependency on the WKWebView finishing
    // its load or any of our own JS ever running. SplashScreenBridge calls
    // .hide() as soon as the app actually has something to show, which
    // normally beats this timer easily; the timer only matters as the
    // fallback for a slow or totally failed load, where it guarantees the
    // splash can never get stuck up forever (a previous version relied on
    // JS to hide it with no such native-side backstop, and got pulled after
    // exactly that got stuck).
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2500,
      backgroundColor: "#FD502A",
      showSpinner: false,
    },
  },
};

export default config;

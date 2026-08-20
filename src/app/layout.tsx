import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Splash } from "@/components/Splash";
import "./globals.css";

const suit = localFont({
  src: "../fonts/SUIT-Variable.woff2",
  variable: "--font-suit",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "우리집 메뉴판",
  description: "우리의 메뉴를 한 곳에, 필요한 재료를 한눈에!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "우리집 메뉴판",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${suit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Splash />
      </body>
    </html>
  );
}

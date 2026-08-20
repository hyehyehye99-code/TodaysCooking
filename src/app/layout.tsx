import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const suit = localFont({
  src: "../fonts/SUIT-Variable.woff2",
  variable: "--font-suit",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "우리집 메뉴판",
  description: "부부/커플이 함께 쓰는 메뉴판 · 냉장고 · 장보기 앱",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

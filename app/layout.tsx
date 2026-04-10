import type { Metadata } from "next";
import type { Viewport } from "next";

import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import InstallPrompt from "@/components/InstallPrompt";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://app.pastorrhema.com";

export const metadata: Metadata = {
  title: "Pastor Rhema",
  description: "Your AI-powered sermon preparation platform",
  applicationName: "Pastor Rhema",
  metadataBase: new URL(siteUrl),
  appleWebApp: {
    title: "Pastor Rhema",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: ["/icon.png"],
    apple: [{ url: "/logo.png", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b2a5b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
        <InstallPrompt />

      </body>
    </html>
  );
}

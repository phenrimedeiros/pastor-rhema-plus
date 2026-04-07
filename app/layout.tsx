import type { Metadata } from "next";
import type { Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://app.pastorrhema.com";

export const metadata: Metadata = {
  title: "Pastor Rhema PLUS",
  description: "Your AI-powered sermon preparation platform",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: ["/logo.png"],
    apple: [{ url: "/logo.png", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

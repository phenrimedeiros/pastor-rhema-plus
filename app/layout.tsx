import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pastor Rhema PLUS",
  description: "Your AI-powered sermon preparation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

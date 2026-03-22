import type { Metadata } from "next";
import "./globals.css";
import OneSignalInit from "@/components/OneSignalInit";

export const metadata: Metadata = {
  title: "MS Galaxy — Liga 2 Amora 2026",
  description: "Classificação, calendário, plantel e estatísticas do MS Galaxy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#fcdc00" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MS Galaxy" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        {children}
        <OneSignalInit />
      </body>
    </html>
  );
}

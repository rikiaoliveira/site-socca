import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}

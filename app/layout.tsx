import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contract Intelligence Platform",
  description: "AI-powered contract renewal recommendation engine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white">{children}</body>
    </html>
  );
}

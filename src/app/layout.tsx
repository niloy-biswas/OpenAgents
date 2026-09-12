import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenAgents — Seller co-pilot for social commerce",
  description:
    "OpenAgents helps Bangladeshi social sellers answer customers, capture orders, and keep inventory visible from one calm workspace.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

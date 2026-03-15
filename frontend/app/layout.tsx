import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOMI Sentinel — Reactive DeFi Guardian",
  description:
    "Real-time DeFi risk monitoring powered by Somnia Reactivity. Monitor collateral ratios, whale movements, and liquidation risks without polling — events are pushed directly from the blockchain.",
  keywords: ["Somnia", "DeFi", "blockchain", "reactivity", "real-time", "risk monitor"],
  openGraph: {
    title: "SOMI Sentinel",
    description: "Reactive DeFi Guardian on Somnia Testnet",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

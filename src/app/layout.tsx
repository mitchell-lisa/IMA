import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MarketReady Risk Diagnostic",
    template: "%s · MarketReady Risk Diagnostic",
  },
  description:
    "Receive a confidential, industry-specific assessment of your renewal process, risk controls, claims practices, and underwriting story—before speaking with anyone.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}

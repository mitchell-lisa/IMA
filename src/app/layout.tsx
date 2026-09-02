import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MarketReady Risk Diagnostic",
    template: "%s · MarketReady Risk Diagnostic",
  },
  description:
    "A confidential, industry-specific self-assessment of your renewal process, risk controls, claims practices, and underwriting story.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}

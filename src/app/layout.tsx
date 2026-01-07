import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PCGS - Personal Career Governance System",
  description: "AI-powered career accountability with your personal board of directors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

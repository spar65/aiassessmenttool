import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aiassessmenttool.com"),
  title: "What's Your AI's Ethics Score? | AI Assessment Tool",
  description:
    "Test your AI system across 4 ethical dimensions: Lying, Cheating, Stealing, and Harm. Get your AI's ethics score in under 10 minutes.",
  keywords: [
    "AI ethics",
    "AI assessment",
    "AI safety",
    "ethical AI",
    "AI testing",
    "AI health check",
  ],
  openGraph: {
    title: "What's Your AI's Ethics Score?",
    description:
      "Test your AI system across 4 ethical dimensions. Free assessment in under 10 minutes.",
    type: "website",
    url: "https://aiassessmenttool.com",
    siteName: "AI Assessment Tool",
  },
  twitter: {
    card: "summary_large_image",
    title: "What's Your AI's Ethics Score?",
    description:
      "Test your AI system across 4 ethical dimensions. Free assessment in under 10 minutes.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {/* Background pattern */}
          <div
            className="fixed inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Main content */}
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  );
}


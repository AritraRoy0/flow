import type { Metadata } from "next";
import { Caveat, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// A legal-pad conceit: the motion and the wordmark read like a pen scrawl
// at the top of a flow sheet, while everything else in the app — every
// argument, every button — stays in plain, fast-to-read Geist.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "flow. | Debate round workspace",
  description: "A local-first APDA debate timer and flow sheet.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

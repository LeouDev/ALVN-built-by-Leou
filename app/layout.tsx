import type { Metadata, Viewport } from "next";
import { Manrope, Oleo_Script } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const oleo = Oleo_Script({ weight: "700", subsets: ["latin"], variable: "--font-oleo" }); // the logo face

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: "%s — ALVN" },
  description: site.description,
  applicationName: site.name,
  openGraph: { type: "website", siteName: site.title },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#F7F3EA" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${oleo.variable}`} data-scroll-behavior="smooth">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-navy focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-cream"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}

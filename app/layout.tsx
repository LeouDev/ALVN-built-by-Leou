import type { Metadata, Viewport } from "next";
import { Jost, Manrope } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const jost = Jost({ subsets: ["latin"], variable: "--font-jost" }); // headings and labels, the logo's typeface

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: "%s — build" },
  description: site.description,
  applicationName: site.name,
  openGraph: { type: "website", siteName: site.title },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#F2EFE8" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${jost.variable}`} data-scroll-behavior="smooth">
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

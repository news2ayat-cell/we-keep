import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "We Keep",
    template: "%s | We Keep",
  },
  description:
    "We Keep is a commitment tracking app for solo and mutual promises with accountability, history, and progress visibility.",
  applicationName: "We Keep",
  referrer: "origin-when-cross-origin",
  keywords: [
    "commitment tracker",
    "promise tracker",
    "accountability app",
    "mutual commitments",
    "shared promises",
    "task accountability",
    "productivity",
  ],
  authors: [{ name: "We Keep" }],
  creator: "We Keep",
  publisher: "We Keep",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "We Keep",
    title: "We Keep",
    description:
      "Track solo and mutual commitments with accountability, progress, and history.",
    images: [
      {
        url: "/opengraph-image.svg",
        width: 1200,
        height: 630,
        alt: "We Keep commitment tracking app",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "We Keep",
    description:
      "Track solo and mutual commitments with accountability, progress, and history.",
    images: ["/twitter-image.svg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
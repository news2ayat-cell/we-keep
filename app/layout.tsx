import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "We Keep",
    template: "%s | We Keep",
  },
  description:
    "We Keep turns promises into visible commitments with accountability, status tracking, reminders, and mutual confirmation.",
  applicationName: "We Keep",
  keywords: [
    "We Keep",
    "commitment tracker",
    "promise tracker",
    "accountability app",
    "mutual commitment",
    "reminder app",
  ],
  authors: [{ name: "We Keep" }],
  creator: "We Keep",
  publisher: "We Keep",
  metadataBase: new URL("https://we-keep.vercel.app"),
  openGraph: {
    title: "We Keep",
    description:
      "Turn promises into visible commitments with accountability and proof.",
    url: "https://we-keep.vercel.app",
    siteName: "We Keep",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "We Keep",
    description:
      "Turn promises into visible commitments with accountability and proof.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07070a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#07070a] text-white antialiased">{children}</body>
    </html>
  );
}
import "./globals.css";

export const metadata = {
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
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
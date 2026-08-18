import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Newsreader } from "next/font/google";
import type { ReactNode } from "react";

import { PreviewHostBridge } from "~/components/preview-host-bridge";
import { TRPCReactProvider } from "~/trpc/react";

const APP_NAME = "Subscription Tracker";

export const metadata: Metadata = {
  title: APP_NAME,
  description:
    "Track recurring charges. Monthly and yearly totals, upcoming payments, reminders.",
  applicationName: APP_NAME,
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
  other: {
    "twitter:card": "summary_large_image",
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${newsreader.variable} antialiased`}
    >
      <body>
        <PreviewHostBridge />
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}

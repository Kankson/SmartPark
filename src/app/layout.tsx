import type { Metadata, Viewport } from "next";

import "@/app/globals.css";
import { MotionProvider } from "@/components/motion-provider";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: {
    default: "SmartPark",
    template: "%s | SmartPark"
  },
  description: "Simplified Smart Parking Management",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg"
  }
};

export const viewport: Viewport = {
  themeColor: "#0E9F6E",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <PwaRegister />
        <MotionProvider />
        {children}
      </body>
    </html>
  );
}

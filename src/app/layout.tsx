import type { Metadata } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import AuroraBackground from "@/components/ui/AuroraBackground";
import NextTopLoader from 'nextjs-toploader';
import { NavigationLoader } from "@/components/ui/NavigationLoader";
import SessionProvider from "@/components/providers/SessionProvider";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans"
});

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-display"
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "ApplyMate | Autonomous AI Job Applications",
  description: "The autonomous AI job application agent that lands you interviews while you sleep.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
        <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
          <filter id="glass-dispersion" x="-100%" y="-100%" width="300%" height="300%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0" result="frosted" />
            {/* NOTE: Paste your massive <feImage href="data:image/bmp;base64, ... "> here */}
            <feDisplacementMap in="frosted" in2="refractionMap" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <NextTopLoader color="#a855f7" showSpinner={false} height={3} shadow="0 0 10px #a855f7,0 0 5px #a855f7" />
        <Suspense fallback={null}>
          <NavigationLoader />
        </Suspense>
        <SessionProvider>
          <AuroraBackground />
          <main style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}

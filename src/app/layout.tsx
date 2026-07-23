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
          <filter id="bubble-refraction" x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves="2" seed="1" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 3 -1" in="noise" result="enhancedNoise" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blurredSource" />
            <feDisplacementMap in="blurredSource" in2="enhancedNoise" scale="30" xChannelSelector="R" yChannelSelector="G" />
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

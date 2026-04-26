import type { Metadata } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AuroraBackground from "@/components/ui/AuroraBackground";

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

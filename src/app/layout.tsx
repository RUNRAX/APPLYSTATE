import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BackgroundScene from "@/components/three/BackgroundScene";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <BackgroundScene />
        <main style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </body>
    </html>
  );
}

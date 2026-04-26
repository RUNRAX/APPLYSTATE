"use client";
import Image from "next/image";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navigation Bar */}
      <nav className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 3rem', width: '100%', maxWidth: '1200px', margin: '1rem auto 0 auto', zIndex: 10 }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(to right, #fff, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
          ApplyMate
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/login">
            <Button variant="ghost" style={{ padding: '0.5rem 1rem' }}>Log in</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" style={{ padding: '0.5rem 1.5rem' }}>Sign up</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', marginTop: '-4rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          style={{ textAlign: 'center', maxWidth: '800px' }}
        >
          <h1 style={{ fontSize: '4.5rem', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.03em', background: 'linear-gradient(to right, #fff, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ApplyMate
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.8)', marginBottom: '3rem', lineHeight: 1.6 }}>
            The autonomous AI job application agent. We tailor your resume, answer tricky ATS questions, and apply to jobs while you focus on what matters.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '5rem' }}>
            <Link href="/register">
              <Button variant="primary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
                Get Started
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', width: '100%', maxWidth: '1000px', marginBottom: '4rem' }}>
          <GlassCard interactive>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎯</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Smart Matching</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              Our embeddings pipeline matches your profile to job descriptions with incredible accuracy, avoiding wasted applications.
            </p>
          </GlassCard>
          <GlassCard interactive>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✨</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>AI Tailoring</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              Every resume is rewritten specifically for the role, increasing ATS pass rates without ever fabricating experience.
            </p>
          </GlassCard>
          <GlassCard interactive>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤖</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Full Autonomy</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              Playwright-powered bots navigate complex forms, handle iFrames, and submit applications directly from your isolated browser.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

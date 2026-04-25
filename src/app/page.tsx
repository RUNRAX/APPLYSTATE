import Image from "next/image";
"use client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        style={{ textAlign: 'center', maxWidth: '800px', marginTop: '4rem' }}
      >
        <h1 style={{ fontSize: '4.5rem', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.03em', background: 'linear-gradient(to right, #fff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ApplyMate
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.8)', marginBottom: '3rem', lineHeight: 1.6 }}>
          The autonomous AI job application agent. We tailor your resume, answer tricky ATS questions, and apply to jobs while you focus on what matters.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '5rem' }}>
          <Button variant="primary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
            Get Started
          </Button>
          <Button variant="secondary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
            View Demo
          </Button>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', width: '100%', maxWidth: '1000px', marginBottom: '4rem' }}>
        <GlassCard>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Smart Matching</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
            Our embeddings pipeline matches your profile to job descriptions with incredible accuracy, avoiding wasted applications.
          </p>
        </GlassCard>
        <GlassCard>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>AI Tailoring</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
            Every resume is rewritten specifically for the role, increasing ATS pass rates without ever fabricating experience.
          </p>
        </GlassCard>
        <GlassCard>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Full Autonomy</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
            Playwright-powered bots navigate complex forms, handle iFrames, and submit applications directly from your isolated browser.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

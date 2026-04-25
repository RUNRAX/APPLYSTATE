"use client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Login() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        style={{ width: '100%', maxWidth: '400px' }}
      >
        <GlassCard style={{ padding: '2.5rem 2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Welcome back</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Sign in to your ApplyMate account
          </p>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} onSubmit={(e) => e.preventDefault()}>
            <Input label="Email address" type="email" placeholder="you@example.com" />
            <Input label="Password" type="password" placeholder="••••••••" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>
                <input type="checkbox" style={{ accentColor: 'var(--primary)' }} />
                Remember me
              </label>
              <Link href="#" style={{ color: 'var(--primary)' }}>Forgot password?</Link>
            </div>

            <Button variant="primary" style={{ marginTop: '1rem', width: '100%' }}>
              Sign in
            </Button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
            Don't have an account? <Link href="/register" style={{ color: '#fff', fontWeight: 600 }}>Create one</Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

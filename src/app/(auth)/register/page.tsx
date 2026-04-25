"use client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Register() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        style={{ width: '100%', maxWidth: '400px' }}
      >
        <GlassCard style={{ padding: '2.5rem 2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Start your autonomous job search
          </p>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} onSubmit={(e) => e.preventDefault()}>
            <Input label="Full Name" type="text" placeholder="John Doe" />
            <Input label="Email address" type="email" placeholder="you@example.com" />
            <Input label="Password" type="password" placeholder="••••••••" />
            
            <Button variant="primary" style={{ marginTop: '1.5rem', width: '100%' }}>
              Create account
            </Button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
            Already have an account? <Link href="/login" style={{ color: '#fff', fontWeight: 600 }}>Sign in</Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

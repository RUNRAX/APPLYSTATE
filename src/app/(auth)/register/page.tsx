"use client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { registerUser } from "@/app/actions/auth";

export default function Register() {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    const res = await registerUser(formData);
    if (res?.error) {
      setError(res.error);
    }
    setLoading(false);
  }

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

          <form action={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input label="Full Name" name="name" type="text" placeholder="John Doe" required />
            <Input label="Email address" name="email" type="email" placeholder="you@example.com" required />
            <Input label="Password" name="password" type="password" placeholder="••••••••" required />
            
            {error && <div style={{ color: "var(--error)", fontSize: "0.9rem", textAlign: "center" }}>{error}</div>}

            <Button variant="primary" type="submit" disabled={loading} style={{ marginTop: '1.5rem', width: '100%' }}>
              {loading ? "Creating..." : "Create account"}
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

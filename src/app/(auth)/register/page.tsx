"use client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { useState } from "react";
import { registerUser } from "@/app/actions/auth";

export default function Register() {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      const res = await registerUser(formData);
      if (res?.error) {
        setError(res.error);
      }
    } catch (e) {
      // Handled in server action
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="animate-scale-in" style={{ width: '100%', maxWidth: '448px' }}>
        <GlassCard variant="strong" style={{ padding: '3rem 2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <Logo />
          </div>

          <h2 className="font-display text-gradient-vivid" style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: '0.5rem', textAlign: 'center' }}>
            Create Account
          </h2>
          <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', marginBottom: '2.5rem', fontSize: '1rem' }}>
            Start your autonomous job search
          </p>

          <form action={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input label="Full Name" name="name" type="text" placeholder="John Doe" required />
            <Input label="Email address" name="email" type="email" placeholder="you@example.com" required />
            <Input label="Password" name="password" type="password" placeholder="••••••••" required />
            
            <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
              By creating an account, you agree to our <Link href="#" className="text-gradient">Terms of Service</Link> and <Link href="#" className="text-gradient">Privacy Policy</Link>.
            </div>

            {error && <div style={{ color: "var(--error)", fontSize: "0.9rem", textAlign: "center" }}>{error}</div>}

            <Button variant="primary" size="lg" type="submit" disabled={loading} style={{ marginTop: '1rem', width: '100%' }}>
              {loading ? "Creating..." : "Create account"}
            </Button>
          </form>

          <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.95rem', color: 'var(--muted-foreground)' }}>
            Already have an account? <Link href="/login" className="text-gradient" style={{ fontWeight: 600, marginLeft: '0.25rem' }}>Sign in</Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

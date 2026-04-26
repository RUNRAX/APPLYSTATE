"use client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials");
    } else {
      router.push("/dashboard");
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
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Welcome back</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Sign in to your ApplyMate account
          </p>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input label="Email address" name="email" type="email" placeholder="you@example.com" required />
            <Input label="Password" name="password" type="password" placeholder="••••••••" required />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>
                <input type="checkbox" style={{ accentColor: 'var(--primary)' }} />
                Remember me
              </label>
              <Link href="#" style={{ color: 'var(--primary)' }}>Forgot password?</Link>
            </div>

            {registered && <div style={{ color: "var(--success)", fontSize: "0.9rem", textAlign: "center", padding: "0.5rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px" }}>Account created successfully! Please sign in.</div>}
            {error && <div style={{ color: "var(--error)", fontSize: "0.9rem", textAlign: "center" }}>{error}</div>}

            <Button variant="primary" type="submit" disabled={loading} style={{ marginTop: '1rem', width: '100%' }}>
              {loading ? "Signing in..." : "Sign in"}
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

export default function Login() {
  return (
    <Suspense fallback={<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

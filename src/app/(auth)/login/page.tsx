"use client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
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
      <div className="animate-scale-in" style={{ width: '100%', maxWidth: '448px' }}>
        <GlassCard variant="strong" style={{ padding: '3rem 2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <Logo />
          </div>
          
          <h2 className="font-display text-gradient-vivid" style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: '0.5rem', textAlign: 'center' }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', marginBottom: '2.5rem', fontSize: '1rem' }}>
            Sign in to your ApplyMate account
          </p>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input label="Email address" name="email" type="email" placeholder="you@example.com" required />
            <Input label="Password" name="password" type="password" placeholder="••••••••" required />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }} />
                Remember me
              </label>
              <Link href="#" className="text-gradient" style={{ fontWeight: 500 }}>Forgot password?</Link>
            </div>

            {registered && <div style={{ color: "var(--success)", fontSize: "0.9rem", textAlign: "center", padding: "0.5rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px" }}>Account created successfully! Please sign in.</div>}
            {error && <div style={{ color: "var(--error)", fontSize: "0.9rem", textAlign: "center" }}>{error}</div>}

            <Button variant="primary" size="lg" type="submit" disabled={loading} style={{ marginTop: '1rem', width: '100%' }}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.95rem', color: 'var(--muted-foreground)' }}>
            Don't have an account? <Link href="/register" className="text-gradient" style={{ fontWeight: 600, marginLeft: '0.25rem' }}>Create one</Link>
          </div>
        </GlassCard>
      </div>
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

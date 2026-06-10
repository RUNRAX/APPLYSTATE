"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { savePlatformCredential } from "@/app/actions/connect";

export default function ConnectForm({ platformName }: { platformName: string }) {
  const [loginMethod, setLoginMethod] = useState("direct");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      savePlatformCredential(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <input type="hidden" name="platform" value={platformName} />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground)' }}>How do you normally log in?</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button 
            type="button" 
            variant={loginMethod === "direct" ? "primary" : "outline"} 
            onClick={() => setLoginMethod("direct")}
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
          >
            Email & Password
          </Button>
          <Button 
            type="button" 
            variant={loginMethod === "google" ? "primary" : "outline"} 
            onClick={() => setLoginMethod("google")}
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
          >
            Google
          </Button>
          <Button 
            type="button" 
            variant={loginMethod === "github" ? "primary" : "outline"} 
            onClick={() => setLoginMethod("github")}
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
          >
            Apple/GitHub
          </Button>
        </div>
      </div>

      {loginMethod === "direct" ? (
        <>
          <Input 
            name="username" 
            label="Email / Username" 
            placeholder="email@example.com" 
            type="email" 
            required 
          />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground)' }}>Password</label>
              {platformName.toLowerCase() === "linkedin" && (
                <a 
                  href="https://www.linkedin.com/uas/request-password-reset" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}
                >
                  Forgot Password?
                </a>
              )}
            </div>
            <Input 
              name="password" 
              placeholder="••••••••" 
              type="password" 
              required 
            />
          </div>

          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>
            <strong>Security Notice:</strong> Credentials are encrypted at rest using AES-256 and only decrypted inside the isolated Playwright worker during an active job application.
          </div>

          <Button variant="primary" type="submit" size="lg" style={{ width: '100%' }} disabled={isPending}>
            {isPending ? (
              <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px' }}>⏳</span> Connecting...</>
            ) : (
              `Securely Connect ${platformName}`
            )}
          </Button>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem' }}>
          <div style={{ padding: '1.25rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
            <strong style={{ color: '#ef4444', display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Agent Setup Required</strong>
            Because you use Google/Apple/GitHub to log in, Google's strict anti-bot security will block our background agent. <br/><br/>
            To allow the agent to apply for you, you <strong>must set a direct {platformName} password</strong>. Once set, you can switch back to the "Email & Password" tab to connect.
          </div>

          <Button 
            type="button" 
            variant="outline" 
            size="lg" 
            style={{ width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)' }}
            onClick={() => {
              if (platformName.toLowerCase() === 'linkedin') {
                window.open('https://www.linkedin.com/uas/request-password-reset', '_blank');
              } else {
                alert(`Please visit ${platformName}'s forgot password page to set a direct password.`);
              }
            }}
          >
            Go to {platformName} to Set Password
          </Button>
        </div>
      )}
    </form>
  );
}

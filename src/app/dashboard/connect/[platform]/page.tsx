import { auth } from "@/features/auth/auth";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { savePlatformCredential } from "@/app/actions/connect";

interface Props {
  params: {
    platform: string;
  };
}

export default async function ConnectPlatformPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { platform } = await params;
  // Capitalize platform name (e.g., linkedin -> LinkedIn)
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <GlassCard variant="strong" style={{ width: '100%', maxWidth: '450px', padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Connect {platformName}
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
            Securely provide your credentials so the autonomous agent can login and apply on your behalf.
          </p>
        </div>

        <form action={savePlatformCredential} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <input type="hidden" name="platform" value={platformName} />
          
          <Input 
            name="username" 
            label="Username / Email" 
            placeholder="email@example.com" 
            type="email" 
            required 
          />
          
          <Input 
            name="password" 
            label="Password" 
            placeholder="••••••••" 
            type="password" 
            required 
          />

          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>
            <strong>Security Notice:</strong> Credentials are encrypted at rest using AES-256 and only decrypted inside the isolated Playwright worker during an active job application.
          </div>

          <Button variant="primary" type="submit" size="lg" style={{ width: '100%' }}>
            Securely Connect {platformName}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}

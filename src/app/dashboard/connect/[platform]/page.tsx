import { auth } from "@/features/auth/auth";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import ConnectForm from "./ConnectForm";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface Props {
  params: {
    platform: string;
  };
}

export default async function ConnectPlatformPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { platform } = await params;
  let platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
  if (platform.toLowerCase() === 'company_portal') platformName = "Company Portals (Google)";

  const existingCredential = await prisma.platformCredential.findUnique({
    where: {
      userId_platform: {
        userId: session.user.id,
        platform: platform.toLowerCase(),
      }
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <GlassCard variant="strong" style={{ width: '100%', maxWidth: '450px', padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {existingCredential ? `✓ ${platformName} Connected` : `Connect ${platformName}`}
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
            {existingCredential 
              ? "Your credentials are saved securely. The autonomous agent is using them to apply on your behalf."
              : "Securely provide your credentials so the autonomous agent can login and apply on your behalf."}
          </p>
        </div>

        {existingCredential ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link href="/dashboard/settings">
              <Button variant="outline" style={{ width: '100%' }}>Back to Settings</Button>
            </Link>
            <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '1rem', textAlign: 'center' }}>
                Need to update your password?
              </p>
              <ConnectForm platformName={platformName} platformId={platform.toLowerCase()} />
            </div>
          </div>
        ) : (
          <ConnectForm platformName={platformName} platformId={platform.toLowerCase()} />
        )}
      </GlassCard>
    </div>
  );
}

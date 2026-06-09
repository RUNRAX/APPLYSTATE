import { auth } from "@/features/auth/auth";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import ConnectForm from "./ConnectForm";

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

        <ConnectForm platformName={platformName} />
      </GlassCard>
    </div>
  );
}

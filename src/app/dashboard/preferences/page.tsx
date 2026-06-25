import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import PreferencesForm from "./PreferencesForm";

export default async function PreferencesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let preference: any = null;
  
  if (session.user.id === 'test-user-id') {
    preference = { targetRoles: ['Frontend Engineer', 'React Developer'], locations: ['Remote', 'San Francisco'], remote: true, salaryMin: 120000, dailyLimit: 10, blacklistedComps: ['Evil Corp'], experienceLevel: ["2", "3"] };
  } else {
    preference = await prisma.jobPreference.findUnique({
      where: { userId: session.user.id }
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Job Preferences</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Define exactly what kind of roles the agent should apply for.</p>
      </div>

      <GlassCard variant="strong" style={{ maxWidth: '800px' }}>
        <PreferencesForm preference={preference} />
      </GlassCard>
    </div>
  );
}

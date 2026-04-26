import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import styles from "../dashboard.module.css";
import { submitOnboarding } from "@/app/actions/onboarding"; // We'll reuse the action for now

export default async function PreferencesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const prefs = await prisma.jobPreference.findUnique({
    where: { userId: session.user.id }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Job Preferences</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Define exactly what kind of roles the agent should apply for.</p>
      </div>

      <GlassCard variant="strong" style={{ maxWidth: '800px' }}>
        <form action={submitOnboarding} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <Input 
              name="targetRoles" 
              label="Target Roles" 
              placeholder="e.g. Frontend Engineer, React Developer" 
              defaultValue={prefs?.targetRoles.join(", ")}
              required 
            />
            <Input 
              name="locations" 
              label="Locations" 
              placeholder="e.g. San Francisco, New York, Remote" 
              defaultValue={prefs?.locations.join(", ")}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <Input 
              name="salaryMin" 
              label="Minimum Salary (USD)" 
              type="number"
              placeholder="e.g. 120000" 
              defaultValue={prefs?.salaryMin || ""}
            />
            <Input 
              name="dailyLimit" 
              label="Daily Application Limit" 
              type="number"
              placeholder="e.g. 10" 
              defaultValue={prefs?.dailyLimit || 10}
            />
          </div>

          <Input 
            name="blacklistedComps" 
            label="Blacklisted Companies (comma separated)" 
            placeholder="e.g. Acme Corp, Evil Corp" 
            defaultValue={prefs?.blacklistedComps.join(", ")}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div style={{ 
              width: '40px', height: '24px', background: prefs?.remote ? 'var(--gradient-vivid)' : 'rgba(255,255,255,0.1)', 
              borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
            }}>
              <input 
                type="checkbox" 
                name="remoteOnly" 
                defaultChecked={prefs?.remote} 
                style={{ opacity: 0, width: '100%', height: '100%', position: 'absolute', cursor: 'pointer', zIndex: 2 }} 
              />
              <div style={{ 
                width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', 
                top: '3px', left: prefs?.remote ? '19px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </div>
            <span style={{ fontWeight: 500 }}>Only apply to Remote roles</span>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
            <Button variant="ghost" type="button">Discard changes</Button>
            <Button variant="primary" type="submit">Save Preferences</Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

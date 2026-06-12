import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { updateJobPreferences } from "@/app/actions/preferences";

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
        <form action={updateJobPreferences} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <Input 
              name="targetRoles" 
              label="Target Roles (comma separated)" 
              placeholder="e.g. Frontend Engineer, React Developer" 
              defaultValue={preference?.targetRoles?.join(", ") || "Software Engineer"}
              required 
            />
            <Input 
              name="locations" 
              label="Locations (comma separated)" 
              placeholder="e.g. San Francisco, New York, Remote" 
              defaultValue={preference?.locations?.join(", ") || "Worldwide"}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Experience Level</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <input type="checkbox" name="experienceLevel" value="1" defaultChecked={preference?.experienceLevel?.includes("1")} /> Internship
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <input type="checkbox" name="experienceLevel" value="2" defaultChecked={preference?.experienceLevel?.includes("2")} /> Entry level
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <input type="checkbox" name="experienceLevel" value="3" defaultChecked={preference?.experienceLevel?.includes("3")} /> Associate
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <input type="checkbox" name="experienceLevel" value="4" defaultChecked={preference?.experienceLevel?.includes("4")} /> Mid-Senior
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Date Posted</label>
              <select 
                name="datePosted" 
                defaultValue={preference?.datePosted || ""}
                style={{ 
                  width: '100%', padding: '0.75rem', borderRadius: '8px', 
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                  color: 'white', outline: 'none' 
                }}
              >
                <option value="" style={{ color: 'black' }}>Any Time</option>
                <option value="r86400" style={{ color: 'black' }}>Past 24 hours</option>
                <option value="r604800" style={{ color: 'black' }}>Past Week</option>
                <option value="r2592000" style={{ color: 'black' }}>Past Month</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <Input 
              name="salaryMin" 
              label="Minimum Salary (₹)" 
              type="number"
              placeholder="e.g. 1200000" 
              defaultValue={preference?.salaryMin || ""}
            />
            <Input 
              name="dailyLimit" 
              label="Daily Application Limit" 
              type="number"
              placeholder="e.g. 10" 
              defaultValue={preference?.dailyLimit || 10}
            />
          </div>

          <Input 
            name="blacklistedComps" 
            label="Blacklisted Companies (comma separated)" 
            placeholder="e.g. Acme Corp, Evil Corp" 
            defaultValue={preference?.blacklistedComps?.join(", ") || ""}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div style={{ 
              width: '40px', height: '24px', background: preference?.remote ? 'var(--gradient-vivid)' : 'rgba(255,255,255,0.1)', 
              borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
            }}>
              <input 
                type="checkbox" 
                name="remoteOnly" 
                defaultChecked={preference?.remote} 
                style={{ opacity: 0, width: '100%', height: '100%', position: 'absolute', cursor: 'pointer', zIndex: 2 }} 
              />
              <div style={{ 
                width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', 
                top: '3px', left: preference?.remote ? '19px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </div>
            <span style={{ fontWeight: 500 }}>Only apply to Remote roles</span>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
            <Button variant="primary" type="submit">Save Preferences</Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { AutoApplyToggle } from "./AutoApplyToggle";
import styles from "../dashboard.module.css";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Mock API key state for now
  const apiKeyPrefix = process.env.GROQ_API_KEY ? "gsk_..." + process.env.GROQ_API_KEY.slice(-4) : "";

  const preference = await prisma.jobPreference.findUnique({
    where: { userId: session.user.id }
  });
  const isAutoApply = preference?.autoApply || false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Settings</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Manage your account, billing, and API integrations.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
        
        {/* Profile Section */}
        <GlassCard variant="strong">
          <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Account Profile</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <Input label="Full Name" defaultValue={session.user.name || ""} disabled />
            <Input label="Email Address" defaultValue={session.user.email || ""} disabled />
          </div>
          <Button variant="glass" style={{ fontSize: '0.9rem' }}>Edit Profile</Button>
        </GlassCard>

        {/* Job Preferences Section */}
        <GlassCard variant="strong">
          <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Job Search Preferences</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
            Configure how the ApplyMate agent discovers jobs on LinkedIn for you.
          </p>
          
          <form action={async (formData) => {
            "use server";
            const { updateJobPreferences } = await import("@/app/actions/preferences");
            await updateJobPreferences(formData);
          }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <Input 
                label="Target Roles (comma separated)" 
                name="targetRoles"
                defaultValue={preference?.targetRoles?.join(", ") || "Software Engineer"} 
              />
              <Input 
                label="Locations (comma separated)" 
                name="locations"
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
              defaultValue={preference?.blacklistedComps.join(", ") || ""}
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
              <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>Only apply to Remote roles</span>
            </div>

            <div>
              <Button type="submit" variant="primary">Save Preferences</Button>
            </div>
          </form>
        </GlassCard>

        {/* AI Integration Section */}
        <GlassCard variant="strong">
          <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>AI Integration</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
            ApplyMate uses Groq to tailor your resume and answer complex application questions at lightning speed.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input 
                label="Groq API Key" 
                type="password" 
                placeholder="gsk_..." 
                defaultValue={apiKeyPrefix}
              />
            </div>
            <Button variant="primary">Update Key</Button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>
            Keys are encrypted at rest using AES-256.
          </p>
        </GlassCard>

        {/* Automation Section */}
        <GlassCard variant="strong">
          <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Agent Application Pipeline</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
            Choose whether the AI agent applies automatically on your behalf or generates a resume and waits for your manual verification.
          </p>
          <AutoApplyToggle initialValue={isAutoApply} />
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard variant="strong" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f87171', marginBottom: '0.5rem' }}>Danger Zone</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="danger" style={{ fontSize: '0.9rem' }}>Delete Account</Button>
        </GlassCard>

      </div>
    </div>
  );
}

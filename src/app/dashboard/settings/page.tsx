import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import styles from "../dashboard.module.css";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Mock API key state for now
  const apiKeyPrefix = process.env.GROK_API_KEY ? "sk-..." + process.env.GROK_API_KEY.slice(-4) : "";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Settings</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Manage your account, billing, and API integrations.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
        
        {/* Profile Section */}
        <div className={styles.glassCardL2}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem' }}>Account Profile</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <Input label="Full Name" defaultValue={session.user.name || ""} disabled />
            <Input label="Email Address" defaultValue={session.user.email || ""} disabled />
          </div>
          <Button variant="secondary" style={{ fontSize: '0.9rem' }}>Edit Profile</Button>
        </div>

        {/* AI Integration Section */}
        <div className={styles.glassCardL2}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>AI Integration</h3>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
            ApplyMate uses Grok to tailor your resume and answer complex application questions.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input 
                label="Grok API Key" 
                type="password" 
                placeholder="xai-..." 
                defaultValue={apiKeyPrefix}
              />
            </div>
            <Button variant="primary">Update Key</Button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>
            Keys are encrypted at rest using AES-256.
          </p>
        </div>

        {/* Danger Zone */}
        <div className={styles.glassCardL2} style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.02)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f87171', marginBottom: '0.5rem' }}>Danger Zone</h3>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="danger" style={{ fontSize: '0.9rem' }}>Delete Account</Button>
        </div>

      </div>
    </div>
  );
}

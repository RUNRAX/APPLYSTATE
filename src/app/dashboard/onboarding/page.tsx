"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { submitOnboarding } from "@/app/actions/onboarding";

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ width: '100%', maxWidth: '600px', marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: '4px', background: step >= i ? 'var(--primary)' : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'background 0.3s' }} />
        ))}
      </div>

      <GlassCard style={{ width: '100%', maxWidth: '600px', minHeight: '400px', position: 'relative', overflow: 'hidden' }}>
        <form action={submitOnboarding} style={{ height: '100%' }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>Step 1: Upload Resume</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem' }}>Upload your latest resume. Our AI will parse and extract your skills and experience.</p>
                
                <div style={{ border: '2px dashed rgba(255,255,255,0.2)', padding: '3rem', textAlign: 'center', borderRadius: '12px', cursor: 'pointer' }}>
                  <input type="file" name="resumeFile" accept=".pdf,.doc,.docx" style={{ display: 'none' }} id="resumeUpload" />
                  <label htmlFor="resumeUpload" style={{ cursor: 'pointer' }}>
                    Drag and drop your PDF here, or click to browse.
                  </label>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>Step 2: Set Preferences</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem' }}>What kind of roles are you looking for?</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Input name="targetRoles" label="Target Roles (comma separated)" placeholder="Frontend Engineer, React Developer" required />
                  <Input name="locations" label="Locations (comma separated)" placeholder="San Francisco, New York, Remote" />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: "rgba(255,255,255,0.9)" }}>
                    <input type="checkbox" name="remoteOnly" defaultChecked style={{ accentColor: 'var(--primary)' }} />
                    Remote Only
                  </label>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>Step 3: Connect Platforms</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem' }}>Securely connect the job boards you want ApplyMate to use.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Button type="button" variant="outline" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>LinkedIn</span> <span>Connect</span>
                  </Button>
                  <Button type="button" variant="outline" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Indeed</span> <span>Connect</span>
                  </Button>
                  <Button type="button" variant="outline" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Wellfound</span> <span>Connect</span>
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>Ready to Launch</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '3rem' }}>ApplyMate is fully configured. We will now start scanning for jobs and submitting tailored applications on your behalf.</p>
                
                <Button variant="primary" type="submit" onClick={() => setLoading(true)} style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}>
                  {loading ? "Launching..." : "Launch Agent"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem', display: 'flex', justifyContent: 'space-between' }}>
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={prevStep}>Back</Button>
          ) : <div />}
          
          {step < 4 && (
            <Button type="button" variant="primary" onClick={nextStep}>Continue</Button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

"use client";
import { useState, useTransition, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { uploadResumeAction } from "@/app/actions/upload-resume";
import { useRouter } from "next/navigation";

interface ResumeVaultProps {
  initialResume: {
    id: string;
    originalContent: string;
    version: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ResumeVault({ initialResume, isOpen, onClose }: ResumeVaultProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  
  const [resumeText, setResumeText] = useState(initialResume?.originalContent || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError("Please select a PDF resume first.");
      return;
    }

    setError(null);
    setSuccess(false);
    const formData = new FormData();
    formData.append("resumeFile", file);
    // We send a dummy role just to bypass the required check in the current action,
    // though we should ideally refactor the action.
    formData.append("targetRole", "UploadOnly");

    startTransition(async () => {
      try {
        const result = await uploadResumeAction(formData);
        if (result.success) {
          setResumeText(result.resumeText);
          setSuccess(true);
          router.refresh();
        } else {
          setError("Failed to upload resume.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(32px)', padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '2rem',
        borderRadius: '24px' /* Ensure curved corners for the entire modal content area */
      }} onClick={e => e.stopPropagation()}>
        
        {/* Upload Section */}
        <GlassCard variant="strong" style={{ padding: '2rem', position: 'relative' }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent',
            border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', fontSize: '1.2rem'
          }}>✕</button>
          
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '1.5rem' }}>Upload Base Resume</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground)', display: 'block', marginBottom: '0.5rem' }}>
              Base Resume (PDF)
            </label>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange}
              style={{
                width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', color: 'var(--muted-foreground)'
              }}
            />
          </div>

          {error && <div style={{ color: 'var(--destructive)', fontSize: '0.9rem' }}>{error}</div>}
          {success && <div style={{ color: 'var(--success)', fontSize: '0.9rem' }}>Resume successfully uploaded and parsed!</div>}

          <Button variant="primary" onClick={handleUpload} disabled={isPending || !file}>
            {isPending ? (
              <><span className="spinner"></span> Uploading...</>
            ) : "Upload Resume"}
          </Button>
        </div>
      </GlassCard>

      {/* Current Active Resume Text */}
      {resumeText && (
        <GlassCard variant="strong" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '1rem' }}>Current Active Base Resume</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
            This is the raw text the AI extracted from your PDF and will use for job applications.
          </p>
          <div style={{ 
            background: 'rgba(0,0,0,0.2)', 
            padding: '1.5rem', 
            borderRadius: '24px', 
            fontFamily: 'monospace', 
            fontSize: '0.85rem', 
            color: 'var(--muted-foreground)',
            whiteSpace: 'pre-wrap',
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {resumeText}
          </div>
        </GlassCard>
      )}
      </div>
    </div>
  );
}

"use client";
import { useState, useTransition } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { uploadResumeAction } from "@/app/actions/upload-resume";

interface ResumeClientProps {
  initialResume: {
    id: string;
    originalContent: string;
    version: string;
  } | null;
}

export default function ResumeClient({ initialResume }: ResumeClientProps) {
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  
  const [resumeText, setResumeText] = useState(initialResume?.originalContent || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
        } else {
          setError("Failed to upload resume.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Upload Section */}
      <GlassCard variant="strong" style={{ padding: '2rem' }}>
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
              <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px' }}>⏳</span> Uploading...</>
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
            borderRadius: '8px', 
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
  );
}

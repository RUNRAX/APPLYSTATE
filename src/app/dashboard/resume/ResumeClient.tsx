"use client";
import { useState, useTransition } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { analyzeResumeAction } from "@/app/actions/resume-analyzer";

interface ResumeClientProps {
  initialResume: {
    id: string;
    originalContent: string;
    version: string;
    atsScore?: number | null;
  } | null;
}

export default function ResumeClient({ initialResume }: ResumeClientProps) {
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  
  const [resumeText, setResumeText] = useState(initialResume?.originalContent || "");
  const [atsScore, setAtsScore] = useState<number | null>(initialResume?.atsScore || null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = () => {
    if (!file) {
      setError("Please upload a PDF resume first.");
      return;
    }
    if (!targetRole.trim()) {
      setError("Please specify a target role.");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append("resumeFile", file);
    formData.append("targetRole", targetRole);

    startTransition(async () => {
      try {
        const result = await analyzeResumeAction(formData);
        if (result.success) {
          setResumeText(result.resumeText);
          setAtsScore(result.score);
          setAnalysis(result.analysis);
          setMissingSkills(result.missingSkills || []);
        } else {
          setError("Failed to analyze resume.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Upload & Analyze Section */}
      <GlassCard variant="strong" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '1.5rem' }}>Upload & Analyze</h2>
        
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

          <Input 
            name="targetRole"
            label="Which role are you mainly targeting?"
            placeholder="e.g. Software Developer, Product Manager"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />

          {error && <div style={{ color: 'var(--destructive)', fontSize: '0.9rem' }}>{error}</div>}

          <Button variant="primary" onClick={handleAnalyze} disabled={isPending || !file || !targetRole}>
            {isPending ? (
              <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px' }}>⏳</span> Analyzing against {targetRole}...</>
            ) : "Analyze Resume"}
          </Button>
        </div>
      </GlassCard>

      {/* Analysis Results */}
      {(atsScore !== null || analysis) && (
        <GlassCard variant="strong" style={{ padding: '2rem', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#a855f7', marginBottom: '1.5rem' }}>AI Analysis Results</h2>
          
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {atsScore !== null && (
              <div style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                width: '120px', height: '120px', borderRadius: '50%', border: `8px solid ${atsScore > 75 ? 'var(--success)' : atsScore > 50 ? 'var(--warning)' : 'var(--destructive)'}`,
                background: 'rgba(0,0,0,0.3)'
              }}>
                <span style={{ fontSize: '2rem', fontWeight: 800 }}>{atsScore}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>ATS SCORE</span>
              </div>
            )}
            
            <div style={{ flex: 1, minWidth: '250px' }}>
              <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--foreground)', marginBottom: '1rem' }}>{analysis}</p>
              
              {missingSkills.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Missing Key Skills</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {missingSkills.map((skill, i) => (
                      <span key={i} style={{ padding: '0.25rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '99px', fontSize: '0.8rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Current Active Resume Text */}
      {resumeText && (
        <GlassCard variant="strong" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '1rem' }}>Parsed Resume Text</h2>
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

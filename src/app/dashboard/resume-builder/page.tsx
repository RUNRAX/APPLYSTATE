"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { jsPDF } from "jspdf";
import { FileText, Download, Target, Wand2 } from "lucide-react";
import styles from "../dashboard.module.css";

export default function ResumeBuilderPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ tailoredResume: string; atsScore: number } | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription || !pdfFile) {
      setError("Please provide both a Job Description and a PDF Resume.");
      return;
    }
    
    setError("");
    setLoading(true);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append("jobDescription", jobDescription);
      formData.append("pdf", pdfFile);
      
      const res = await fetch("/api/resume-builder", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to process");
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.tailoredResume) return;
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    const lines = doc.splitTextToSize(result.tailoredResume, 180);
    
    let cursorY = 20;
    lines.forEach((line: string) => {
      if (cursorY > 280) {
        doc.addPage();
        cursorY = 20;
      }
      doc.text(line, 15, cursorY);
      cursorY += 5;
    });
    
    doc.save("Tailored_Resume.pdf");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Interactive Resume Builder</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Upload your resume and a job description to get a perfectly tailored PDF instantly.</p>
      </div>

      <div className={styles.bentoGrid}>
        {/* Left Side: Input Form */}
        <GlassCard variant="strong" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>1. Provide Details</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground)' }}>Target Job Description</label>
              <textarea 
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                style={{ 
                  width: '100%', minHeight: '200px', background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '1rem', 
                  color: 'var(--foreground)', resize: 'vertical', fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground)' }}>Original Resume (PDF)</label>
              <div style={{ 
                border: '1px dashed var(--glass-border)', borderRadius: '8px', padding: '1.5rem', 
                textAlign: 'center', background: 'rgba(255,255,255,0.02)'
              }}>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={e => setPdfFile(e.target.files?.[0] || null)}
                  id="pdfUpload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="pdfUpload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={24} color="var(--primary)" />
                  <span style={{ fontSize: '0.95rem' }}>
                    {pdfFile ? pdfFile.name : "Click to select your PDF resume"}
                  </span>
                </label>
              </div>
            </div>

            {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>{error}</div>}

            <div style={{ marginTop: 'auto' }}>
              <Button type="submit" variant="primary" style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center' }} disabled={loading}>
                <Wand2 size={18} />
                {loading ? "Analyzing & Tailoring..." : "Tailor Resume"}
              </Button>
            </div>
          </form>
        </GlassCard>

        {/* Right Side: Results */}
        <GlassCard variant="strong" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>2. Result</h3>
          
          {!result && !loading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', gap: '1rem' }}>
              <Target size={48} opacity={0.2} />
              <p>Your tailored resume and ATS score will appear here.</p>
            </div>
          )}

          {loading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', gap: '1rem' }}>
              <div className={styles.agentDotPing} style={{ position: 'relative', width: '2rem', height: '2rem' }} />
              <p className="animate-pulse">Groq AI is optimizing keywords...</p>
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1.5rem', animation: 'fade-up 0.5s ease-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontWeight: 500 }}>ATS Match Score</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: result.atsScore > 80 ? 'var(--success)' : result.atsScore > 60 ? 'var(--warm)' : '#ef4444' }}>
                    {result.atsScore}%
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground)' }}>Preview</label>
                <div style={{ 
                  flex: 1, minHeight: '300px', background: 'rgba(0,0,0,0.2)', 
                  border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '1rem', 
                  color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', overflowY: 'auto', whiteSpace: 'pre-wrap'
                }}>
                  {result.tailoredResume}
                </div>
              </div>

              <Button onClick={handleDownload} variant="glass" style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center', background: 'var(--gradient-vivid)' }}>
                <Download size={18} />
                Download PDF
              </Button>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

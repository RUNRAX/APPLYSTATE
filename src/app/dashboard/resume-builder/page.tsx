"use client";
import { useState, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import ReactMarkdown from "react-markdown";
import { FileText, Download, Target, Wand2, ArrowRight } from "lucide-react";
import styles from "../dashboard.module.css";

export default function ResumeBuilderPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ 
    originalAtsScore: number; 
    tailoredAtsScore: number; 
    tailoredResumeMarkdown: string; 
  } | null>(null);
  const [error, setError] = useState("");
  
  const resumeRef = useRef<HTMLDivElement>(null);

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

  const handleDownload = async () => {
    if (!resumeRef.current) return;
    
    try {
      // Temporarily ensure the element is fully visible for canvas
      const canvas = await html2canvas(resumeRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("Tailored_Resume.pdf");
    } catch (err) {
      console.error("Failed to generate PDF", err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Interactive Resume Builder</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Upload your resume and a job description to get a perfectly tailored PDF instantly.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Top: Input Form */}
        <GlassCard variant="strong" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem' }}>
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

        {/* Bottom: Results */}
        <GlassCard variant="strong" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem', overflow: 'hidden' }}>
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
              <p className="animate-pulse">Groq AI is optimizing keywords and formatting...</p>
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1.5rem', animation: 'fade-up 0.5s ease-out' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>Original ATS</span>
                  <span style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>{result.originalAtsScore}%</span>
                </div>

                <div style={{ color: 'var(--muted-foreground)' }}>
                  <ArrowRight size={24} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>Improved ATS</span>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)', textShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}>{result.tailoredAtsScore}%</span>
                </div>

              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground)' }}>Formatted Preview</label>
                
                <div style={{ 
                  flex: 1, height: '400px', overflowY: 'auto', background: '#333', 
                  borderRadius: '8px', padding: '1rem', border: '1px solid var(--glass-border)'
                }}>
                  {/* The actual printable area */}
                  <div 
                    ref={resumeRef}
                    style={{
                      background: '#ffffff',
                      color: '#000000',
                      padding: '40px',
                      width: '210mm', // A4 width
                      minHeight: '297mm', // A4 height
                      margin: '0 auto',
                      transformOrigin: 'top center',
                      transform: 'scale(0.8)', // Scale down for preview
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      letterSpacing: 'normal',
                      wordSpacing: 'normal'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', flexDirection: 'column', gap: '0.5em',
                      fontSize: '11pt', lineHeight: '1.4'
                    }}>
                      <style>{`
                        .resume-preview, .resume-preview * {
                          font-family: Arial, Helvetica, sans-serif !important;
                          text-transform: none !important;
                        }
                        .resume-preview h1 { font-size: 18pt; font-weight: bold; text-align: center; text-transform: uppercase !important; margin-bottom: 4px; }
                        .resume-preview h1 + p { text-align: center; margin-bottom: 4px; }
                        .resume-preview h1 + p + p { text-align: center; margin-bottom: 12px; }
                        .resume-preview h2 { font-size: 13pt; font-weight: bold; text-transform: uppercase !important; border-bottom: 1px solid #000; margin-top: 16px; margin-bottom: 8px; padding-bottom: 2px; }
                        .resume-preview h3 { font-size: 11pt; font-weight: bold; margin-top: 8px; }
                        .resume-preview p { margin-bottom: 4px; }
                        .resume-preview ul { margin-left: 20px; margin-bottom: 8px; list-style-type: disc; }
                        .resume-preview li { margin-bottom: 2px; }
                        .resume-preview strong { font-weight: bold; }
                      `}</style>
                      <div className="resume-preview">
                        <ReactMarkdown>
                          {result.tailoredResumeMarkdown}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleDownload} variant="glass" style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center', background: 'var(--gradient-vivid)' }}>
                <Download size={18} />
                Download Formatted PDF
              </Button>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

"use client";
import { useState, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { FileText, Download, Target, Wand2, ArrowRight, MessageSquare, Loader2 } from "lucide-react";
import styles from "../dashboard.module.css";
import { useChat } from '@ai-sdk/react';

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
  
  const { messages, input, handleInputChange, handleSubmit: handleChatSubmit, isLoading: isChatLoading } = useChat({
    api: '/api/resume-copilot',
    body: {
      currentResume: result?.tailoredResumeMarkdown || "",
      jobDescription: jobDescription,
    },
    onFinish: (msg) => {
      // Extract markdown from <RESUME_MARKDOWN>...</RESUME_MARKDOWN>
      const match = msg.content.match(/<RESUME_MARKDOWN>([\s\S]*?)<\/RESUME_MARKDOWN>/);
      if (match && match[1]) {
        setResult(prev => prev ? { ...prev, tailoredResumeMarkdown: match[1].trim() } : null);
      }
    }
  });

  // Calculate the live display markdown from the streaming message
  const lastMessage = messages[messages.length - 1];
  let displayMarkdown = result?.tailoredResumeMarkdown;
  
  if (isChatLoading && lastMessage?.role === 'assistant') {
    const match = lastMessage.content.match(/<RESUME_MARKDOWN>([\s\S]*?)(<\/RESUME_MARKDOWN>|$)/);
    if (match && match[1]) {
      displayMarkdown = match[1].trim();
    }
  }

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

  const scaleWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const scaleWrapper = scaleWrapperRef.current;
    const resumeEl = resumeRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!scaleWrapper || !resumeEl || !scrollContainer) return;
    
    // Temporarily remove scale and expand scroll container so html2canvas captures full height at native resolution
    const originalTransform = scaleWrapper.style.transform;
    const originalHeight = scrollContainer.style.height;
    const originalOverflow = scrollContainer.style.overflowY;
    
    scaleWrapper.style.transform = 'none';
    scrollContainer.style.height = 'auto';
    scrollContainer.style.overflowY = 'visible';
    
    // @ts-ignore
    import('html2pdf.js').then((html2pdf) => {
      const opt = {
        margin:       0,
        filename:     'Tailored_Resume.pdf',
        image:        { type: 'jpeg' as const, quality: 1 },
        html2canvas:  { scale: 4, useCORS: true, letterRendering: true, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      html2pdf.default().set(opt as any).from(resumeEl).save().then(() => {
        // Restore scale and container
        scaleWrapper.style.transform = originalTransform;
        scrollContainer.style.height = originalHeight;
        scrollContainer.style.overflowY = originalOverflow;
      });
    });
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

              <div style={{ display: 'flex', gap: '2rem', flex: 1 }}>
                {/* Left Side: Copilot Chat */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '300px' }}>
                  <div>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>
                      <MessageSquare size={18} color="var(--primary)" />
                      AI Copilot
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                      Notice a mistake? Ask the AI to fix it directly. 
                      e.g. "Move TCS iON to projects"
                    </p>
                  </div>
                  
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
                    {messages.filter(m => m.role !== 'system').map((m, idx) => {
                      // Hide the <RESUME_MARKDOWN> block from the chat UI bubble
                      const cleanText = m.content.replace(/<RESUME_MARKDOWN>[\s\S]*?(<\/RESUME_MARKDOWN>|$)/, '').trim();
                      if (!cleanText) return null;
                      
                      const isUser = m.role === 'user';
                      return (
                        <div key={idx} style={{
                          alignSelf: isUser ? 'flex-end' : 'flex-start',
                          background: isUser ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                          color: isUser ? '#fff' : 'var(--foreground)',
                          padding: '0.75rem 1rem',
                          borderRadius: '12px',
                          borderBottomRightRadius: isUser ? '2px' : '12px',
                          borderBottomLeftRadius: !isUser ? '2px' : '12px',
                          maxWidth: '90%',
                          fontSize: '0.9rem',
                          lineHeight: 1.4
                        }}>
                          {cleanText}
                        </div>
                      );
                    })}
                  </div>
                  
                  <form onSubmit={handleChatSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <textarea 
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Tell the Copilot what to change..."
                      style={{ 
                        width: '100%', minHeight: '80px', background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.75rem', 
                        color: 'var(--foreground)', resize: 'none', fontFamily: 'inherit', fontSize: '0.9rem'
                      }}
                      disabled={isChatLoading}
                    />
                    <Button type="submit" variant="primary" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }} disabled={isChatLoading || !input}>
                      {isChatLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                      {isChatLoading ? "Applying..." : "Send Request"}
                    </Button>
                  </form>
                </div>

                {/* Right Side: Preview */}
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground)' }}>Formatted Preview</label>
                    {isChatLoading && <span style={{ fontSize: '0.8rem', color: 'var(--primary)', animation: 'pulse 2s infinite' }}>Real-time editing...</span>}
                  </div>
                  
                  <div 
                    ref={scrollContainerRef}
                    style={{ 
                    flex: 1, height: '400px', overflowY: 'auto', background: '#333', 
                    borderRadius: '8px', padding: '1rem', border: '1px solid var(--glass-border)'
                  }}>
                    <div ref={scaleWrapperRef} className="scale-wrapper" style={{ transform: 'scale(0.8)', transformOrigin: 'top center', margin: '0 auto', width: 'fit-content' }}>
                      {/* The actual printable area */}
                      <div 
                        ref={resumeRef}
                        className="print-container"
                        style={{
                          background: '#ffffff',
                          color: '#000000',
                          padding: '40px',
                          width: '210mm', // A4 width
                          minHeight: '297mm', // A4 height
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          fontFamily: 'Arial, Helvetica, sans-serif',
                        }}
                      >
                      <div style={{ 
                        display: 'flex', flexDirection: 'column', gap: '0.5em',
                        fontSize: '11pt', lineHeight: '1.4'
                      }}>
                        <style>{`
                          .resume-preview, .resume-preview * {
                            font-family: Arial, Helvetica, sans-serif !important;
                            font-feature-settings: normal !important;
                            font-variant: normal !important;
                            letter-spacing: normal !important;
                            word-spacing: normal !important;
                            text-transform: none !important;
                          }
                          .resume-preview h1 { font-size: 18pt; font-weight: bold; text-align: center; text-transform: uppercase !important; margin-bottom: 4px; }
                          .resume-preview h1 + p { text-align: center; margin-bottom: 4px; }
                          .resume-preview h1 + p + p { text-align: center; margin-bottom: 12px; }
                          .resume-preview h2 { font-size: 13pt; font-weight: bold; text-transform: uppercase !important; border-bottom: 1px solid #000; margin-top: 16px; margin-bottom: 8px; padding-bottom: 2px; }
                          .resume-preview h3 { font-size: 11pt; font-weight: bold; margin-top: 8px; }
                          .resume-preview p { text-align: left; margin-bottom: 4px; page-break-inside: avoid; }
                          .resume-preview ul { margin-left: 20px; margin-bottom: 8px; list-style-type: disc; }
                          .resume-preview li { margin-bottom: 2px; text-align: left; page-break-inside: avoid; }
                          .resume-preview h2, .resume-preview h3, .resume-preview strong, .resume-preview div { page-break-inside: avoid; }
                          .resume-preview strong { font-weight: bold; }
                          .resume-preview span[style*="float:right"] { float: right; }
                          
                          @media print {
                            body * {
                              visibility: hidden;
                            }
                            .scale-wrapper, .scale-wrapper * {
                              visibility: visible;
                            }
                            .scale-wrapper {
                              position: absolute !important;
                              left: 0 !important;
                              top: 0 !important;
                              transform: none !important;
                              width: 100% !important;
                              margin: 0 !important;
                            }
                            .print-container {
                              width: 100% !important;
                              min-height: auto !important;
                              box-shadow: none !important;
                              padding: 0 !important;
                            }
                            @page {
                              size: auto;
                              margin: 10mm;
                            }
                          }
                        `}</style>
                        <div id="printable-resume" className="resume-preview">
                          <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                            {displayMarkdown || ""}
                          </ReactMarkdown>
                        </div>
                        </div>
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

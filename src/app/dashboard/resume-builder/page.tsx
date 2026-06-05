"use client";
import { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { FileText, Download, Target, Wand2, ArrowRight, MessageSquare, Loader2 } from "lucide-react";
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
  
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [liveMarkdown, setLiveMarkdown] = useState<string | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const savedJob = localStorage.getItem('resume_builder_job');
      const savedResult = localStorage.getItem('resume_builder_result');
      const savedMessages = localStorage.getItem('resume_builder_messages');
      if (savedJob) setJobDescription(savedJob);
      if (savedResult) setResult(JSON.parse(savedResult));
      if (savedMessages) setMessages(JSON.parse(savedMessages));
    } catch (e) {
      console.error("Failed to load state from localStorage:", e);
    }
  }, []);

  // Persist state to local storage when changed
  useEffect(() => {
    if (jobDescription) {
      localStorage.setItem('resume_builder_job', jobDescription);
    }
  }, [jobDescription]);

  useEffect(() => {
    if (result) {
      localStorage.setItem('resume_builder_result', JSON.stringify(result));
    } else {
      localStorage.removeItem('resume_builder_result');
    }
  }, [result]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('resume_builder_messages', JSON.stringify(messages));
    }
  }, [messages]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || isChatLoading) return;

    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsChatLoading(true);

    // Add empty assistant message stub
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    // Strip out the massive markdown blocks from the history so we don't blow up the LLM context!
    const cleanHistoryForAPI = newMessages.map(m => ({
      ...m,
      content: m.content.replace(/<RESUME_MARKDOWN>[\s\S]*?(<\/RESUME_MARKDOWN>|$)/, '').trim()
    }));

    try {
      const response = await fetch('/api/resume-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: cleanHistoryForAPI,
          currentResume: result?.tailoredResumeMarkdown || "",
          jobDescription: jobDescription,
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullContent = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          fullContent += chunk;
          
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1].content = fullContent;
            return next;
          });

          // Check for markdown updates
          const match = fullContent.match(/<RESUME_MARKDOWN>([\s\S]*?)(<\/RESUME_MARKDOWN>|$)/);
          const match = fullContent.match(/<RESUME_MARKDOWN>([\s\S]*?)(?:<\/RESUME_MARKDOWN>|$)/);
          if (match && match[1]) {
            setLiveMarkdown(match[1].trim());
          }
        }
      }

      const finalMatch = fullContent.match(/<RESUME_MARKDOWN>([\s\S]*?)(?:<\/RESUME_MARKDOWN>|$)/);
      if (finalMatch && finalMatch[1]) {
        const finalMarkdown = finalMatch[1].trim();
        setResult(prev => prev ? { ...prev, tailoredResumeMarkdown: finalMarkdown } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
      setLiveMarkdown(current => {
        if (current) {
          setResult(prev => prev ? { ...prev, tailoredResumeMarkdown: current } : null);
        }
        return null;
      });
    }
  };

  const displayMarkdown = liveMarkdown ?? result?.tailoredResumeMarkdown;

  const resumeRef = useRef<HTMLDivElement>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>
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
        <GlassCard variant="strong" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem', overflow: 'hidden', position: 'relative', minHeight: '600px' }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground)' }}>Formatted Preview</label>
                  {isChatLoading && <span style={{ fontSize: '0.8rem', color: 'var(--primary)', animation: 'pulse 2s infinite' }}>Real-time editing...</span>}
                </div>
                
                {/* Full Width Preview */}
                <div 
                  ref={scrollContainerRef}
                  style={{ 
                  flex: 1, height: '600px', overflowY: 'auto', background: 'transparent', 
                  borderRadius: '8px', padding: '1rem', border: '1px solid var(--glass-border)'
                }}>
                  <div ref={scaleWrapperRef} className="scale-wrapper" style={{ transform: 'scale(1)', transformOrigin: 'top center', margin: '0 auto', width: 'fit-content' }}>
                    {/* The actual printable area */}
                    <div 
                      ref={resumeRef}
                      className="print-container"
                      style={{
                        background: '#ffffff',
                        color: '#000000',
                        padding: '40px',
                        width: '210mm',
                        minHeight: '297mm',
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

              <Button onClick={handleDownload} variant="glass" style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center', background: 'var(--gradient-vivid)' }}>
                <Download size={18} />
                Download Formatted PDF
              </Button>

              {/* Floating Copilot Overlay */}
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                width: isCopilotOpen ? '380px' : 'auto',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                {isCopilotOpen ? (
                  <div style={{ 
                    display: 'flex', flexDirection: 'column', gap: '1rem', 
                    background: 'rgba(20, 20, 30, 0.85)', backdropFilter: 'blur(16px)',
                    padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px inset rgba(255,255,255,0.05)',
                    height: '500px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', background: 'var(--primary)', borderRadius: '8px', color: '#fff' }}>
                          <Wand2 size={18} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--foreground)' }}>Resume Copilot</h3>
                          <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--foreground-muted)' }}>Real-time formatting agent</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsCopilotOpen(false)}
                        style={{ background: 'none', border: 'none', color: 'var(--foreground-muted)', cursor: 'pointer', padding: '0.5rem' }}
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
                      {messages.filter(m => m.role !== 'system').map((m, idx) => {
                        const cleanText = m.content.replace(/<RESUME_MARKDOWN>[\s\S]*?(<\/RESUME_MARKDOWN>|$)/, '').trim();
                        const isUser = m.role === 'user';
                        const isTyping = !isUser && !cleanText && isChatLoading && idx === messages.length - 1;
                        
                        if (!cleanText && !isTyping) return null;
                        
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
                            lineHeight: 1.4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            {isTyping ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                <span style={{ opacity: 0.7 }}>Agent is thinking...</span>
                              </>
                            ) : cleanText}
                          </div>
                        );
                      })}
                    </div>
                    
                    <form onSubmit={handleChatSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Tell Copilot what to change..."
                        style={{ 
                          width: '100%', minHeight: '80px', background: 'rgba(0,0,0,0.2)', 
                          border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.75rem', 
                          color: 'var(--foreground)', resize: 'none', fontFamily: 'inherit', fontSize: '0.9rem'
                        }}
                        disabled={isChatLoading}
                      />
                      <Button type="submit" variant="primary" style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center' }} disabled={isChatLoading || !input}>
                        {isChatLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                        {isChatLoading ? "Applying..." : "Send Request"}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setIsCopilotOpen(true)}
                    variant="primary" 
                    style={{ 
                      borderRadius: '30px', padding: '0.75rem 1.5rem', display: 'flex', gap: '0.5rem', 
                      boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)' 
                    }}
                  >
                    <MessageSquare size={20} />
                    Open Copilot
                  </Button>
                )}
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

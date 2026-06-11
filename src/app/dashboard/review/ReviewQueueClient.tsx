"use client";
import { useState, useTransition, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { approveApplication, rejectApplication, tweakTailoredResume } from "@/app/actions/review";
import { generateResumeAnalysis } from "@/app/actions/analysis";
import { Send, ChevronDown, ChevronUp, Bot, Sparkles, AlertTriangle } from "lucide-react";

import { AgentStatusIndicator } from "./AgentStatusIndicator";

function formatResumeText(text: string) {
  if (!text) return "";
  
  // Clean up hard line breaks inside paragraphs (AI sometimes hard-wraps)
  // If a line doesn't end with a punctuation mark, and the next line doesn't start with a bullet or capital, we could unwrap it.
  // But safely, let's at least ensure double newlines around section headings.
  const headings = [
    "PROFESSIONAL SUMMARY", 
    "SUMMARY",
    "TECHNICAL SKILLS", 
    "SKILLS",
    "EXPERIENCE", 
    "PROFESSIONAL EXPERIENCE", 
    "WORK EXPERIENCE",
    "EDUCATION", 
    "PROJECTS", 
    "CERTIFICATIONS"
  ];
  
  let formatted = text;
  
  // Ensure double newlines before headings
  headings.forEach(heading => {
    // Match the heading even if it's not perfectly capitalized, but it usually is.
    const regex = new RegExp(`([^\\n])\\n(${heading}\\s*\\n)`, 'g');
    formatted = formatted.replace(regex, '$1\n\n$2');
  });
  
  // Ensure double newlines after headings
  headings.forEach(heading => {
    const regex = new RegExp(`(\\n${heading})\\n([^\\n])`, 'g');
    formatted = formatted.replace(regex, '$1\n\n$2');
  });

  return formatted;
}

interface ReviewQueueClientProps {
  applications: any[];
}

export default function ReviewQueueClient({ applications }: ReviewQueueClientProps) {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [analysisData, setAnalysisData] = useState<Record<string, any>>({});
  const [analysisLoading, setAnalysisLoading] = useState<Record<string, boolean>>({});
  
  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const handleApprove = (appId: string) => {
    startTransition(() => {
      approveApplication(appId).then(() => {
        setSelectedAppId(null);
      });
    });
  };

  const handleReject = (appId: string) => {
    startTransition(() => {
      rejectApplication(appId).then(() => {
        setSelectedAppId(null);
      });
    });
  };

  const handleToggleExpand = (app: any) => {
    if (selectedAppId === app.id) {
      setSelectedAppId(null);
      return;
    }
    setSelectedAppId(app.id);
    if (!analysisData[app.id]) {
      setAnalysisLoading(prev => ({ ...prev, [app.id]: true }));
      generateResumeAnalysis(app.id).then(res => {
        setAnalysisData(prev => ({ ...prev, [app.id]: res }));
        setAnalysisLoading(prev => ({ ...prev, [app.id]: false }));
      });
    }
  };

  const handleTweak = (appId: string) => {
    if (!chatInput.trim()) return;
    setChatLoading(true);
    startTransition(() => {
      tweakTailoredResume(appId, chatInput).then((res) => {
        if (res.success) {
          setChatInput("");
          // Re-trigger analysis because the resume changed
          setAnalysisLoading(prev => ({ ...prev, [appId]: true }));
          generateResumeAnalysis(appId).then(analysisRes => {
            setAnalysisData(prev => ({ ...prev, [appId]: analysisRes }));
            setAnalysisLoading(prev => ({ ...prev, [appId]: false }));
          });
        }
        setChatLoading(false);
      });
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1200px' }}>
      <AgentStatusIndicator />
      
      {applications.length === 0 ? (
        <GlassCard variant="strong" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h3 className="font-display" style={{ fontSize: '1.2rem', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Queue is empty</h3>
          <p>Your agent is running smoothly without interruptions.</p>
        </GlassCard>
      ) : (
        applications.map((app) => {
          const isExpanded = selectedAppId === app.id;
          const currentAnalysis = analysisData[app.id];
          const isLoadingAnalysis = analysisLoading[app.id];

          return (
            <motion.div key={app.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3, ease: "easeOut" }}>
              <GlassCard variant="strong" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                {/* Header / Summary Card (Always Visible) */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer' }} onClick={() => handleToggleExpand(app)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, paddingRight: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {app.status === 'PENDING_REVIEW' && <><StatusBadge status="Pending Review" /><span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Waiting for you</span></>}
                        {app.status === 'QUEUED' && <><StatusBadge status="Queued" /><span style={{ fontSize: '0.8rem', color: '#60a5fa' }}>Agent will apply soon</span></>}
                        {app.status === 'APPLIED' && <><StatusBadge status="Applied" /><span style={{ fontSize: '0.8rem', color: '#4ade80' }}>Application successful</span></>}
                      </div>
                      <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 600, wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.4 }}>
                        {app.jobListing.title} <span style={{ color: 'var(--muted-foreground)' }}>at</span> {app.jobListing.company}
                      </h3>
                    </div>
                    <Button variant="ghost" style={{ padding: '0.5rem' }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </Button>
                  </div>
                  
                  {!isExpanded && app.status === 'PENDING_REVIEW' && (
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                      A resume has been tailored for this job. Click to review, edit, or approve.
                    </p>
                  )}
                </div>

                {/* Inline Expanded View */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}
                    >
                      <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem', alignItems: 'start' }}>
                        
                        {/* Left Column: AI Analysis */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          
                          <div style={{ padding: '1rem', background: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(74, 222, 128, 0.2)', borderRadius: '12px' }}>
                            <h4 style={{ color: '#4ade80', fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Sparkles size={16} /> ATS Match Score
                            </h4>
                            {app.resumeVersion?.atsScore ? (
                              <span style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>{app.resumeVersion.atsScore} <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>/ 100</span></span>
                            ) : (
                              <span style={{ fontSize: '1.2rem', fontWeight: 500, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Pending Tailoring</span>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Bot size={18} color="var(--primary)" /> AI Analysis
                            </h4>
                            
                            {isLoadingAnalysis ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                                <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span> Analyzing changes...
                              </div>
                            ) : (
                              <>
                                {/* Changes Made */}
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                  <h5 style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem', fontWeight: 600 }}>What was tailored:</h5>
                                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--muted-foreground)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {currentAnalysis?.changesMade?.length > 0 ? currentAnalysis.changesMade.map((change: string, i: number) => (
                                      <li key={i}>{change}</li>
                                    )) : <li>No significant structural changes made.</li>}
                                  </ul>
                                </div>

                                {/* Missing Skills */}
                                <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                  <h5 style={{ fontSize: '0.9rem', color: '#f87171', marginBottom: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertTriangle size={14} /> Missing Requirements:
                                  </h5>
                                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#fca5a5', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {currentAnalysis?.missingSkills?.length > 0 ? currentAnalysis.missingSkills.map((skill: string, i: number) => (
                                      <li key={i}>{skill}</li>
                                    )) : <li style={{ color: '#4ade80', listStyle: 'none', marginLeft: '-1.2rem' }}>✨ You meet all requested qualifications!</li>}
                                  </ul>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right Column: The Resume & Chat */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                          <div style={{ 
                            flex: 1, 
                            background: '#0a0a0a', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            borderRadius: '12px', 
                            padding: '1.5rem',
                            maxHeight: '500px',
                            overflowY: 'auto',
                            whiteSpace: 'pre-wrap', 
                            fontFamily: 'var(--font-sans)', 
                            fontSize: '0.9rem', 
                            lineHeight: 1.6, 
                            color: 'rgba(255,255,255,0.9)' 
                          }}>
                            {formatResumeText(app.resumeVersion?.tailoredContent || app.resumeVersion?.originalContent || "No resume content available.")}
                          </div>

                          {/* AI Editor Chat Input */}
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input 
                              type="text" 
                              placeholder={app.status === 'PENDING_REVIEW' ? "Ask AI to change something (e.g. 'Make the summary shorter')" : "Resume locked (already queued/applied)"}
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && app.status === 'PENDING_REVIEW' && handleTweak(app.id)}
                              disabled={chatLoading || app.status !== 'PENDING_REVIEW'}
                              style={{
                                flex: 1,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '0.75rem 1rem',
                                color: 'white',
                                fontSize: '0.9rem',
                                outline: 'none',
                                opacity: app.status !== 'PENDING_REVIEW' ? 0.5 : 1
                              }}
                            />
                            <Button 
                              variant="primary" 
                              style={{ padding: '0 1.25rem' }}
                              onClick={() => handleTweak(app.id)}
                              disabled={chatLoading || !chatInput.trim() || app.status !== 'PENDING_REVIEW'}
                            >
                              {chatLoading ? <span className="spinner" style={{ width: '18px', height: '18px' }}></span> : <Send size={18} />}
                            </Button>
                          </div>
                        </div>

                      </div>

                      {/* Bottom Action Bar */}
                      <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button 
                          variant="ghost" 
                          onClick={async () => {
                            const rawContent = app.resumeVersion?.tailoredContent || app.resumeVersion?.originalContent || "";
                            const content = formatResumeText(rawContent);
                            const filename = `${app.jobListing.company.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf`;
                            
                            // Dynamically import to avoid SSR issues
                            const html2pdf = (await import("html2pdf.js")).default;
                            
                            const lines = content.split('\n');
                            let html = '<div style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #000; padding: 20px;">';
                            
                            lines.forEach(line => {
                              const trimmed = line.trim();
                              if (trimmed === '') {
                                html += '<div style="height: 12px;"></div>';
                              } else if (/^[A-Z][A-Z\s]+$/.test(trimmed) && trimmed.length > 4) { 
                                // ALL CAPS Heading
                                html += `<h3 style="margin-top: 16px; margin-bottom: 8px; font-size: 12pt; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; text-transform: uppercase;">${trimmed}</h3>`;
                              } else if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
                                html += `<div style="margin-left: 20px; text-indent: -10px; margin-bottom: 4px;">&#8226; ${trimmed.substring(1).trim()}</div>`;
                              } else {
                                html += `<div style="margin-bottom: 4px;">${trimmed}</div>`;
                              }
                            });
                            html += '</div>';

                            const element = document.createElement('div');
                            element.innerHTML = html;

                            html2pdf().set({
                              margin: 15,
                              filename: filename,
                              image: { type: 'jpeg', quality: 0.98 },
                              html2canvas: { scale: 2 },
                              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                            }).from(element).save();
                          }}
                        >
                          Download PDF
                        </Button>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <Button variant="danger" onClick={() => handleReject(app.id)} disabled={isPending || chatLoading || app.status !== 'PENDING_REVIEW'}>
                            {isPending ? <span className="spinner"></span> : "Reject"}
                          </Button>
                          <Button variant="primary" onClick={() => handleApprove(app.id)} disabled={isPending || chatLoading || app.status !== 'PENDING_REVIEW'}>
                            {isPending ? <><span className="spinner"></span> Approving...</> : (app.status === 'PENDING_REVIEW' ? "Approve & Queue Agent" : "Approved ✔")}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          );
        })
      )}
    </div>
  );
}

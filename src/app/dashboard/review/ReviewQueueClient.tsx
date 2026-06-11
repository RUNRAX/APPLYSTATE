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

function parseResumeToHtml(text: string) {
  if (!text) return "";
  
  // Pre-process text to ensure inline bullets start on a new line
  // If we see " • " or " - " not at the start of a line, we can break it.
  // Actually, standardizing bullets:
  let cleanedText = text.replace(/(\w|\.|,)\s*([•>-])\s+/g, '$1\n• ');
  
  const lines = cleanedText.split('\n').map(l => l.trim());
  while (lines.length > 0 && lines[0] === '') lines.shift();
  
  // Find where the header ends (first ALL CAPS heading after line 1)
  let headerEndIndex = lines.findIndex((l, i) => i > 0 && /^[A-Z][A-Z\s]+$/.test(l) && l.length > 3 && !l.includes('@'));
  if (headerEndIndex === -1) headerEndIndex = Math.min(3, lines.length);
  
  const headerLines = lines.slice(0, headerEndIndex).filter(l => l !== '');
  const bodyLines = lines.slice(headerEndIndex);

  // Using standard web-safe fonts to avoid html2pdf/html2canvas letter spacing bugs
  let html = `<div style="font-family: Arial, Helvetica, sans-serif !important; font-size: 11pt; line-height: 1.5; color: #000; width: 100%; max-width: 800px; margin: 0 auto; padding: 10px 20px; background: white; text-align: left; letter-spacing: normal !important; word-spacing: normal !important; font-variant: normal !important; text-transform: none !important;">`;
  
  if (headerLines.length > 0) {
    const name = headerLines[0];
    const title = headerLines.length > 1 && !headerLines[1].includes('@') ? headerLines[1] : '';
    const contactIdx = headerLines.length > 1 && headerLines[1].includes('@') ? 1 : 2;
    const contact = headerLines.length > contactIdx ? headerLines.slice(contactIdx).join(' | ') : '';

    html += `
      <div style="text-align: center; margin-bottom: 16px;">
        <h1 style="font-size: 22pt; font-weight: bold; margin: 0 0 4px 0; color: #000; letter-spacing: normal;">${name}</h1>
        ${title ? `<div style="font-size: 12pt; color: #333; margin-bottom: 6px; letter-spacing: normal;">${title}</div>` : ''}
        ${contact ? `<div style="font-size: 10pt; color: #555; letter-spacing: normal;">
          ${contact.split('|').map(c => {
            const trimmed = c.trim();
            if (trimmed.includes('@') || trimmed.includes('.com') || trimmed.includes('linkedin') || trimmed.includes('github')) {
              return `<span style="color: #2563eb; text-decoration: none;">${trimmed}</span>`;
            }
            return trimmed;
          }).join(' <span style="margin: 0 6px; color: #ccc;">|</span> ')}
        </div>` : ''}
      </div>
    `;
  }

  let htmlBody = '';
  let buffer: string[] = [];

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    const isBullet = buffer[0].startsWith('-') || buffer[0].startsWith('•') || buffer[0].startsWith('*');
    if (isBullet) {
      const joined = buffer.join(' ').replace(/^[-•*]\s*/, '').trim();
      htmlBody += `
        <div style="display: flex; align-items: flex-start; margin-bottom: 4px; padding-left: 8px;">
          <span style="margin-right: 8px; font-size: 11pt; line-height: 1.5;">•</span>
          <span style="flex: 1; line-height: 1.5; letter-spacing: normal;">${joined}</span>
        </div>
      `;
    } else {
      let text = buffer.join(' ');
      
      // Attempt to format "Title   Date" layout if there are 2+ spaces
      const parts = text.split(/\s{2,}/);
      if (parts.length >= 2 && text.length < 150 && !text.endsWith('.')) {
        htmlBody += `
          <div style="display: flex; justify-content: space-between; align-items: baseline; font-weight: bold; margin-top: 12px; margin-bottom: 4px; color: #000; letter-spacing: normal;">
            <span>${parts[0]}</span>
            <span style="font-weight: normal; font-size: 10pt; color: #333;">${parts.slice(1).join(' ')}</span>
          </div>
        `;
      } else if ((text.includes(' | ') || text.includes(' — ') || text.includes(' - ')) && text.length < 150 && !text.endsWith('.')) {
        htmlBody += `<div style="font-weight: bold; margin-top: 12px; margin-bottom: 4px; color: #000; letter-spacing: normal;">${text}</div>`;
      } else {
        htmlBody += `<div style="margin-bottom: 6px; letter-spacing: normal;">${text}</div>`;
      }
    }
    buffer = [];
  };

  bodyLines.forEach(line => {
    if (line === '') {
      flushBuffer();
    } else if (/^[A-Z][A-Z\s]+$/.test(line) && line.length > 3 && !line.includes('|')) {
      flushBuffer();
      htmlBody += `
        <h3 style="font-size: 12pt; font-weight: bold; color: #000; border-bottom: 2px solid #000; padding-bottom: 4px; margin-top: 20px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: normal;">
          ${line}
        </h3>
      `;
    } else {
      // If a line starts with a bullet unexpectedly, flush the previous buffer
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        flushBuffer();
      }
      buffer.push(line);
    }
  });
  flushBuffer();

  html += htmlBody + '</div>';
  return html;
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
                          <div 
                            style={{ 
                              flex: 1, 
                              background: 'white', 
                              border: '1px solid rgba(255,255,255,0.1)', 
                              borderRadius: '12px', 
                              maxHeight: '500px',
                              overflowY: 'auto'
                            }}
                            dangerouslySetInnerHTML={{ 
                              __html: parseResumeToHtml(app.resumeVersion?.tailoredContent || app.resumeVersion?.originalContent || "") 
                            }}
                          />

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
                            const html = parseResumeToHtml(rawContent);
                            const filename = `${app.jobListing.company.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf`;
                            
                            // Dynamically import to avoid SSR issues
                            const html2pdf = (await import("html2pdf.js")).default;
                            
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

"use client";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Target, Wand2, Bot, Sparkles, Shield, Zap, ArrowRight } from "lucide-react";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      {/* Navigation Bar */}
      <nav className={`${styles.nav} glass-pill animate-fade-up`} style={{ animationDelay: '50ms' }}>
        <Logo />
        <div className={styles.navLinks}>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#results">Results</a>
        </div>
        <div className={styles.navActions}>
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm">Sign up</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={`${styles.badge} glass-pill animate-fade-up`} style={{ animationDelay: '100ms' }}>
          <Sparkles size={14} className="text-gradient-vivid" />
          <span>Autonomous job-search agent · v2.0</span>
        </div>
        
        <h1 className={`font-display text-gradient-vivid animate-fade-up ${styles.heroTitle}`} style={{ animationDelay: '150ms' }}>
          Apply <em>smarter.</em>
        </h1>
        
        <p className={`animate-fade-up ${styles.heroSubtitle}`} style={{ animationDelay: '200ms' }}>
          The autonomous AI agent that tailors your resume, answers tricky ATS questions, and applies to jobs while you focus on what matters.
        </p>

        <div className={`animate-fade-up ${styles.ctaGroup}`} style={{ animationDelay: '250ms' }}>
          <Link href="/register">
            <Button variant="primary" size="lg">
              Launch Agent <ArrowRight size={18} />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="glass" size="lg">See how it works</Button>
          </Link>
        </div>
      </section>

      {/* Floating Stats Preview */}
      <section className={`animate-scale-in ${styles.statsSection}`} style={{ animationDelay: '350ms' }}>
        <GlassCard variant="strong" glow className={styles.statsCard}>
          <div className={styles.statItem}>
            <div className={`font-display text-gradient-vivid ${styles.statValue}`}>12,481</div>
            <div className={styles.statLabel}>Applications sent</div>
          </div>
          <div className={styles.statItem}>
            <div className={`font-display text-gradient-vivid ${styles.statValue}`}>94%</div>
            <div className={styles.statLabel}>ATS pass rate</div>
          </div>
          <div className={styles.statItem}>
            <div className={`font-display text-gradient-vivid ${styles.statValue}`}>3.2×</div>
            <div className={styles.statLabel}>Faster hiring</div>
          </div>
          <div className={styles.statItem}>
            <div className={`font-display text-gradient-vivid ${styles.statValue}`}>47s</div>
            <div className={styles.statLabel}>Avg tailoring time</div>
          </div>
        </GlassCard>
      </section>

      {/* Features Grid */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2 className={`font-display ${styles.sectionTitle}`}>Everything you need to win</h2>
          <p className={styles.sectionSubtitle}>A complete arsenal designed to bypass filters and get you in front of human recruiters.</p>
        </div>

        <div className={styles.featuresGrid}>
          <GlassCard interactive className={styles.featureCard}>
            <div className={styles.featureIcon}><Target size={24} color="var(--primary)" /></div>
            <h3>Smart Matching</h3>
            <p>Our embeddings pipeline matches your profile to job descriptions with incredible accuracy, avoiding wasted applications.</p>
          </GlassCard>
          
          <GlassCard interactive className={styles.featureCard}>
            <div className={styles.featureIcon}><Wand2 size={24} color="var(--accent)" /></div>
            <h3>AI Tailoring</h3>
            <p>Every resume is rewritten specifically for the role, increasing ATS pass rates without ever fabricating experience.</p>
          </GlassCard>

          <GlassCard interactive className={styles.featureCard}>
            <div className={styles.featureIcon}><Bot size={24} color="var(--secondary)" /></div>
            <h3>Full Autonomy</h3>
            <p>Playwright-powered bots navigate complex forms, handle iFrames, and submit applications directly from your isolated browser.</p>
          </GlassCard>
          
          <GlassCard interactive className={styles.featureCard}>
            <div className={styles.featureIcon}><Shield size={24} color="var(--success)" /></div>
            <h3>Privacy First</h3>
            <p>Your data never leaves your isolated environment. We use local vector databases and secure enclaves for your PII.</p>
          </GlassCard>

          <GlassCard interactive className={styles.featureCard}>
            <div className={styles.featureIcon}><Zap size={24} color="var(--warm)" /></div>
            <h3>Instant Alerts</h3>
            <p>Get notified the moment you receive an interview request or when your application status changes in the ATS.</p>
          </GlassCard>

          <GlassCard interactive className={styles.featureCard}>
            <div className={styles.featureIcon}><Sparkles size={24} color="var(--primary)" /></div>
            <h3>Cover Letters</h3>
            <p>Hyper-personalized cover letters generated based on company values, recent news, and the specific hiring manager.</p>
          </GlassCard>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className={styles.howItWorksSection}>
        <div className={styles.sectionHeader}>
          <h2 className={`font-display ${styles.sectionTitle}`}>Four steps to hired</h2>
          <p className={styles.sectionSubtitle}>We've reduced the grueling application process down to a 5-minute setup.</p>
        </div>

        <div className={styles.stepsGrid}>
          {[
            { num: '01', title: 'Connect Data', desc: 'Upload your master resume and connect your LinkedIn profile.' },
            { num: '02', title: 'Set Preferences', desc: 'Define your target roles, minimum salary, and preferred locations.' },
            { num: '03', title: 'Agent Matches', desc: 'Our AI scans thousands of listings and finds perfect matches.' },
            { num: '04', title: 'Auto Apply', desc: 'The bot tailors your resume and submits the application instantly.' }
          ].map((step, i) => (
            <GlassCard key={i} variant="strong" className={styles.stepCard}>
              <div className={`font-display text-gradient-vivid ${styles.stepNum}`}>{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.finalCtaSection}>
        <GlassCard variant="strong" glow className={styles.ctaCard}>
          <h2 className={`font-display ${styles.ctaTitle}`}>Ready to automate your job search?</h2>
          <p className={styles.ctaSubtitle}>Join 12,000+ engineers landing interviews while they sleep.</p>
          <div className={styles.ctaButtons}>
            <Link href="/register">
              <Button variant="primary" size="lg">Get Started Free</Button>
            </Link>
          </div>
        </GlassCard>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <Logo />
          <p className={styles.copyright}>© 2026 ApplyMate Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

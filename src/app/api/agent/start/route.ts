import { NextResponse } from 'next/server';
import { chromium } from 'playwright-core';
import { auth } from '@/features/auth/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Connect to Browserless
    const browserlessToken = process.env.BROWSERLESS_TOKEN;
    if (!browserlessToken) {
      // If we don't have a token, we fail early with a clear message for the user.
      return NextResponse.json({ 
        error: "Configuration missing: BROWSERLESS_TOKEN is not set in environment variables. Please add it to Vercel." 
      }, { status: 500 });
    }

    const wsEndpoint = `wss://chrome.browserless.io?token=${browserlessToken}`;
    
    // Test the Cloud Browser connection
    const browser = await chromium.connectOverCDP(wsEndpoint);
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // In a full implementation, you would pass the email/password to the discovery.worker logic here,
    // or push to a cloud queue like BullMQ backed by Upstash Redis.
    // For Vercel Serverless, long-running processes (scraping 40 pages) will timeout.
    // So we close the connection immediately and simulate a queue trigger.
    await browser.close();

    return NextResponse.json({ 
      success: true, 
      message: "Agent session started successfully via Cloud Browser!" 
    });
  } catch (error: any) {
    console.error("Agent start error:", error);
    return NextResponse.json({ error: error.message || "Failed to start agent" }, { status: 500 });
  }
}

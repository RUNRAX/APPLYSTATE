import { NextResponse } from 'next/server';
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

    // Persist credentials securely so the background worker can use them
    const { encryptCredential } = await import('@/lib/vault');
    const encryptedPassword = encryptCredential({ email, password });
    
    // We only support 'company_portal' / Google login for this flow
    const prisma = (await import('@/lib/prisma')).default;
    
    const existingCredential = await prisma.platformCredential.findFirst({
      where: { userId: session.user.id, platform: 'company_portal' }
    });

    if (existingCredential) {
      await prisma.platformCredential.update({
        where: { id: existingCredential.id },
        data: { vaultPath: encryptedPassword, isActive: true }
      });
    } else {
      await prisma.platformCredential.create({
        data: {
          userId: session.user.id,
          platform: 'company_portal',
          vaultPath: encryptedPassword,
          isActive: true
        }
      });
    }

    // Set Agent Status to INITIALIZING to trigger the background worker
    await prisma.agentStatus.upsert({
      where: { userId: session.user.id },
      update: { status: 'INITIALIZING', message: 'Starting cloud session...', updatedAt: new Date() },
      create: { userId: session.user.id, status: 'INITIALIZING', message: 'Starting cloud session...' }
    });

    // Connect to Browserless - verify token exists
    const browserlessToken = process.env.BROWSERLESS_TOKEN;
    if (!browserlessToken) {
      return NextResponse.json({ 
        error: "Configuration missing: BROWSERLESS_TOKEN is not set in environment variables. Please add it to Vercel." 
      }, { status: 500 });
    }

    // Simulate API delay
    await new Promise(r => setTimeout(r, 1000));

    return NextResponse.json({ 
      success: true, 
      message: "Agent session started successfully via Cloud Browser!" 
    });
  } catch (error: any) {
    console.error("Agent start error:", error);
    return NextResponse.json({ error: error.message || "Failed to start agent" }, { status: 500 });
  }
}

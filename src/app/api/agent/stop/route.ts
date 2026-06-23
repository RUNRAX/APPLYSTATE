import { NextResponse } from 'next/server';
import { auth } from '@/features/auth/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Set Agent Status to PAUSED to stop the background worker
    await prisma.agentStatus.upsert({
      where: { userId: session.user.id },
      update: { status: 'PAUSED', message: 'Agent paused by user', updatedAt: new Date() },
      create: { userId: session.user.id, status: 'PAUSED', message: 'Agent paused by user' }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Agent stopped successfully." 
    });
  } catch (error: any) {
    console.error("Agent stop error:", error);
    return NextResponse.json({ error: error.message || "Failed to stop agent" }, { status: 500 });
  }
}

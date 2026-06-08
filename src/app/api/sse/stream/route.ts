import { NextRequest } from 'next/server';
import { auth } from '@/features/auth/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    // For scaffolding/demo purposes we won't strictly enforce auth
    // return new Response('Unauthorized', { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      let lastCheck = new Date();

      const interval = setInterval(async () => {
        if (!session?.user?.id) return;
        
        try {
          // Poll for recently updated applications
          const recentApps = await prisma.application.findMany({
            where: { 
              userId: session.user.id,
              updatedAt: { gt: lastCheck }
            },
            include: { jobListing: true }
          });
          
          lastCheck = new Date();
          
          for (const app of recentApps) {
            const event = {
              type: app.status.toLowerCase(),
              title: `Application ${app.status}`,
              company: app.jobListing?.company || 'Unknown Company',
              timestamp: app.updatedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }
        } catch (e) {
          console.error("SSE Poll Error", e);
        }
      }, 5000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

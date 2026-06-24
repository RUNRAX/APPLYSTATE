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

      let previousStatuses = new Map<string, string>();
      let previousAgentMessage = "";

      const interval = setInterval(async () => {
        if (!session?.user?.id) return;
        
        try {
          // Poll for agent status updates
          const agentStatus = await prisma.agentStatus.findUnique({
            where: { userId: session.user.id }
          });

          if (agentStatus && agentStatus.message !== previousAgentMessage) {
            previousAgentMessage = agentStatus.message;
            const event = {
              type: agentStatus.status.toLowerCase(),
              title: agentStatus.status.replace(/_/g, ' '),
              company: agentStatus.message, // Use the company field to show the actual log message
              timestamp: new Date(agentStatus.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }

          // Poll for recently updated applications
          const recentApps = await prisma.application.findMany({
            where: { userId: session.user.id },
            orderBy: { id: 'desc' },
            take: 5,
            include: { jobListing: true }
          });
          
          for (const app of recentApps) {
            const prevStatus = previousStatuses.get(app.id);
            if (prevStatus !== app.status) {
              previousStatuses.set(app.id, app.status);
              const event = {
                type: app.status.toLowerCase(),
                title: `Application ${app.status.replace(/_/g, ' ')}`,
                company: app.jobListing?.company || 'Unknown Company',
                timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            }
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

import { NextRequest } from 'next/server';
import { auth } from '@/features/auth/auth';

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

      // Mock real-time updates for demonstration
      const interval = setInterval(() => {
        const events = [
          { type: 'matched', title: 'New highly matched role', company: 'Netflix', timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
          { type: 'tailored', title: 'Resume successfully tailored', company: 'Google', timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
          { type: 'submitted', title: 'Application submitted', company: 'Vercel', timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
          { type: 'needs_review', title: 'CAPTCHA challenge detected', company: 'Stripe', timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
          { type: 'interview_invite', title: 'Interview Invitation Received', company: 'OpenAI', timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
        ];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(randomEvent)}\n\n`));
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

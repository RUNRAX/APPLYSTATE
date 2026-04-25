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
          { type: 'status_update', title: 'Senior Engineer at Stripe', status: 'viewed' },
          { type: 'applied', title: 'Frontend Dev at Vercel' },
          { type: 'needs_review', title: 'CAPTCHA at Adobe' },
          { type: 'interview_invite', title: 'Product Engineer at OpenAI' }
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

import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ResumeClient from "./ResumeClient";

export default async function ResumePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const resume = await prisma.resume.findFirst({
    where: { userId: session.user.id, isActive: true },
    orderBy: { id: "desc" }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Resume Management</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>View and update the base resume the AI agent uses to apply for jobs.</p>
      </div>

      <ResumeClient initialResume={resume} />
    </div>
  );
}

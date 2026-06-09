import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AnalysisClient from "./AnalysisClient";

export default async function ResumeAnalysisPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const resume = await prisma.resume.findFirst({
    where: { userId: session.user.id, isActive: true },
    orderBy: { id: "desc" }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Resume Analysis</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Test your base resume against specific job roles to see how the ATS agent will score it.</p>
      </div>

      <AnalysisClient initialResume={resume} />
    </div>
  );
}

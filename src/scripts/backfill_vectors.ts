import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
process.env.DATABASE_URL = process.env.DIRECT_URL;
import prisma from '../lib/prisma';
import { updateProfileVector } from '../features/matching/embeddings';

async function main() {
  console.log("Starting vector backfill...");
  
  const resumes = await prisma.resume.findMany({
    where: { isActive: true },
    select: { userId: true, originalContent: true, tailoredContent: true }
  });

  for (const resume of resumes) {
    const content = resume.tailoredContent || resume.originalContent;
    if (content) {
      console.log(`Updating vector for user ${resume.userId}...`);
      try {
        await updateProfileVector(resume.userId, content);
        console.log(`Success for ${resume.userId}`);
      } catch (err) {
        console.error(`Failed for ${resume.userId}:`, err);
      }
    }
  }

  console.log("Backfill complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());

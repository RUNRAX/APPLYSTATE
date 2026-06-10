import { PrismaClient } from '@prisma/client';
import { getCredential } from '../src/lib/vault';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
process.env.DATABASE_URL = process.env.DIRECT_URL;

const prisma = new PrismaClient();

async function check() {
  const creds = await prisma.platformCredential.findMany({ where: { platform: { contains: 'linkedin', mode: 'insensitive' } }});
  console.log("Found credentials rows:", creds.length);
  for (const c of creds) {
    if (c.vaultPath) {
      const dec = await getCredential(c.userId, c.vaultPath);
      console.log(`User ${c.userId} creds email length:`, dec?.email?.length, "pass length:", dec?.password?.length);
    }
  }
}
check().catch(console.error).finally(() => prisma.$disconnect());

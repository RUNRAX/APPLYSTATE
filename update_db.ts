import 'dotenv/config';
import prisma from './src/lib/prisma';

async function run() {
  await prisma.application.updateMany({
    where: { status: 'PENDING_REVIEW' },
    data: { status: 'QUEUED' }
  });
  console.log('Successfully updated applications to QUEUED');
}

run();

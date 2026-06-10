import prisma from '../src/lib/prisma';

import prisma from '../src/lib/prisma';

async function clean() {
  console.log("Cleaning bad data...");
  try {
    await prisma.jobListing.deleteMany({ where: { title: 'Unknown Title' } });
    await prisma.application.deleteMany();
    await prisma.humanReviewItem.deleteMany({});
    console.log("Cleaned successfully.");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

clean();

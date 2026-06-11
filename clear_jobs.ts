import prisma from './src/lib/prisma';

async function clearJobs() {
  const result = await prisma.jobListing.deleteMany({});
  console.log(`Deleted ${result.count} old job listings.`);
}

clearJobs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

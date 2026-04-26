import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding demo data...')

  const users = await prisma.user.findMany({ take: 1 })
  const user = users[0]
  if (!user) {
    console.log('No user found. Please register an account first.')
    return
  }
  const userId = user.id

  // Clean up old demo data
  console.log('Clearing old data...')
  await prisma.humanReviewItem.deleteMany({ where: { userId } })
  await prisma.application.deleteMany({ where: { userId } })
  await prisma.jobListing.deleteMany({})

  console.log('Inserting new data...')
  const jobs = [
    { title: 'Frontend Engineer', company: 'Stripe', platform: 'LinkedIn', matchScore: 92, listingUrl: 'https://linkedin.com/1', status: 'MATCHED', description: 'React, TS, Next.js' },
    { title: 'Senior Software Engineer', company: 'Vercel', platform: 'LinkedIn', matchScore: 95, listingUrl: 'https://linkedin.com/2', status: 'MATCHED', description: 'Next.js core' },
    { title: 'Fullstack Developer', company: 'OpenAI', platform: 'Indeed', matchScore: 88, listingUrl: 'https://indeed.com/1', status: 'MATCHED', description: 'React, Node, Python' },
    { title: 'Product Engineer', company: 'Linear', platform: 'Wellfound', matchScore: 85, listingUrl: 'https://wellfound.com/1', status: 'MATCHED', description: 'React, TS, UI/UX' },
    { title: 'Software Engineer II', company: 'Uber', platform: 'LinkedIn', matchScore: 81, listingUrl: 'https://linkedin.com/3', status: 'MATCHED', description: 'Frontend infrastructure' },
    { title: 'UI Engineer', company: 'Apple', platform: 'LinkedIn', matchScore: 78, listingUrl: 'https://linkedin.com/4', status: 'MATCHED', description: 'Design systems' },
  ]

  const createdJobs = []
  for (const job of jobs) {
    createdJobs.push(await prisma.jobListing.create({ data: job }))
  }

  const apps = [
    { userId, jobListingId: createdJobs[0].id, status: 'SUBMITTED', submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { userId, jobListingId: createdJobs[1].id, status: 'SUBMITTED', submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { userId, jobListingId: createdJobs[2].id, status: 'QUEUED', submittedAt: null },
    { userId, jobListingId: createdJobs[3].id, status: 'QUEUED', submittedAt: null },
    { userId, jobListingId: createdJobs[4].id, status: 'FAILED', errorMessage: 'CAPTCHA detected', submittedAt: null },
    { userId, jobListingId: createdJobs[5].id, status: 'REVIEW', submittedAt: null },
  ]

  const createdApps = []
  for (const app of apps) {
    createdApps.push(await prisma.application.create({ data: app }))
  }

  await prisma.humanReviewItem.create({
    data: { userId, applicationId: createdApps[4].id, type: 'CAPTCHA', status: 'PENDING' }
  })
  
  await prisma.humanReviewItem.create({
    data: { userId, applicationId: createdApps[5].id, type: 'QUESTION', status: 'PENDING' }
  })

  console.log('Seed data inserted successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

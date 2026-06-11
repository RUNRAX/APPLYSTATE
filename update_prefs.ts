import prisma from './src/lib/prisma';

async function updatePreferences() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found!");
    return;
  }

  const updated = await prisma.jobPreference.upsert({
    where: { userId: user.id },
    update: {
      targetRoles: [
        "Software Engineer",
        "Full-Stack Developer",
        "Backend Developer",
        "Frontend Developer",
        "Technical Project Manager",
        "Scrum Master",
        "Product Manager"
      ],
      locations: ["Bengaluru", "Mumbai", "Pune", "Hyderabad", "Chennai"],
      remote: false,
      autoApply: false,
    },
    create: {
      userId: user.id,
      targetRoles: [
        "Software Engineer",
        "Full-Stack Developer",
        "Backend Developer",
        "Frontend Developer",
        "Technical Project Manager",
        "Scrum Master",
        "Product Manager"
      ],
      locations: ["Bengaluru", "Mumbai", "Pune", "Hyderabad", "Chennai"],
      remote: false,
      autoApply: false,
    }
  });

  console.log("Updated Job Preferences:", updated);
}

updatePreferences()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

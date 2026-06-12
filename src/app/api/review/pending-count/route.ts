import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const pendingReviewCount = await prisma.application.count({
      where: {
        userId: session.user.id,
        status: "PENDING_REVIEW"
      }
    });

    const newJobsCount = await prisma.jobListing.count({
      where: {
        status: "NEW"
      }
    });

    return NextResponse.json({ pendingCount: pendingReviewCount, newJobsCount: newJobsCount });
  } catch (error) {
    return NextResponse.json({ pendingCount: 0, newJobsCount: 0 }, { status: 500 });
  }
}

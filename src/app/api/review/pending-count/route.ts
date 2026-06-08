import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const count = await prisma.application.count({
      where: {
        userId: session.user.id,
        status: "PENDING_REVIEW"
      }
    });
    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}

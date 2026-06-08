import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { autoApply } = body;

  try {
    await prisma.jobPreference.upsert({
      where: { userId: session.user.id },
      update: { autoApply },
      create: { userId: session.user.id, autoApply },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return new NextResponse("Error updating preference", { status: 500 });
  }
}

"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/features/auth/auth";
import pdfParse from "pdf-parse";

export async function uploadResumeAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const file = formData.get("resumeFile") as File;

  if (!file || file.size === 0) throw new Error("No file uploaded");

  // Parse PDF
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  let resumeText = "";
  try {
    const data = await pdfParse(buffer);
    resumeText = data.text;
  } catch (error) {
    throw new Error("Failed to parse PDF file.");
  }

  // Deactivate old resumes and save new one
  await prisma.resume.updateMany({
    where: { userId: session.user.id, isActive: true },
    data: { isActive: false }
  });

  await prisma.resume.create({
    data: {
      userId: session.user.id,
      version: "Base Resume",
      originalContent: resumeText,
      isActive: true
    }
  });

  return {
    success: true,
    resumeText: resumeText
  };
}

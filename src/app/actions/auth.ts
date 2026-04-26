"use server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "User already exists with this email" };
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });
  } catch (e: any) {
    console.error("Registration error details:", {
      message: e.message,
      code: e.code,
      meta: e.meta,
      stack: e.stack
    });
    
    // Check if it's a Prisma known request error (e.g., unique constraint violation not caught above)
    if (e.code === 'P2002') {
       return { error: "User already exists with this email" };
    }
    
    // Check if it's a connection error (e.g., PgBouncer issues or incorrect password)
    if (e.message && e.message.includes("database")) {
       return { error: "Database connection failed. Please try again later." };
    }

    return { error: "Something went wrong. Please try again." };
  }

  // Next.js redirect MUST be outside the try/catch block
  // because it works by throwing a specific Error that Next.js catches
  redirect("/login?registered=true");
}

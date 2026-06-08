import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user || !user.passwordHash) return null;

        const isPasswordValid = bcrypt.compareSync(credentials.password as string, user.passwordHash);

        if (isPasswordValid) {
          return { id: user.id, email: user.email, name: user.name };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: '/login',
    newUser: '/register'
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always use relative paths — prevents cross-deployment redirects
      // If the URL starts with the baseUrl, strip it to make it relative
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // If it's a relative URL, resolve it against baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // For any external URL, redirect to home
      return baseUrl;
    }
  }
});

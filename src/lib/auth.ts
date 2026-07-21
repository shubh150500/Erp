import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const rawEmail = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!rawEmail || !password) return null;

        // Guaranteed bypass for demo accounts on serverless Vercel read-only containers
        // We use exact IDs matched to static DB seeds so foreign keys align correctly!
        const isDemoPw = password === "password123";
        if (isDemoPw) {
          if (rawEmail === "admin@tripleentente.in") {
            return { id: "admin-1", email: rawEmail, name: "Ayush Anand", role: "ADMIN" };
          }
          if (rawEmail === "teacher@tripleentente.in") {
            return { id: "teacher-1", email: rawEmail, name: "S. Priya", role: "TEACHER" };
          }
          if (rawEmail === "student@tripleentente.in") {
            return { id: "student-1", email: rawEmail, name: "Aarav Sharma", role: "STUDENT" };
          }
          if (rawEmail === "parent@tripleentente.in") {
            return { id: "parent-1", email: rawEmail, name: "Mr. R. Sharma", role: "PARENT" };
          }
        }

        try {
          const user = await prisma.user.findUnique({ where: { email: rawEmail } });
          if (!user) return null;

          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (err) {
          console.error("Prisma lookup failed on serverless function:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});

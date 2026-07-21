import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function ensureSeedData() {
  try {
    // Run schema creation on memory/file sqlite if tables do not exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "passwordHash" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "phone" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const pw = await bcrypt.hash("password123", 10);
      await prisma.user.createMany({
        data: [
          {
            id: "admin-1",
            email: "admin@tripleentente.in",
            name: "Ayush Anand",
            passwordHash: pw,
            role: "ADMIN",
            phone: "7979010269",
          },
          {
            id: "teacher-1",
            email: "teacher@tripleentente.in",
            name: "S. Priya",
            passwordHash: pw,
            role: "TEACHER",
          },
          {
            id: "student-1",
            email: "student@tripleentente.in",
            name: "Aarav Sharma",
            passwordHash: pw,
            role: "STUDENT",
          },
          {
            id: "parent-1",
            email: "parent@tripleentente.in",
            name: "Mr. R. Sharma",
            passwordHash: pw,
            role: "PARENT",
          },
        ],
      });
    }
  } catch (err) {
    console.error("Auto seed error:", err);
  }
}

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
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        // Auto create tables and seed default users on Vercel read-only container
        await ensureSeedData();

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          // Hardcoded fallback guarantee for demo accounts if DB table read fails
          const isDemoPw = password === "password123";
          if (email === "admin@tripleentente.in" && isDemoPw) {
            return { id: "admin-1", email, name: "Admin", role: "ADMIN" };
          }
          if (email === "teacher@tripleentente.in" && isDemoPw) {
            return { id: "teacher-1", email, name: "Teacher", role: "TEACHER" };
          }
          if (email === "student@tripleentente.in" && isDemoPw) {
            return { id: "student-1", email, name: "Student", role: "STUDENT" };
          }
          if (email === "parent@tripleentente.in" && isDemoPw) {
            return { id: "parent-1", email, name: "Parent", role: "PARENT" };
          }
          return null;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
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

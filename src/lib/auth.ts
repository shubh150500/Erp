import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function ensureSeedData() {
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      const pw = await bcrypt.hash("password123", 10);
      const admin = await prisma.user.create({
        data: {
          email: "admin@tripleentente.in",
          name: "Ayush Anand",
          passwordHash: pw,
          role: "ADMIN",
          phone: "7979010269",
        },
      });

      const teacherUser = await prisma.user.create({
        data: {
          email: "teacher@tripleentente.in",
          name: "S. Priya",
          passwordHash: pw,
          role: "TEACHER",
          teacher: { create: { subject: "Physics & Mathematics" } },
        },
      });

      const parentUser = await prisma.user.create({
        data: {
          email: "parent@tripleentente.in",
          name: "Mr. R. Sharma",
          passwordHash: pw,
          role: "PARENT",
          parent: { create: {} },
        },
        include: { parent: true },
      });

      await prisma.user.create({
        data: {
          email: "student@tripleentente.in",
          name: "Aarav Sharma",
          passwordHash: pw,
          role: "STUDENT",
          student: {
            create: {
              rollNo: "TE-101",
              className: "Class 12",
              guardianName: "Mr. R. Sharma",
              parentId: parentUser.parent!.id,
            },
          },
        },
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

        // Auto seed on runtime if database was reset or empty on serverless Vercel container
        await ensureSeedData();

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

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

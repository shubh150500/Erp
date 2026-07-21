"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const teacherSchema = z.object({
  name: z.string().min(2, "Enter the staff member's name").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  staffType: z.enum(["TEACHING", "NON_TEACHING"]).default("TEACHING"),
  subject: z.string().max(60).optional().or(z.literal("")),
  designation: z.string().max(60).optional().or(z.literal("")),
  phone: z.string().max(15).optional().or(z.literal("")),
});

export type TeacherFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function createTeacher(
  _prev: TeacherFormState,
  formData: FormData
): Promise<TeacherFormState> {
  await requireRole(["ADMIN"]);
  const parsed = teacherSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  const email = d.email.toLowerCase().trim();

  if (await prisma.user.findUnique({ where: { email } })) {
    return { ok: false, message: "That email is already registered." };
  }
  const passwordHash = await bcrypt.hash(d.password, 10);

  try {
    await prisma.user.create({
      data: {
        email,
        name: d.name,
        passwordHash,
        role: "TEACHER",
        phone: d.phone || null,
        teacher: {
          create: {
            staffType: d.staffType,
            subject: d.staffType === "TEACHING" ? d.subject || null : null,
            designation: d.designation || null,
          },
        },
      },
    });
  } catch {
    return { ok: false, message: "Could not create the staff member." };
  }
  revalidatePath("/dashboard/staff");
  return { ok: true, message: `${d.name} added to staff.` };
}

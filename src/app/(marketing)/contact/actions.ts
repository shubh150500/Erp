"use server";

import { prisma } from "@/lib/prisma";
import { inquirySchema } from "@/lib/validators";

export type InquiryState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData
): Promise<InquiryState> {
  const parsed = inquirySchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    className: formData.get("className"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, phone, email, className, message } = parsed.data;

  try {
    await prisma.inquiry.create({
      data: {
        name,
        phone,
        email: email || null,
        className,
        message: message || null,
      },
    });
  } catch {
    return {
      ok: false,
      message: "Something went wrong. Please call us instead.",
    };
  }

  return {
    ok: true,
    message: "Thank you! We've received your enquiry and will call you soon.",
  };
}

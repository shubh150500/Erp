import { z } from "zod";

export const inquirySchema = z.object({
  name: z.string().min(2, "Please enter your full name").max(80),
  phone: z
    .string()
    .min(10, "Enter a valid phone number")
    .max(15)
    .regex(/^[0-9+\-\s]+$/, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  className: z.string().min(1, "Please select a class"),
  message: z.string().max(500).optional().or(z.literal("")),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

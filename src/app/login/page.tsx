import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen grid place-items-center bg-navy-700 relative overflow-hidden py-12 px-4">
      <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />
      <div
        className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gold-500/15 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        <LoginForm />
      </div>
    </main>
  );
}

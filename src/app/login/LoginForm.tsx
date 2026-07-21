"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";

const demoAccounts = [
  { role: "Admin", email: "admin@tripleentente.in" },
  { role: "Teacher", email: "teacher@tripleentente.in" },
  { role: "Student", email: "student@tripleentente.in" },
  { role: "Parent", email: "parent@tripleentente.in" },
];

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password: password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password.");
        setPending(false);
      } else {
        window.location.replace("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred.");
      setPending(false);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center">
        <Logo light className="justify-center" />
      </div>

      <div className="mt-8 rounded-2xl bg-white p-8 shadow-[var(--shadow-lift)]">
        <h1 className="font-serif text-2xl font-bold text-navy-700">Welcome back</h1>
        <p className="mt-1 text-sm text-navy-500">
          Sign in to your Triple Entente account.
        </p>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
            <AlertCircle size={17} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="block text-sm font-medium text-navy-700 mb-1.5">Email</span>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@tripleentente.in"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-navy-700 mb-1.5">Password</span>
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className={inputCls}
            />
          </label>
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : (<>Sign in <LogIn size={16} /></>)}
          </Button>
        </form>
      </div>

      <div className="mt-6 rounded-2xl bg-navy-800/40 border border-white/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-400">
          Demo accounts · Click to autofill (password: <span className="text-ivory">password123</span>)
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {demoAccounts.map((a) => (
            <button
              type="button"
              key={a.email}
              onClick={() => handleFillDemo(a.email)}
              className="text-left rounded-lg bg-white/5 hover:bg-white/10 px-3 py-2 transition cursor-pointer"
            >
              <p className="text-gold-300 font-semibold">{a.role}</p>
              <p className="text-navy-100/70 truncate">{a.email}</p>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-navy-100/60">
        <Link href="/" className="hover:text-gold-400">← Back to website</Link>
      </p>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-navy-200/70 bg-ivory/50 px-4 py-3 text-sm text-navy-700 placeholder:text-navy-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 transition";

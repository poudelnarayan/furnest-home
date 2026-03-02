"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = (await res.json()) as { success?: boolean; error?: { message?: string } };
    setStatus(body.success ? "Login successful." : body.error?.message ?? "Login failed.");
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-6xl items-center px-4 py-10">
      <section className="grid w-full overflow-hidden rounded-3xl border border-white/40 bg-white/80 shadow-2xl backdrop-blur md:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-pink-600 p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-white/70">Secure access</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight">Welcome back to your gamer wallet</h1>
            <p className="mt-4 text-white/85">
              Track orders, manage wallet balance, and recharge quickly with trusted payments.
            </p>
          </div>
          <p className="text-sm text-white/75">Protected by JWT auth, secure cookies, and payment-grade controls.</p>
        </div>

        <div className="p-6 sm:p-10">
          <h2 className="text-3xl font-extrabold text-zinc-900">Login</h2>
          <p className="mt-2 text-sm text-zinc-600">Use your account credentials to continue.</p>

          <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-700">Email</span>
              <input
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none ring-indigo-500 transition focus:ring-2"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-700">Password</span>
              <input
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none ring-indigo-500 transition focus:ring-2"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button
              className="mt-2 rounded-xl bg-zinc-900 py-3 font-semibold text-white transition hover:bg-zinc-800"
              type="submit"
            >
              Sign in
            </button>
          </form>

          {status ? <p className="mt-4 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700">{status}</p> : null}

          <p className="mt-6 text-sm text-zinc-600">
            New here?{" "}
            <Link href="/auth/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Create account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

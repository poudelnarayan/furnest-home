"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });
    const body = (await res.json()) as { success?: boolean; error?: { message?: string } };
    setStatus(
      body.success
        ? "Account created. Check email verification token from API response/log flow."
        : body.error?.message ?? "Registration failed.",
    );
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-6xl items-center px-4 py-10">
      <section className="grid w-full overflow-hidden rounded-3xl border border-white/40 bg-white/80 shadow-2xl backdrop-blur md:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-fuchsia-700 via-pink-600 to-indigo-700 p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-white/70">Create profile</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight">Join and unlock full shopping access</h1>
            <p className="mt-4 text-white/85">
              Save wallet history, track delivery status, and manage orders from your account.
            </p>
          </div>
          <p className="text-sm text-white/75">One account for top-ups, accessories, and digital purchases.</p>
        </div>

        <div className="p-6 sm:p-10">
          <h2 className="text-3xl font-extrabold text-zinc-900">Register</h2>
          <p className="mt-2 text-sm text-zinc-600">Create your account in less than a minute.</p>

          <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-700">Full name</span>
              <input
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none ring-pink-500 transition focus:ring-2"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-700">Email</span>
              <input
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none ring-pink-500 transition focus:ring-2"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-700">Password</span>
              <input
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none ring-pink-500 transition focus:ring-2"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button
              className="mt-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 py-3 font-semibold text-white transition hover:from-pink-500 hover:to-indigo-500"
              type="submit"
            >
              Create account
            </button>
          </form>

          {status ? <p className="mt-4 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700">{status}</p> : null}

          <p className="mt-6 text-sm text-zinc-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

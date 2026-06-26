"use client"

import { useActionState } from "react"
import Link from "next/link"
import { register } from "@/features/auth/actions/register"
import { loginPath } from "@/paths"

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, null)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 font-medium">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="agencyName" className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Agency Name
        </label>
        <input
          id="agencyName"
          name="agencyName"
          type="text"
          required
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
          placeholder="Sacred Valley Expeditions"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Your Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
          placeholder="Maria Torres"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Work Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
          placeholder="you@agency.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
          placeholder="Min. 8 characters"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-sm mt-2"
      >
        {pending ? "Creating account…" : "Create Agency Account"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href={loginPath()} className="text-rose-600 font-bold hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { LogIn, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const redirectTo = `${window.location.origin}/dashboard`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      alert("Google login failed.");
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-6 py-8"
    >
      <div className="mx-auto flex min-h-[85vh] max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08, duration: 0.4 }}
            className="flex flex-col justify-center"
          >
            <Link href="/" className="text-sm text-gray-600 hover:underline">
              ← Back to Home
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                We Keep
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-black/5">
                Personal + Mutual Accountability
              </span>
            </div>

            <h1 className="mt-5 text-5xl font-black tracking-tight text-slate-900">
              Make promises feel
              <span className="block text-indigo-600">real.</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              Track personal commitments, build mutual accountability, and make
              follow-through feel clear, premium, and emotionally satisfying.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-lg backdrop-blur">
                <div className="flex items-center gap-2 text-slate-900">
                  <Sparkles size={18} />
                  <p className="font-semibold">Clean experience</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Beautiful flow for capturing and tracking commitments.
                </p>
              </div>

              <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-lg backdrop-blur">
                <div className="flex items-center gap-2 text-slate-900">
                  <ShieldCheck size={18} />
                  <p className="font-semibold">Trusted sign in</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Sign in securely with your Google account.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12, duration: 0.4 }}
            className="flex items-center justify-center"
          >
            <div className="w-full max-w-md rounded-[32px] border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white shadow-xl">
                <LogIn size={28} />
              </div>

              <h2 className="mt-6 text-center text-3xl font-black tracking-tight text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-center text-sm leading-6 text-slate-600">
                Continue with Google to enter your dashboard and manage your
                commitments.
              </p>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={handleGoogleLogin}
                className="mt-8 w-full rounded-2xl bg-black px-5 py-4 text-sm font-semibold text-white shadow-xl shadow-black/10 transition"
              >
                Continue with Google
              </motion.button>

              <p className="mt-4 text-center text-xs leading-6 text-slate-500">
                By continuing, you use your Google account to sign in securely.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.main>
  );
}
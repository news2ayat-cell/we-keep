"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  CheckCheck,
  CheckCircle2,
  LogIn,
  Clock3,
  Handshake,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);

 useEffect(() => {
  const checkUser = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        await supabase.auth.signOut();
        setCheckingUser(false);
        return;
      }

      if (user) {
        router.replace("/dashboard");
        return;
      }

      setCheckingUser(false);
    } catch (error) {
      console.error("Login session check failed:", error);
      await supabase.auth.signOut();
      setCheckingUser(false);
    }
  };

  checkUser();
}, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      console.error(error);
      alert("Google login failed.");
      setLoading(false);
    }
  };

  if (checkingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#07070a] px-4 text-white">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-indigo-600/25 blur-3xl" />
          <div className="absolute right-[-12rem] top-[18rem] h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
        </div>

        <div className="relative rounded-[30px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
              <LockKeyhole size={18} />
            </div>

            <div>
              <p className="text-sm font-black">Checking login status</p>
              <p className="mt-1 text-xs text-white/45">
                Preparing your dashboard...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#07070a] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="absolute right-[-12rem] top-[16rem] h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute bottom-[-16rem] left-[-10rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <nav className="mb-8 flex items-center justify-between rounded-[28px] border border-white/10 bg-white/[0.04] px-4 py-4 shadow-2xl backdrop-blur-xl sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black shadow-lg">
              <Sparkles size={20} />
            </div>

            <div>
              <p className="text-lg font-black tracking-tight">We Keep</p>
              <p className="hidden text-xs text-white/45 sm:block">
                Promises made visible
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            <ArrowLeft size={16} />
            Home
          </Link>
        </nav>

        <section className="grid flex-1 items-center gap-8 pb-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-[38px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-2xl sm:p-7 lg:p-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-indigo-200">
              <ShieldCheck size={15} />
              Secure access
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-6xl">
              Sign in. Keep promises visible.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/58">
              Use Google sign-in to access your commitments, requests, history,
              and mutual accountability flow.
            </p>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-sm font-black text-black shadow-2xl shadow-white/10 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <LogIn size={20} />
              {loading ? "Redirecting to Google..." : "Continue with Google"}
              {!loading && <ArrowRight size={18} />}
            </button>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-black">
                  <LockKeyhole size={17} />
                </div>

                <div>
                  <p className="text-sm font-black">Account-protected access</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    After login, you will go directly to your dashboard.
                    Your Google account connects your commitments to your real
                    identity.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
                <p className="text-2xl font-black">Solo</p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Personal promises.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
                <p className="text-2xl font-black">Mutual</p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Shared accountability.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
                <p className="text-2xl font-black">Done</p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Visible completion.
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.12, duration: 0.5 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-[42px] bg-gradient-to-br from-indigo-500/30 via-fuchsia-500/10 to-cyan-400/20 blur-2xl" />

            <div className="relative rounded-[38px] border border-white/12 bg-white/[0.07] p-4 shadow-2xl backdrop-blur-2xl sm:p-5">
              <div className="rounded-[32px] border border-white/10 bg-[#0d0d13] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white/45">
                      What happens after login
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight">
                      Your promise control room.
                    </h2>
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-white/60">
                    Dashboard
                  </span>
                </div>

                <div className="mt-6 rounded-[28px] bg-gradient-to-br from-white to-slate-200 p-5 text-black shadow-2xl sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">
                        Active commitment
                      </p>
                      <h3 className="mt-3 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                        Finish 2 hours of focused study tonight.
                      </h3>
                    </div>

                    <div className="rounded-2xl bg-amber-300 px-3 py-2 text-xs font-black text-black">
                      Pending
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-black/[0.04] p-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        <p className="text-xs font-semibold text-black/45">
                          Mode
                        </p>
                      </div>
                      <p className="mt-2 font-black">Mutual</p>
                    </div>

                    <div className="rounded-2xl bg-black/[0.04] p-4">
                      <div className="flex items-center gap-2">
                        <Clock3 size={16} />
                        <p className="text-xs font-semibold text-black/45">
                          Due
                        </p>
                      </div>
                      <p className="mt-2 font-black">Tonight</p>
                    </div>

                    <div className="rounded-2xl bg-black/[0.04] p-4">
                      <div className="flex items-center gap-2">
                        <CheckCheck size={16} />
                        <p className="text-xs font-semibold text-black/45">
                          Proof
                        </p>
                      </div>
                      <p className="mt-2 font-black">Both sides confirm</p>
                    </div>

                    <div className="rounded-2xl bg-black/[0.04] p-4">
                      <div className="flex items-center gap-2">
                        <BellRing size={16} />
                        <p className="text-xs font-semibold text-black/45">
                          Reminder
                        </p>
                      </div>
                      <p className="mt-2 font-black">Ready to copy</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
                      <CheckCircle2 size={17} />
                    </div>
                    <p className="mt-4 text-sm font-black">Create</p>
                    <p className="mt-2 text-xs leading-5 text-white/45">
                      Add solo or mutual commitments.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
                      <Handshake size={17} />
                    </div>
                    <p className="mt-4 text-sm font-black">Accept</p>
                    <p className="mt-2 text-xs leading-5 text-white/45">
                      Review incoming mutual requests.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
                      <CheckCheck size={17} />
                    </div>
                    <p className="mt-4 text-sm font-black">Complete</p>
                    <p className="mt-2 text-xs leading-5 text-white/45">
                      Mark progress and finish clearly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </section>
      </div>
    </main>
  );
}
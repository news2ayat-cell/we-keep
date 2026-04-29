"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Clock3,
  Fingerprint,
  Handshake,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";

export default function HomePage() {
  const features = [
    {
      title: "Solo promises",
      text: "Track personal commitments with due dates, status, and completion.",
      icon: CheckCircle2,
    },
    {
      title: "Mutual accountability",
      text: "Invite another person and make both sides confirm completion.",
      icon: Handshake,
    },
    {
      title: "Reminder-ready",
      text: "Turn vague promises into follow-up messages when someone delays.",
      icon: BellRing,
    },
  ];

  const steps = [
    "Write the promise",
    "Set the responsible person",
    "Choose solo or mutual",
    "Track until it is done",
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#07070a] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="absolute right-[-12rem] top-[18rem] h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute bottom-[-16rem] left-[-10rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between rounded-[28px] border border-white/10 bg-white/[0.04] px-4 py-4 shadow-2xl backdrop-blur-xl sm:px-6">
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

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10"
            >
              Login
            </Link>

            <Link
              href="/dashboard"
              className="hidden rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black shadow-xl transition hover:scale-[1.02] sm:inline-flex"
            >
              Dashboard
            </Link>
          </div>
        </nav>

        <section className="grid min-h-[calc(100vh-110px)] items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-indigo-200">
              <ShieldCheck size={15} />
              Accountability app
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-white sm:text-6xl md:text-7xl lg:text-8xl">
              Promises should not disappear.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/62 sm:text-lg">
              We Keep turns loose promises into visible commitments — with due
              dates, status, reminders, and mutual confirmation when another
              person is involved.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/commitments/new"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-black shadow-2xl shadow-white/10 transition hover:scale-[1.02]"
              >
                Create commitment
                <ArrowRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/chat-import"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-4 text-sm font-bold text-white shadow-xl backdrop-blur transition hover:bg-white/10"
              >
                <MessageSquareText size={18} />
                Paste from chat
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur">
                <p className="text-3xl font-black">Solo</p>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  For personal discipline.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur">
                <p className="text-3xl font-black">Mutual</p>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  For shared accountability.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur">
                <p className="text-3xl font-black">Proof</p>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  For visible completion.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.12, duration: 0.55 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-[42px] bg-gradient-to-br from-indigo-500/30 via-fuchsia-500/10 to-cyan-400/20 blur-2xl" />

            <div className="relative rounded-[38px] border border-white/12 bg-white/[0.07] p-4 shadow-2xl backdrop-blur-2xl sm:p-5">
              <div className="rounded-[32px] border border-white/10 bg-[#0d0d13] p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-yellow-400" />
                    <span className="h-3 w-3 rounded-full bg-green-400" />
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-white/60">
                    Live commitment
                  </span>
                </div>

                <div className="rounded-[28px] bg-gradient-to-br from-white to-slate-200 p-5 text-black shadow-2xl sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">
                        Promise
                      </p>
                      <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                        Finish 2 hours of focused study tonight.
                      </h2>
                    </div>

                    <div className="rounded-2xl bg-amber-300 px-3 py-2 text-xs font-black text-black">
                      Pending
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-black/[0.04] p-4">
                      <p className="text-xs font-semibold text-black/45">
                        Responsible
                      </p>
                      <p className="mt-1 font-black">You</p>
                    </div>

                    <div className="rounded-2xl bg-black/[0.04] p-4">
                      <p className="text-xs font-semibold text-black/45">
                        Due
                      </p>
                      <p className="mt-1 font-black">Today, 10:30 PM</p>
                    </div>

                    <div className="rounded-2xl bg-black/[0.04] p-4">
                      <p className="text-xs font-semibold text-black/45">
                        Mode
                      </p>
                      <p className="mt-1 font-black">Mutual</p>
                    </div>

                    <div className="rounded-2xl bg-black/[0.04] p-4">
                      <p className="text-xs font-semibold text-black/45">
                        Proof
                      </p>
                      <p className="mt-1 font-black">Both sides confirm</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-black p-4 text-white">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
                        <Users size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-black">
                          Waiting for confirmation
                        </p>
                        <p className="text-xs text-white/50">
                          The promise becomes complete only after both sides
                          mark done.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {features.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
                          <Icon size={17} />
                        </div>
                        <p className="mt-4 text-sm font-black">
                          {item.title}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-white/45">
                          {item.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="py-12">
          <div className="rounded-[38px] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                  <Zap size={14} />
                  Product flow
                </div>

                <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
                  One promise. Four clear steps.
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">
                  The product should stay simple. The goal is not to create
                  another complex task manager. The goal is to remove ambiguity.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {steps.map((step, index) => (
                  <div
                    key={step}
                    className="rounded-[26px] border border-white/10 bg-black/20 p-5"
                  >
                    <p className="text-sm font-black text-indigo-300">
                      0{index + 1}
                    </p>
                    <p className="mt-3 text-lg font-black">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 py-12 lg:grid-cols-3">
          <div className="rounded-[34px] border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
              <Target size={20} />
            </div>
            <h3 className="mt-6 text-2xl font-black tracking-tight">
              For discipline
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/55">
              Create clear commitments for study, habits, fitness, work, or
              personal goals.
            </p>
          </div>

          <div className="rounded-[34px] border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
              <Fingerprint size={20} />
            </div>
            <h3 className="mt-6 text-2xl font-black tracking-tight">
              For trust
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/55">
              Mutual commitments are not completed by one person alone. Both
              sides have to confirm.
            </p>
          </div>

          <div className="rounded-[34px] border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
              <LockKeyhole size={20} />
            </div>
            <h3 className="mt-6 text-2xl font-black tracking-tight">
              For clarity
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/55">
              Every promise has a status: pending, awaiting, overdue, rejected,
              or done.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-white p-6 text-black shadow-2xl sm:p-10">
            <div className="absolute right-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-700">
                  Start now
                </p>
                <h2 className="mt-3 max-w-2xl text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
                  Make your next promise impossible to ignore.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-black/60">
                  Start with one commitment. If the core loop feels useful, the
                  app has real potential.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-6 py-4 text-sm font-black text-black shadow-sm transition hover:scale-[1.02]"
                >
                  Sign in
                </Link>

                <Link
                  href="/commitments/new"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-6 py-4 text-sm font-black text-white shadow-xl transition hover:scale-[1.02]"
                >
                  Create commitment
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
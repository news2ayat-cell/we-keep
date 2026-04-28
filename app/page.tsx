"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  LockKeyhole,
  Sparkles,
  Users,
} from "lucide-react";

export default function HomePage() {
  const featureCards = [
    {
      title: "Personal commitments",
      text: "Track your own promises, reminders, and tasks with a cleaner and more premium workflow.",
      icon: CheckCircle2,
    },
    {
      title: "Mutual accountability",
      text: "Build toward two-sided commitments where both people can accept, track, and confirm completion.",
      icon: Users,
    },
    {
      title: "Reminder-ready flow",
      text: "Turn promises into clear actions and copy reminders quickly when follow-up is needed.",
      icon: BellRing,
    },
    {
      title: "Secure sign in",
      text: "Use Google login for a trusted identity layer and stronger accountability later.",
      icon: LockKeyhole,
    },
  ];

  return (
    <motion.main
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-6 py-8"
    >
      <div className="mx-auto max-w-6xl">
        <motion.nav
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 }}
          className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/60 bg-white/75 px-6 py-4 shadow-xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white shadow-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-slate-900">
                We Keep
              </p>
              <p className="text-xs text-slate-500">
                Personal + Mutual Commitments
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:scale-[1.02]"
            >
              Login
            </Link>

            <Link
              href="/dashboard"
              className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white shadow-xl shadow-black/10 transition hover:scale-[1.02]"
            >
              Open Dashboard
            </Link>
          </div>
        </motion.nav>

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.section
            initial={{ opacity: 0, x: -22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
          >
            <div className="inline-flex rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
              A better way to track promises
            </div>

            <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-900 md:text-6xl">
              Make promises
              <span className="block text-indigo-600">feel real.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              Capture personal commitments, prepare for mutual accountability,
              and turn follow-through into something visible, structured, and
              emotionally satisfying.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/commitments/new"
                className="inline-flex items-center gap-2 rounded-2xl bg-black px-6 py-4 text-sm font-semibold text-white shadow-2xl shadow-black/10 transition hover:scale-[1.02]"
              >
                Create Commitment
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/chat-import"
                className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-6 py-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:scale-[1.02]"
              >
                Paste Chat
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-slate-700 ring-1 ring-black/5">
                Solo tracking
              </span>
              <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-slate-700 ring-1 ring-black/5">
                Google sign-in
              </span>
              <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-slate-700 ring-1 ring-black/5">
                Reminder flow
              </span>
              <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-slate-700 ring-1 ring-black/5">
                Mutual mode coming
              </span>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.16, duration: 0.45 }}
            className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 text-white shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white/70">Live product vision</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">
                    Commitments with real weight
                  </h2>
                </div>

                <div className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                  MVP
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-white/70">
                    Step 1
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    Capture a promise cleanly
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-white/70">
                    Step 2
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    Track status and reminders
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-white/70">
                    Step 3
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    Bring in mutual acceptance
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-white/70">
                    Step 4
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    Both sides confirm done
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {featureCards.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 + index * 0.05, duration: 0.3 }}
                    whileHover={{ y: -4 }}
                    className="rounded-[24px] border border-white/60 bg-slate-50/90 p-5 shadow-lg"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white shadow-md">
                      <Icon size={18} />
                    </div>

                    <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.text}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="mt-12 rounded-[32px] border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
                Start now
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                Turn intention into accountability
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Begin with solo commitments now. Then grow into the stronger
                mutual system where promises become shared, accepted, and harder
                to ignore.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:scale-[1.02]"
              >
                Sign in
              </Link>

              <Link
                href="/dashboard"
                className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-black/10 transition hover:scale-[1.02]"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </motion.main>
  );
}
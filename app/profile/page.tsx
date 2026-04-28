"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Inbox,
  Mail,
  Shield,
  UserRound,
  Users,
} from "lucide-react";

type ProfileRow = {
  id: string | null;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type CommitmentRow = {
  id: number;
  mode: string | null;
  status: string | null;
  partner_email: string | null;
  created_by: string | null;
};

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [createdCount, setCreatedCount] = useState(0);
  const [incomingCount, setIncomingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [activeMutualCount, setActiveMutualCount] = useState(0);

  const getInitials = (label: string) => {
    const cleaned = label.trim();
    if (!cleaned) return "?";

    const parts = cleaned.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  };

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setIsLoggedIn(false);
        setMounted(true);
        return;
      }

      setIsLoggedIn(true);
      setEmail(user.email);

      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? "",
        avatar_url: user.user_metadata?.avatar_url ?? "",
      });

      const normalizedEmail = user.email.trim().toLowerCase();

      const [profileResponse, createdResponse, incomingResponse] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("commitments")
          .select("id, mode, status, partner_email, created_by")
          .eq("created_by", user.id),
        supabase
          .from("commitments")
          .select("id, mode, status, partner_email, created_by")
          .eq("mode", "mutual")
          .eq("partner_email", normalizedEmail),
      ]);

      const profile = profileResponse.data as ProfileRow | null;

      setFullName(profile?.full_name ?? user.user_metadata?.full_name ?? "");
      setAvatarUrl(profile?.avatar_url ?? user.user_metadata?.avatar_url ?? "");

      const createdItems = (createdResponse.data ?? []) as CommitmentRow[];
      const incomingItems = (incomingResponse.data ?? []) as CommitmentRow[];

      const mergedMap = new Map<number, CommitmentRow>();
      [...createdItems, ...incomingItems].forEach((item) => {
        mergedMap.set(item.id, item);
      });

      const merged = Array.from(mergedMap.values());

      setCreatedCount(createdItems.length);
      setIncomingCount(incomingItems.length);
      setCompletedCount(
        merged.filter((item) => (item.status ?? "") === "done").length
      );
      setActiveMutualCount(
        createdItems.filter(
          (item) =>
            (item.mode ?? "") === "mutual" &&
            (item.status ?? "") !== "awaiting_acceptance" &&
            (item.status ?? "") !== "rejected" &&
            (item.status ?? "") !== "done"
        ).length
      );

      setMounted(true);
    };

    loadProfile();
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-slate-600">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-2xl rounded-[28px] border border-white/60 bg-white/80 p-6 sm:p-8 shadow-2xl backdrop-blur">
          <Link href="/" className="text-sm text-slate-600 hover:underline">
            ← Back to Home
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            You are not logged in
          </h1>
          <p className="mt-2 text-slate-600">
            Please sign in with Google first.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 text-white"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  const displayName = fullName.trim() || email;
  const initials = getInitials(displayName);

  return (
    <motion.main
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-4 py-6 sm:px-6 sm:py-8"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-[30px] border border-white/60 bg-white/80 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-4">
            <div>
              <Link
                href="/dashboard"
                className="text-sm text-slate-600 hover:underline"
              >
                ← Back to Dashboard
              </Link>

              <h1 className="mt-3 break-words text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                Profile
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Your account overview and commitment summary.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-slate-800 shadow-sm"
              >
                Dashboard
              </Link>

              <Link
                href="/history"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-slate-800 shadow-sm"
              >
                History
              </Link>

              <Link
                href="/commitments/new"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white shadow-lg"
              >
                New Commitment
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
          <div className="rounded-[30px] border border-white/60 bg-white/80 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="h-24 w-24 rounded-[28px] object-cover shadow-lg ring-4 ring-white sm:h-28 sm:w-28"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-slate-900 text-2xl font-black text-white shadow-lg sm:h-28 sm:w-28 sm:text-3xl">
                  {initials}
                </div>
              )}

              <h2 className="mt-4 break-words text-2xl font-black tracking-tight text-slate-900">
                {displayName}
              </h2>

              <div className="mt-4 w-full space-y-3 text-left">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                  <Mail size={18} className="mt-0.5 shrink-0 text-slate-600" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="break-all text-sm font-medium text-slate-900">
                      {email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                  <UserRound
                    size={18}
                    className="mt-0.5 shrink-0 text-slate-600"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Full Name</p>
                    <p className="break-words text-sm font-medium text-slate-900">
                      {fullName.trim() || "Not available from Google profile"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-indigo-50 px-4 py-3 ring-1 ring-indigo-100">
                  <Shield size={18} className="mt-0.5 shrink-0 text-indigo-600" />
                  <div className="min-w-0">
                    <p className="text-xs text-indigo-600">Account Type</p>
                    <p className="break-words text-sm font-medium text-slate-900">
                      Google Sign-In account
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  label: "Created by You",
                  value: createdCount,
                  icon: CalendarDays,
                  color: "from-slate-900 to-slate-700 text-white",
                },
                {
                  label: "Incoming Mutual",
                  value: incomingCount,
                  icon: Inbox,
                  color: "from-sky-500 to-indigo-600 text-white",
                },
                {
                  label: "Completed",
                  value: completedCount,
                  icon: CheckCircle2,
                  color: "from-emerald-500 to-green-600 text-white",
                },
                {
                  label: "Active Mutual",
                  value: activeMutualCount,
                  icon: Users,
                  color: "from-amber-400 to-yellow-500 text-slate-900",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className={`rounded-[28px] bg-gradient-to-br ${item.color} p-5 shadow-xl`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium opacity-90">{item.label}</p>
                      <Icon size={22} className="opacity-90" />
                    </div>
                    <p className="mt-5 text-4xl font-black tracking-tight">
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-[30px] border border-white/60 bg-white/80 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
              <h3 className="text-2xl font-black tracking-tight text-slate-900">
                Quick Access
              </h3>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/dashboard"
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white shadow-lg"
                >
                  Open Dashboard
                </Link>

                <Link
                  href="/history"
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-slate-800 shadow-sm"
                >
                  Open History
                </Link>

                <Link
                  href="/commitments/new"
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-slate-800 shadow-sm"
                >
                  New Commitment
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
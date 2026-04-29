"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  History,
  Lock,
  LogOut,
  Mail,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Users,
} from "lucide-react";
import Toast from "@/components/ui/toast";
import ConfirmModal from "@/components/ui/confirm-modal";

type ToastVariant = "success" | "error" | "info";

type CommitmentRow = {
  id: number;
  mode: string | null;
  status: string | null;
  creator_done: boolean | null;
  partner_done: boolean | null;
};

type ProfileRow = {
  id: string | null;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type AccountStats = {
  total: number;
  solo: number;
  mutual: number;
  done: number;
  pending: number;
  awaiting: number;
  deletable: number;
  locked: number;
};

export default function ProfilePage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [stats, setStats] = useState<AccountStats>({
    total: 0,
    solo: 0,
    mutual: 0,
    done: 0,
    pending: 0,
    awaiting: 0,
    deletable: 0,
    locked: 0,
  });

  const [signingOut, setSigningOut] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<ToastVariant>("info");

  const showToast = (
    title: string,
    message = "",
    variant: ToastVariant = "info"
  ) => {
    setToastTitle(title);
    setToastMessage(message);
    setToastVariant(variant);
    setToastOpen(true);
  };

  const normalizeEmail = (email: string) => email.trim().toLowerCase();

  const canDeleteCommitment = (commitment: CommitmentRow) => {
    const mode = commitment.mode ?? "solo";
    const status = commitment.status ?? "pending";

    if (mode === "solo") return true;

    return (
      status === "awaiting_acceptance" ||
      status === "rejected" ||
      status === "done"
    );
  };

  const isDoneCommitment = (commitment: CommitmentRow) => {
    if (commitment.status === "done") return true;

    if (
      commitment.mode === "mutual" &&
      commitment.creator_done &&
      commitment.partner_done
    ) {
      return true;
    }

    return false;
  };

  const loadAccountStats = async (currentUserId: string) => {
    const { data, error } = await supabase
      .from("commitments")
      .select("id, mode, status, creator_done, partner_done")
      .eq("created_by", currentUserId);

    if (error) {
      showToast(
        "Stats load failed",
        `${error.message}${error.code ? ` (${error.code})` : ""}`,
        "error"
      );
      return;
    }

    const rows = (data ?? []) as CommitmentRow[];

    const total = rows.length;
    const solo = rows.filter((item) => (item.mode ?? "solo") === "solo").length;
    const mutual = rows.filter((item) => item.mode === "mutual").length;
    const done = rows.filter(isDoneCommitment).length;
    const awaiting = rows.filter(
      (item) => item.status === "awaiting_acceptance"
    ).length;
    const pending = rows.filter(
      (item) => !isDoneCommitment(item) && item.status !== "rejected"
    ).length;
    const deletable = rows.filter(canDeleteCommitment).length;
    const locked = rows.filter((item) => !canDeleteCommitment(item)).length;

    setStats({
      total,
      solo,
      mutual,
      done,
      pending,
      awaiting,
      deletable,
      locked,
    });
  };

  const loadPage = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setMounted(true);
        return;
      }

      if (!user?.email) {
        setIsLoggedIn(false);
        setMounted(true);
        return;
      }

      const normalizedEmail = normalizeEmail(user.email);

      setIsLoggedIn(true);
      setUserId(user.id);
      setUserEmail(normalizedEmail);

      const metadataFullName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : "";
      const metadataAvatar =
        typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : "";

      await supabase.from("profiles").upsert({
        id: user.id,
        email: normalizedEmail,
        full_name: metadataFullName,
        avatar_url: metadataAvatar,
      });

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url")
        .eq("id", user.id)
        .single();

      const profile = profileData as ProfileRow | null;

      setFullName(profile?.full_name ?? metadataFullName ?? "");
      setAvatarUrl(profile?.avatar_url ?? metadataAvatar ?? "");

      await loadAccountStats(user.id);
      setMounted(true);
    } catch (error) {
      console.error("Profile load failed:", error);
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setMounted(true);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);

    await supabase.auth.signOut();

    showToast("Signed out", "You have been logged out.", "success");

    setTimeout(() => {
      router.push("/login");
    }, 700);
  };

  const handleClearCreatedConfirm = async () => {
    if (!userId || clearing) return;

    setClearing(true);

    const { data, error: loadError } = await supabase
      .from("commitments")
      .select("id, mode, status, creator_done, partner_done")
      .eq("created_by", userId);

    if (loadError) {
      showToast(
        "Could not load commitments",
        `${loadError.message}${loadError.code ? ` (${loadError.code})` : ""}`,
        "error"
      );
      setClearing(false);
      setClearModalOpen(false);
      return;
    }

    const rows = (data ?? []) as CommitmentRow[];
    const deletableRows = rows.filter(canDeleteCommitment);
    const lockedRows = rows.filter((item) => !canDeleteCommitment(item));

    if (deletableRows.length === 0) {
      showToast(
        "Nothing was cleared",
        lockedRows.length > 0
          ? "Accepted mutual commitments are locked until they are completed."
          : "You do not have removable created commitments right now.",
        "info"
      );
      setClearing(false);
      setClearModalOpen(false);
      return;
    }

    const ids = deletableRows.map((item) => item.id);

    const { error: deleteError } = await supabase
      .from("commitments")
      .delete()
      .in("id", ids)
      .eq("created_by", userId);

    if (deleteError) {
      showToast(
        "Clear failed",
        `${deleteError.message}${
          deleteError.code ? ` (${deleteError.code})` : ""
        }`,
        "error"
      );
      setClearing(false);
      setClearModalOpen(false);
      return;
    }

    localStorage.removeItem("editingCommitmentId");
    localStorage.removeItem("draftSourceText");

    await loadAccountStats(userId);

    showToast(
      "Clear finished",
      lockedRows.length > 0
        ? `${deletableRows.length} cleared. ${lockedRows.length} locked mutual commitment${
            lockedRows.length > 1 ? "s were" : " was"
          } kept.`
        : `${deletableRows.length} commitment${
            deletableRows.length > 1 ? "s were" : " was"
          } cleared.`,
      "success"
    );

    setClearing(false);
    setClearModalOpen(false);
  };

  const displayName = fullName.trim() || userEmail.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#07070a] px-4 text-white">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-indigo-600/25 blur-3xl" />
          <div className="absolute right-[-12rem] top-[18rem] h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
        </div>

        <div className="relative rounded-[30px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
              <Settings size={18} />
            </div>

            <div>
              <p className="text-sm font-black">Loading profile</p>
              <p className="mt-1 text-xs text-white/45">
                Reading your account settings...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }
    if (!isLoggedIn) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#07070a] px-4 py-6 text-white sm:px-6 sm:py-8">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-indigo-600/25 blur-3xl" />
          <div className="absolute right-[-12rem] top-[18rem] h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-2xl rounded-[34px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-white">
            You are not logged in
          </h1>

          <p className="mt-3 text-sm leading-7 text-white/55">
            Please sign in with Google first to view your profile.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-black shadow-xl shadow-white/10 transition hover:scale-[1.02]"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <Toast
        show={toastOpen}
        title={toastTitle}
        message={toastMessage}
        variant={toastVariant}
        onClose={() => setToastOpen(false)}
      />

      <ConfirmModal
        open={clearModalOpen}
        title="Clear your created commitments?"
        message="This removes only commitments that are safe to delete. Accepted mutual commitments that are not completed will stay locked."
        confirmText={clearing ? "Clearing..." : "Clear allowed"}
        cancelText="Cancel"
        danger
        onConfirm={handleClearCreatedConfirm}
        onCancel={() => setClearModalOpen(false)}
      />

      <motion.main
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="min-h-screen overflow-hidden bg-[#07070a] px-4 pb-28 pt-5 text-white sm:px-6 sm:py-8"
      >
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-indigo-600/25 blur-3xl" />
          <div className="absolute right-[-12rem] top-[18rem] h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="absolute bottom-[-16rem] left-[-10rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-6 flex items-center justify-between rounded-[28px] border border-white/10 bg-white/[0.04] px-4 py-4 shadow-2xl backdrop-blur-xl sm:px-6"
          >
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black shadow-lg">
                <Sparkles size={20} />
              </div>

              <div>
                <p className="text-lg font-black tracking-tight">We Keep</p>
                <p className="hidden text-xs text-white/45 sm:block">
                  Account and settings
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10 sm:px-5"
              >
                <CalendarDays size={17} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="hidden items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-black shadow-xl shadow-white/10 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 sm:inline-flex"
              >
                <LogOut size={17} />
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </motion.nav>

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden rounded-[38px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-2xl sm:p-7 lg:p-8"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-indigo-200">
                <ShieldCheck size={15} />
                Account profile
              </div>

              <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-24 w-24 rounded-[32px] border border-white/10 object-cover shadow-2xl"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-[32px] border border-white/10 bg-white text-3xl font-black text-black shadow-2xl">
                    {initials}
                  </div>
                )}

                <div className="min-w-0">
                  <h1 className="break-words text-4xl font-black leading-none tracking-[-0.05em] text-white sm:text-5xl">
                    {displayName}
                  </h1>

                  <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-2 text-sm font-bold text-white/70">
                    <Mail size={15} className="shrink-0" />
                    <span className="break-all">{userEmail}</span>
                  </div>
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
                    <User size={18} />
                  </div>
                  <p className="mt-4 text-sm font-bold text-white/50">
                    User ID
                  </p>
                  <p className="mt-1 break-all text-sm font-black text-white">
                    {userId}
                  </p>
                </div>

                <div className="rounded-[26px] border border-emerald-300/35 bg-emerald-400/10 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300 text-black">
                    <ShieldCheck size={18} />
                  </div>
                  <p className="mt-4 text-sm font-bold text-white/50">
                    Login method
                  </p>
                  <p className="mt-1 text-sm font-black text-white">
                    Google OAuth
                  </p>
                </div>
              </div>

              <div className="mt-7 rounded-[30px] border border-indigo-300/25 bg-indigo-400/10 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-300 text-black">
                    <Lock size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-white">
                      Account-protected commitments
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/60">
                      Your commitments are attached to your logged-in account.
                      Mutual commitments use partner email to decide who can see
                      and respond to incoming requests.
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.35 }}
              className="rounded-[38px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-2xl sm:p-7 lg:p-8"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
                    <History size={15} />
                    Commitment summary
                  </div>

                  <h2 className="mt-5 text-4xl font-black leading-none tracking-[-0.05em] text-white">
                    Your created items.
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
                    This summary only counts commitments created by you. Incoming
                    mutual commitments are handled inside the dashboard.
                  </p>
                </div>

                <Link
                  href="/commitments/new"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-black shadow-xl shadow-white/10 transition hover:scale-[1.02]"
                >
                  <Plus size={17} />
                  New commitment
                </Link>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[28px] border border-white/15 bg-white/[0.06] p-5 shadow-xl">
                  <CalendarDays size={20} className="text-white/70" />
                  <p className="mt-5 text-4xl font-black">{stats.total}</p>
                  <p className="mt-1 text-sm font-bold text-white/50">Total</p>
                </div>

                <div className="rounded-[28px] border border-amber-300/70 bg-[#352407] p-5 shadow-xl">
                  <Clock3 size={20} className="text-amber-200" />
                  <p className="mt-5 text-4xl font-black">{stats.pending}</p>
                  <p className="mt-1 text-sm font-bold text-white/60">
                    Pending
                  </p>
                </div>

                <div className="rounded-[28px] border border-emerald-300/70 bg-[#042a22] p-5 shadow-xl">
                  <CheckCircle2 size={20} className="text-emerald-200" />
                  <p className="mt-5 text-4xl font-black">{stats.done}</p>
                  <p className="mt-1 text-sm font-bold text-white/60">Done</p>
                </div>

                <div className="rounded-[28px] border border-sky-300/70 bg-[#06283f] p-5 shadow-xl">
                  <Users size={20} className="text-sky-200" />
                  <p className="mt-5 text-4xl font-black">{stats.mutual}</p>
                  <p className="mt-1 text-sm font-bold text-white/60">
                    Mutual
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[30px] border border-white/10 bg-black/20 p-5">
                  <p className="text-lg font-black text-white">
                    Commitment breakdown
                  </p>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                      <span className="text-sm font-bold text-white/60">
                        Solo
                      </span>
                      <span className="text-sm font-black text-white">
                        {stats.solo}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                      <span className="text-sm font-bold text-white/60">
                        Mutual
                      </span>
                      <span className="text-sm font-black text-white">
                        {stats.mutual}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-sky-300/25 bg-sky-400/10 px-4 py-3">
                      <span className="text-sm font-bold text-sky-100">
                        Awaiting acceptance
                      </span>
                      <span className="text-sm font-black text-sky-100">
                        {stats.awaiting}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] border border-white/10 bg-black/20 p-5">
                  <p className="text-lg font-black text-white">
                    Account actions
                  </p>

                  <div className="mt-5 grid gap-3">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm font-black text-white/85 transition hover:bg-white/10"
                    >
                      <CalendarDays size={17} />
                      Open dashboard
                    </Link>

                    <Link
                      href="/history"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm font-black text-white/85 transition hover:bg-white/10"
                    >
                      <History size={17} />
                      View history
                    </Link>

                    <button
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-black shadow-xl shadow-white/10 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <LogOut size={17} />
                      {signingOut ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          </section>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.35 }}
            className="mt-6 rounded-[38px] border border-rose-300/25 bg-rose-400/10 p-5 shadow-2xl backdrop-blur-2xl sm:p-7"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-400 text-white shadow-xl">
                  <AlertTriangle size={24} />
                </div>

                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-100">
                    Danger zone
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                    Clear created commitments
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm leading-7 text-white/60">
                    This clears only commitments created by you that are safe to
                    delete. Accepted mutual commitments that are not completed
                    remain locked.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/70">
                      {stats.deletable} deletable
                    </span>
                    <span className="rounded-full bg-rose-400/20 px-3 py-1 text-xs font-black text-rose-100">
                      {stats.locked} locked
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setClearModalOpen(true)}
                disabled={clearing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-400 px-5 py-4 text-sm font-black text-white shadow-xl shadow-rose-950/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                <Trash2 size={17} />
                {clearing ? "Clearing..." : "Clear allowed commitments"}
              </button>
            </div>
          </motion.section>
        </div>
      </motion.main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#07070a]/95 px-3 pb-3 pt-2 shadow-2xl backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2">
          <Link
            href="/dashboard"
            className="flex flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs font-bold text-white/60"
          >
            <CalendarDays size={20} />
            <span className="mt-1">Home</span>
          </Link>

          <Link
            href="/commitments/new"
            className="-mt-7 flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white text-black shadow-xl shadow-white/10"
            aria-label="New Commitment"
          >
            <Plus size={25} />
          </Link>

          <Link
            href="/history"
            className="flex flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs font-bold text-white/60"
          >
            <History size={20} />
            <span className="mt-1">History</span>
          </Link>

          <Link
            href="/profile"
            className="flex flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs font-black text-white"
          >
            <User size={20} />
            <span className="mt-1">Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
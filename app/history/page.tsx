"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  Clock3,
  History,
  Inbox,
  Info,
  LogOut,
  MessageSquareText,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import Toast from "@/components/ui/toast";

type ToastVariant = "success" | "error" | "info";

type DisplayStatus =
  | "Pending"
  | "Awaiting"
  | "Done"
  | "Overdue"
  | "Rejected";

type Commitment = {
  id: number;
  title: string;
  description: string;
  sourceText: string;
  responsiblePerson: string;
  partnerEmail: string;
  dueDate: string;
  category: string;
  status: string;
  mode: "solo" | "mutual";
  createdBy: string;
  createdAt: string;
  creatorDone: boolean;
  partnerDone: boolean;
};

type DashboardRow = {
  id: number;
  title: string | null;
  description: string | null;
  source_text: string | null;
  responsible_person: string | null;
  partner_email: string | null;
  due_date: string | null;
  category: string | null;
  status: string | null;
  mode: string | null;
  created_by: string | null;
  created_at: string | null;
  creator_done: boolean | null;
  partner_done: boolean | null;
};

type CommitmentEvent = {
  id: number;
  commitmentId: number;
  actorEmail: string;
  eventType: string;
  eventLabel: string;
  details: string;
  createdAt: string;
};

type EventRow = {
  id: number;
  commitment_id: number | null;
  actor_email: string | null;
  event_type: string | null;
  event_label: string | null;
  details: string | null;
  created_at: string | null;
};

type GroupedHistory = {
  commitment: Commitment;
  events: CommitmentEvent[];
};

export default function HistoryPage() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [events, setEvents] = useState<CommitmentEvent[]>([]);
  const [searchText, setSearchText] = useState("");

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

  const mapRowToCommitment = (item: DashboardRow): Commitment => ({
    id: item.id,
    title: item.title ?? "",
    description: item.description ?? "",
    sourceText: item.source_text ?? "",
    responsiblePerson: item.responsible_person ?? "",
    partnerEmail: item.partner_email ?? "",
    dueDate: item.due_date ?? "",
    category: item.category ?? "Task",
    status: item.status ?? "pending",
    mode: (item.mode ?? "solo") as "solo" | "mutual",
    createdBy: item.created_by ?? "",
    createdAt: item.created_at ?? "",
    creatorDone: item.creator_done ?? false,
    partnerDone: item.partner_done ?? false,
  });

  const mapRowToEvent = (item: EventRow): CommitmentEvent => ({
    id: item.id,
    commitmentId: item.commitment_id ?? 0,
    actorEmail: item.actor_email ?? "",
    eventType: item.event_type ?? "info",
    eventLabel: item.event_label ?? "Event",
    details: item.details ?? "",
    createdAt: item.created_at ?? "",
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return dateString || "Unknown date";
    }

    return date.toLocaleString();
  };

  const getDisplayStatus = (commitment: Commitment): DisplayStatus => {
    if (
      commitment.mode === "mutual" &&
      commitment.creatorDone &&
      commitment.partnerDone
    ) {
      return "Done";
    }

    if (commitment.status === "done") return "Done";
    if (commitment.status === "rejected") return "Rejected";
    if (commitment.status === "awaiting_acceptance") return "Awaiting";

    const dueDate = new Date(commitment.dueDate);
    const now = new Date();

    if (!isNaN(dueDate.getTime()) && dueDate < now) {
      return "Overdue";
    }

    return "Pending";
  };

  const getStatusTheme = (displayStatus: DisplayStatus) => {
    if (displayStatus === "Done") {
      return {
        badge: "bg-emerald-300 text-emerald-950",
        card: "border-emerald-300/70 bg-[#042a22]",
        rail: "bg-emerald-300",
        icon: CheckCircle2,
      };
    }

    if (displayStatus === "Overdue") {
      return {
        badge: "bg-rose-400 text-white",
        card: "border-rose-300/75 bg-[#3a0712]",
        rail: "bg-rose-400",
        icon: AlertTriangle,
      };
    }

    if (displayStatus === "Awaiting") {
      return {
        badge: "bg-sky-300 text-sky-950",
        card: "border-sky-300/75 bg-[#06283f]",
        rail: "bg-sky-300",
        icon: Inbox,
      };
    }

    if (displayStatus === "Rejected") {
      return {
        badge: "bg-slate-400 text-slate-950",
        card: "border-slate-400/60 bg-[#1f2937]",
        rail: "bg-slate-400",
        icon: XCircle,
      };
    }

    return {
      badge: "bg-amber-300 text-amber-950",
      card: "border-amber-300/75 bg-[#352407]",
      rail: "bg-amber-300",
      icon: Clock3,
    };
  };

  const getEventIcon = (eventType: string) => {
    if (
      eventType.includes("done") ||
      eventType.includes("completed") ||
      eventType.includes("accepted")
    ) {
      return CheckCheck;
    }

    if (eventType.includes("rejected")) {
      return XCircle;
    }

    if (eventType.includes("created")) {
      return Plus;
    }

    return History;
  };

  const loadHistory = async (currentUserId: string, currentUserEmail: string) => {
    const normalizedEmail = normalizeEmail(currentUserEmail);

    const [ownedResponse, incomingResponse] = await Promise.all([
      supabase
        .from("commitments")
        .select("*")
        .eq("created_by", currentUserId)
        .order("created_at", { ascending: false }),
      supabase
        .from("commitments")
        .select("*")
        .eq("mode", "mutual")
        .eq("partner_email", normalizedEmail)
        .order("created_at", { ascending: false }),
    ]);

    if (ownedResponse.error) {
      showToast(
        "History load failed",
        `${ownedResponse.error.message}${
          ownedResponse.error.code ? ` (${ownedResponse.error.code})` : ""
        }`,
        "error"
      );
      return;
    }

    if (incomingResponse.error) {
      showToast(
        "Incoming history load failed",
        `${incomingResponse.error.message}${
          incomingResponse.error.code ? ` (${incomingResponse.error.code})` : ""
        }`,
        "error"
      );
      return;
    }

    const merged = [
      ...(ownedResponse.data ?? []),
      ...(incomingResponse.data ?? []),
    ];

    const uniqueMap = new Map<number, Commitment>();

    merged.forEach((item) => {
      uniqueMap.set(item.id, mapRowToCommitment(item as DashboardRow));
    });

    const finalCommitments = Array.from(uniqueMap.values()).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setCommitments(finalCommitments);

    const commitmentIds = finalCommitments.map((item) => item.id);

    if (commitmentIds.length === 0) {
      setEvents([]);
      return;
    }

    const { data: eventData, error: eventError } = await supabase
      .from("commitment_events")
      .select("*")
      .in("commitment_id", commitmentIds)
      .order("created_at", { ascending: false });

    if (eventError) {
      showToast(
        "Activity load failed",
        `${eventError.message}${eventError.code ? ` (${eventError.code})` : ""}`,
        "error"
      );
      return;
    }

    setEvents((eventData ?? []).map((item) => mapRowToEvent(item as EventRow)));
  };

  useEffect(() => {
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

        setIsLoggedIn(true);
        setUserId(user.id);
        setUserEmail(user.email);

        await loadHistory(user.id, user.email);
        setMounted(true);
      } catch (error) {
        console.error("History load failed:", error);
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setMounted(true);
      }
    };

    loadPage();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    showToast("Signed out", "You have been logged out.", "success");

    setTimeout(() => {
      window.location.href = "/login";
    }, 700);
  };

  const groupedHistory = useMemo<GroupedHistory[]>(() => {
    const eventMap: Record<number, CommitmentEvent[]> = {};

    events.forEach((event) => {
      if (!eventMap[event.commitmentId]) {
        eventMap[event.commitmentId] = [];
      }

      eventMap[event.commitmentId].push(event);
    });

    return commitments.map((commitment) => ({
      commitment,
      events: eventMap[commitment.id] ?? [],
    }));
  }, [commitments, events]);

  const filteredHistory = groupedHistory.filter(({ commitment, events }) => {
    const search = searchText.trim().toLowerCase();

    if (!search) return true;

    return (
      commitment.title.toLowerCase().includes(search) ||
      commitment.description.toLowerCase().includes(search) ||
      commitment.sourceText.toLowerCase().includes(search) ||
      commitment.responsiblePerson.toLowerCase().includes(search) ||
      commitment.partnerEmail.toLowerCase().includes(search) ||
      commitment.category.toLowerCase().includes(search) ||
      commitment.mode.toLowerCase().includes(search) ||
      events.some(
        (event) =>
          event.eventLabel.toLowerCase().includes(search) ||
          event.details.toLowerCase().includes(search) ||
          event.actorEmail.toLowerCase().includes(search)
      )
    );
  });

  const doneCount = commitments.filter(
    (item) => getDisplayStatus(item) === "Done"
  ).length;
  const pendingCount = commitments.filter(
    (item) => getDisplayStatus(item) === "Pending"
  ).length;
  const awaitingCount = commitments.filter(
    (item) => getDisplayStatus(item) === "Awaiting"
  ).length;
  const overdueCount = commitments.filter(
    (item) => getDisplayStatus(item) === "Overdue"
  ).length;
  const mutualCount = commitments.filter((item) => item.mode === "mutual").length;

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#07070a] px-4 text-white">
        <div className="relative rounded-[30px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
              <History size={18} />
            </div>
            <div>
              <p className="text-sm font-black">Loading history</p>
              <p className="mt-1 text-xs text-white/45">
                Reading activity timeline...
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
            Please sign in with Google first to view your history.
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
                  Activity history
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
                className="hidden items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-black shadow-xl shadow-white/10 transition hover:scale-[1.02] sm:inline-flex"
              >
                <LogOut size={17} />
                Sign out
              </button>
            </div>
          </motion.nav>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-6 overflow-hidden rounded-[38px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-2xl sm:p-7 lg:p-8"
          >
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-indigo-200">
                  <ShieldCheck size={15} />
                  Timeline and proof
                </div>

                <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                  See what happened to your promises.
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/58 sm:text-base">
                  Signed in as {userEmail}. This page shows created, accepted,
                  rejected, completed, and side-done activity for your visible
                  commitments.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href="/commitments/new"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-black shadow-2xl shadow-white/10 transition hover:scale-[1.02] sm:w-auto lg:w-full"
                >
                  <Plus size={18} />
                  New Commitment
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm font-black text-white/85 shadow-xl backdrop-blur transition hover:bg-white/10 sm:w-auto lg:w-full"
                >
                  <CalendarDays size={18} />
                  Dashboard
                </Link>
              </div>
            </div>
          </motion.section>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {[
              {
                label: "Commitments",
                value: commitments.length,
                icon: CalendarDays,
                card: "border-white/15 bg-white/[0.06]",
              },
              {
                label: "Events",
                value: events.length,
                icon: History,
                card: "border-indigo-300/60 bg-[#19173d]",
              },
              {
                label: "Pending",
                value: pendingCount,
                icon: Clock3,
                card: "border-amber-300/70 bg-[#352407]",
              },
              {
                label: "Awaiting",
                value: awaitingCount,
                icon: Inbox,
                card: "border-sky-300/70 bg-[#06283f]",
              },
              {
                label: "Done",
                value: doneCount,
                icon: CheckCircle2,
                card: "border-emerald-300/70 bg-[#042a22]",
              },
              {
                label: "Mutual",
                value: mutualCount,
                icon: Users,
                card: "border-cyan-300/70 bg-[#073342]",
              },
            ].map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * index, duration: 0.35 }}
                  className={`rounded-[30px] border p-5 shadow-2xl backdrop-blur-xl ${item.card}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white/70">
                      {item.label}
                    </p>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
                      <Icon size={18} />
                    </div>
                  </div>

                  <p className="mt-5 text-4xl font-black tracking-tight">
                    {item.value}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.35 }}
            className="mb-6 rounded-[28px] border border-white/10 bg-white/[0.06] p-3 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-black/25 px-4 py-3 ring-1 ring-white/10">
              <Search size={18} className="shrink-0 text-white/45" />
              <input
                type="text"
                placeholder="Search title, person, email, event, category, or source chat"
                className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </motion.div>

          {filteredHistory.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[34px] border border-dashed border-white/15 bg-white/[0.05] p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black">
                <Info size={22} />
              </div>

              <p className="mt-5 text-2xl font-black text-white">
                No history found
              </p>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-white/45">
                Create a commitment, accept a request, reject one, or mark
                something done. Activity will appear here.
              </p>

              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/commitments/new"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-black shadow-lg shadow-white/10 sm:w-auto"
                >
                  <Plus size={16} />
                  New Commitment
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white/85 shadow-sm transition hover:bg-white/10 sm:w-auto"
                >
                  <CalendarDays size={16} />
                  Dashboard
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-5">
              {filteredHistory.map(({ commitment, events }, index) => {
                const displayStatus = getDisplayStatus(commitment);
                const statusTheme = getStatusTheme(displayStatus);
                const StatusIcon = statusTheme.icon;

                return (
                  <motion.section
                    key={commitment.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * index, duration: 0.28 }}
                    className={`relative overflow-hidden rounded-[36px] border p-5 shadow-2xl backdrop-blur-2xl sm:p-6 ${statusTheme.card}`}
                  >
                    <div
                      className={`absolute bottom-0 left-0 top-0 w-2 ${statusTheme.rail}`}
                    />

                    <div className="grid gap-6 pl-2 lg:grid-cols-[0.85fr_1.15fr]">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${statusTheme.badge}`}
                          >
                            <StatusIcon size={14} />
                            {displayStatus}
                          </span>

                          <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs font-bold text-white/80">
                            {commitment.mode === "mutual" ? "Mutual" : "Solo"}
                          </span>

                          <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs font-bold text-white/80">
                            {commitment.category}
                          </span>
                        </div>

                        <h2 className="mt-4 break-words text-3xl font-black tracking-tight text-white">
                          {commitment.title}
                        </h2>

                        <div className="mt-5 grid gap-3 text-sm text-white/70">
                          <p className="break-words rounded-2xl border border-white/15 bg-black/25 px-4 py-3">
                            <span className="font-black text-white">
                              Responsible:
                            </span>{" "}
                            {commitment.responsiblePerson || "Unknown"}
                          </p>

                          <p className="break-words rounded-2xl border border-white/15 bg-black/25 px-4 py-3">
                            <span className="font-black text-white">Due:</span>{" "}
                            {formatDate(commitment.dueDate)}
                          </p>

                          {commitment.partnerEmail && (
                            <p className="break-all rounded-2xl border border-white/15 bg-black/25 px-4 py-3">
                              <span className="font-black text-white">
                                Partner:
                              </span>{" "}
                              {commitment.partnerEmail}
                            </p>
                          )}
                        </div>

                        {commitment.description && (
                          <p className="mt-5 break-words rounded-[24px] border border-white/15 bg-black/25 px-4 py-4 text-sm leading-7 text-white/72">
                            {commitment.description}
                          </p>
                        )}

                        {commitment.sourceText && (
                          <div className="mt-5 rounded-[24px] border border-indigo-300/30 bg-indigo-400/15 p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-indigo-200">
                              Source Chat
                            </p>
                            <p className="mt-2 break-words text-sm leading-7 text-white/70">
                              {commitment.sourceText}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="rounded-[30px] border border-white/10 bg-black/20 p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-lg font-black text-white">
                              Activity timeline
                            </p>
                            <p className="mt-1 text-xs text-white/45">
                              {events.length} event{events.length === 1 ? "" : "s"}
                            </p>
                          </div>

                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
                            <History size={18} />
                          </div>
                        </div>

                        {events.length === 0 ? (
                          <div className="mt-5 rounded-[24px] border border-dashed border-white/15 bg-white/[0.04] p-5">
                            <p className="text-sm font-black text-white">
                              No activity events yet
                            </p>
                            <p className="mt-2 text-sm leading-6 text-white/45">
                              When this commitment changes, events will appear
                              here.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-5 space-y-4">
                            {events.map((event) => {
                              const EventIcon = getEventIcon(event.eventType);

                              return (
                                <div
                                  key={event.id}
                                  className="relative rounded-[24px] border border-white/10 bg-white/[0.06] p-4"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-black">
                                      <EventIcon size={17} />
                                    </div>

                                    <div className="min-w-0">
                                      <p className="break-words text-sm font-black text-white">
                                        {event.eventLabel}
                                      </p>

                                      <p className="mt-1 break-words text-sm leading-6 text-white/58">
                                        {event.details || "No details."}
                                      </p>

                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/50">
                                          {formatDate(event.createdAt)}
                                        </span>

                                        {event.actorEmail && (
                                          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/50">
                                            {event.actorEmail}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.section>
                );
              })}
            </div>
          )}
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
            className="flex flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs font-black text-white"
          >
            <History size={20} />
            <span className="mt-1">History</span>
          </Link>

          <Link
            href="/profile"
            className="flex flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs font-bold text-white/60"
          >
            <Users size={20} />
            <span className="mt-1">Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
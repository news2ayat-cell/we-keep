"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  History,
  Search,
  XCircle,
} from "lucide-react";
import Toast from "@/components/ui/toast";
import HistoryTimeline from "@/components/ui/history-timeline";

type Commitment = {
  id: number;
  title: string;
  description: string;
  sourceText?: string;
  responsiblePerson: string;
  partnerEmail?: string;
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

type ProfileRow = {
  id: string | null;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type SimpleProfile = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
};

type HistoryTab = "All History" | "Completed" | "Incomplete" | "Rejected";
type DisplayStatus = "Pending" | "Awaiting" | "Done" | "Overdue" | "Rejected";
type ToastVariant = "success" | "error" | "info";

export default function HistoryPage() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");

  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [eventsByCommitment, setEventsByCommitment] = useState<
    Record<number, CommitmentEvent[]>
  >({});
  const [openHistoryIds, setOpenHistoryIds] = useState<Record<number, boolean>>(
    {}
  );

  const [profilesById, setProfilesById] = useState<Record<string, SimpleProfile>>(
    {}
  );
  const [profilesByEmail, setProfilesByEmail] = useState<
    Record<string, SimpleProfile>
  >({});

  const [tab, setTab] = useState<HistoryTab>("All History");
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

  const mapProfileRow = (item: ProfileRow): SimpleProfile => ({
    id: item.id ?? "",
    email: normalizeEmail(item.email ?? ""),
    fullName: item.full_name ?? "",
    avatarUrl: item.avatar_url ?? "",
  });

  const getDisplayName = (profile?: SimpleProfile | null) => {
    if (!profile) return "";
    const name = profile.fullName.trim();
    return name || profile.email;
  };

  const getInitials = (label: string) => {
    const cleaned = label.trim();
    if (!cleaned) return "?";

    const parts = cleaned.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  };

  const getCreatorProfile = (commitment: Commitment) =>
    profilesById[commitment.createdBy] ?? null;

  const getPartnerProfile = (commitment: Commitment) => {
    const email = normalizeEmail(commitment.partnerEmail ?? "");
    return email ? profilesByEmail[email] ?? null : null;
  };

  const getCreatorLabel = (commitment: Commitment) => {
    const creatorProfile = getCreatorProfile(commitment);
    if (creatorProfile) return getDisplayName(creatorProfile);
    return commitment.createdBy === userId ? "You" : "Unknown creator";
  };

  const getPartnerLabel = (commitment: Commitment) => {
    const partnerProfile = getPartnerProfile(commitment);
    if (partnerProfile) return getDisplayName(partnerProfile);
    return commitment.partnerEmail || "Unknown partner";
  };

  const loadProfiles = async (
    commitmentList: Commitment[],
    currentUserEmail: string
  ) => {
    const idMap: Record<string, SimpleProfile> = {};
    const emailMap: Record<string, SimpleProfile> = {};

    const creatorIds = Array.from(
      new Set(
        commitmentList
          .map((item) => item.createdBy)
          .filter((value) => value && value.trim())
      )
    );

    const partnerEmails = Array.from(
      new Set(
        [currentUserEmail, ...commitmentList.map((item) => item.partnerEmail ?? "")]
          .map((value) => normalizeEmail(value))
          .filter(Boolean)
      )
    );

    if (creatorIds.length > 0) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url")
        .in("id", creatorIds);

      if (error) {
        showToast(
          "Profile load failed",
          `${error.message}${error.code ? ` (${error.code})` : ""}`,
          "error"
        );
      } else {
        (data ?? []).forEach((row) => {
          const mapped = mapProfileRow(row as ProfileRow);
          if (mapped.id) idMap[mapped.id] = mapped;
          if (mapped.email) emailMap[mapped.email] = mapped;
        });
      }
    }

    if (partnerEmails.length > 0) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url")
        .in("email", partnerEmails);

      if (error) {
        showToast(
          "Partner profile load failed",
          `${error.message}${error.code ? ` (${error.code})` : ""}`,
          "error"
        );
      } else {
        (data ?? []).forEach((row) => {
          const mapped = mapProfileRow(row as ProfileRow);
          if (mapped.id) idMap[mapped.id] = mapped;
          if (mapped.email) emailMap[mapped.email] = mapped;
        });
      }
    }

    setProfilesById(idMap);
    setProfilesByEmail(emailMap);
  };

  const loadEvents = async (commitmentIds: number[]) => {
    if (commitmentIds.length === 0) {
      setEventsByCommitment({});
      return;
    }

    const { data, error } = await supabase
      .from("commitment_events")
      .select("*")
      .in("commitment_id", commitmentIds)
      .order("created_at", { ascending: false });

    if (error) {
      showToast(
        "History load failed",
        `${error.message}${error.code ? ` (${error.code})` : ""}`,
        "error"
      );
      return;
    }

    const grouped: Record<number, CommitmentEvent[]> = {};

    (data ?? []).forEach((row) => {
      const mapped = mapRowToEvent(row as EventRow);

      if (!grouped[mapped.commitmentId]) {
        grouped[mapped.commitmentId] = [];
      }

      grouped[mapped.commitmentId].push(mapped);
    });

    setEventsByCommitment(grouped);
  };

  const loadCommitments = async (
    currentUserId: string,
    currentUserEmail: string
  ) => {
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

    await Promise.all([
      loadProfiles(finalCommitments, currentUserEmail),
      loadEvents(finalCommitments.map((item) => item.id)),
    ]);
  };

  useEffect(() => {
    const loadPage = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setIsLoggedIn(false);
        setMounted(true);
        return;
      }

      setIsLoggedIn(true);
      setUserEmail(user.email);
      setUserId(user.id);

      await loadCommitments(user.id, user.email);
      setMounted(true);
    };

    loadPage();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return dateString;

    return date.toLocaleString();
  };

  const getDisplayStatus = (commitment: Commitment): DisplayStatus => {
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

  const getCompletedAt = (commitmentId: number) => {
    const events = eventsByCommitment[commitmentId] ?? [];

    const completedEvent = events.find(
      (event) =>
        event.eventType === "completed" || event.eventType === "solo_done"
    );

    return completedEvent?.createdAt ?? "";
  };

  const toggleHistory = (id: number) => {
    setOpenHistoryIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const tabbedCommitments = commitments.filter((commitment) => {
    const displayStatus = getDisplayStatus(commitment);

    if (tab === "All History") return true;
    if (tab === "Completed") return displayStatus === "Done";
    if (tab === "Rejected") return displayStatus === "Rejected";
    if (tab === "Incomplete") {
      return displayStatus !== "Done" && displayStatus !== "Rejected";
    }

    return true;
  });

  const filteredCommitments = tabbedCommitments.filter((commitment) => {
    const search = searchText.toLowerCase();

    return (
      commitment.title.toLowerCase().includes(search) ||
      commitment.responsiblePerson.toLowerCase().includes(search) ||
      commitment.category.toLowerCase().includes(search) ||
      commitment.mode.toLowerCase().includes(search) ||
      commitment.description.toLowerCase().includes(search) ||
      (commitment.partnerEmail || "").toLowerCase().includes(search) ||
      (commitment.sourceText || "").toLowerCase().includes(search)
    );
  });

  const completedCount = commitments.filter(
    (item) => getDisplayStatus(item) === "Done"
  ).length;

  const incompleteCount = commitments.filter((item) => {
    const status = getDisplayStatus(item);
    return status !== "Done" && status !== "Rejected";
  }).length;

  const rejectedCount = commitments.filter(
    (item) => getDisplayStatus(item) === "Rejected"
  ).length;

  const tabButtonClass = (name: HistoryTab) =>
    `inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
      tab === name
        ? "bg-black text-white shadow-lg"
        : "bg-white/80 text-slate-700 ring-1 ring-black/5 hover:bg-white"
    }`;

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-slate-600">Loading history...</p>
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
        transition={{ duration: 0.4 }}
        className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-4 py-6 sm:px-6 sm:py-8"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-[30px] border border-white/60 bg-white/80 p-5 sm:p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex flex-col gap-4">
              <div>
                <Link
                  href="/dashboard"
                  className="text-sm text-slate-600 hover:underline"
                >
                  ← Back to Dashboard
                </Link>

                <h1 className="mt-3 break-words text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  Commitment History
                </h1>

                <p className="mt-2 break-all text-sm text-slate-600">
                  Review past and current commitment records for {userEmail}
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
                  href="/profile"
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-slate-800 shadow-sm"
                >
                  Profile
                </Link>
              </div>
            </div>
          </motion.div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "All History",
                value: commitments.length,
                icon: History,
                color: "from-slate-900 to-slate-700 text-white",
              },
              {
                label: "Completed",
                value: completedCount,
                icon: CheckCircle2,
                color: "from-emerald-500 to-green-600 text-white",
              },
              {
                label: "Incomplete",
                value: incompleteCount,
                icon: Clock3,
                color: "from-amber-400 to-yellow-500 text-slate-900",
              },
              {
                label: "Rejected",
                value: rejectedCount,
                icon: XCircle,
                color: "from-rose-500 to-red-600 text-white",
              },
            ].map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.25 }}
                  className={`rounded-[28px] bg-gradient-to-br ${item.color} p-5 shadow-xl`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium opacity-90">{item.label}</p>
                    <Icon size={22} className="opacity-90" />
                  </div>
                  <p className="mt-5 text-4xl font-black tracking-tight">
                    {item.value}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 overflow-x-auto pb-2"
          >
            <div className="flex min-w-max gap-3">
              <button
                onClick={() => setTab("All History")}
                className={tabButtonClass("All History")}
              >
                All History
              </button>
              <button
                onClick={() => setTab("Completed")}
                className={tabButtonClass("Completed")}
              >
                Completed
              </button>
              <button
                onClick={() => setTab("Incomplete")}
                className={tabButtonClass("Incomplete")}
              >
                Incomplete
              </button>
              <button
                onClick={() => setTab("Rejected")}
                className={tabButtonClass("Rejected")}
              >
                Rejected
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-[24px] border border-white/60 bg-white/75 p-3 shadow-xl backdrop-blur"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 ring-1 ring-black/5">
              <Search size={18} className="shrink-0 text-slate-500" />
              <input
                type="text"
                placeholder="Search by title, mode, partner, category, description, or source chat"
                className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </motion.div>

          {filteredCommitments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-8 sm:p-10 text-center shadow-xl backdrop-blur"
            >
              <p className="text-lg font-semibold text-slate-800">
                No history found
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try another history tab or clear the search text.
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-5">
              {filteredCommitments.map((commitment, index) => {
                const displayStatus = getDisplayStatus(commitment);
                const isMutual = commitment.mode === "mutual";
                const creatorLabel = getCreatorLabel(commitment);
                const partnerLabel = getPartnerLabel(commitment);
                const completedAt = getCompletedAt(commitment.id);
                const historyCount =
                  eventsByCommitment[commitment.id]?.length ?? 0;

                const badgeClass =
                  displayStatus === "Done"
                    ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                    : displayStatus === "Overdue"
                    ? "bg-rose-100 text-rose-700 ring-rose-200"
                    : displayStatus === "Awaiting"
                    ? "bg-sky-100 text-sky-700 ring-sky-200"
                    : displayStatus === "Rejected"
                    ? "bg-slate-200 text-slate-700 ring-slate-300"
                    : "bg-amber-100 text-amber-700 ring-amber-200";

                return (
                  <motion.div
                    key={commitment.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.22 }}
                    className="rounded-[30px] border border-white/60 bg-white/80 p-5 sm:p-6 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="break-words text-2xl font-bold tracking-tight text-slate-900">
                            {commitment.title}
                          </h2>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeClass}`}
                          >
                            {displayStatus}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                              isMutual
                                ? "bg-indigo-100 text-indigo-700 ring-indigo-200"
                                : "bg-slate-100 text-slate-700 ring-slate-200"
                            }`}
                          >
                            {isMutual ? "Mutual" : "Solo"}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                            {commitment.category}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-4">
                          <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xs font-bold text-white">
                              {getInitials(creatorLabel)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-slate-500">Creator</p>
                              <p className="break-words text-sm font-semibold text-slate-900">
                                {creatorLabel}
                              </p>
                            </div>
                          </div>

                          {isMutual && (
                            <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-indigo-50 px-3 py-2 ring-1 ring-indigo-100">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-xs font-bold text-white">
                                {getInitials(partnerLabel)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-indigo-600">Partner</p>
                                <p className="break-words text-sm font-semibold text-slate-900">
                                  {partnerLabel}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                          <p className="break-words">
                            <span className="font-semibold text-slate-800">
                              Responsible:
                            </span>{" "}
                            {commitment.responsiblePerson}
                          </p>
                          <p className="break-words">
                            <span className="font-semibold text-slate-800">
                              Due:
                            </span>{" "}
                            {formatDate(commitment.dueDate)}
                          </p>
                          <p className="break-words">
                            <span className="font-semibold text-slate-800">
                              Created:
                            </span>{" "}
                            {formatDate(commitment.createdAt)}
                          </p>
                          <p className="break-words">
                            <span className="font-semibold text-slate-800">
                              Completed:
                            </span>{" "}
                            {completedAt ? formatDate(completedAt) : "Not completed"}
                          </p>
                        </div>

                        {commitment.description && (
                          <p className="mt-4 break-words rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 ring-1 ring-slate-100">
                            {commitment.description}
                          </p>
                        )}

                        {openHistoryIds[commitment.id] && (
                          <HistoryTimeline
                            events={eventsByCommitment[commitment.id] ?? []}
                          />
                        )}
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap xl:w-[260px] xl:justify-end">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleHistory(commitment.id)}
                          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm"
                        >
                          <History size={16} />
                          {openHistoryIds[commitment.id]
                            ? "Hide Timeline"
                            : `Timeline (${historyCount})`}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.main>
    </>
  );
}
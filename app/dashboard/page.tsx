"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BellRing,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  Clock3,
  History,
  Inbox,
  Info,
  Lock,
  LogOut,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import Toast from "@/components/ui/toast";
import ConfirmModal from "@/components/ui/confirm-modal";
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

type FilterType =
  | "All"
  | "Pending"
  | "Awaiting"
  | "Done"
  | "Overdue"
  | "Today"
  | "Rejected";

type DisplayStatus =
  | "Pending"
  | "Awaiting"
  | "Done"
  | "Overdue"
  | "Rejected";

type ToastVariant = "success" | "error" | "info";
type ViewType = "All" | "Solo" | "My Mutual" | "Incoming Mutual";

export default function DashboardPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  const [filter, setFilter] = useState<FilterType>("All");
  const [view, setView] = useState<ViewType>("All");
  const [searchText, setSearchText] = useState("");

  const [toastOpen, setToastOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<ToastVariant>("info");

  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);

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
    if (name) return name;
    return profile.email;
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

  const appendEventLocal = (event: CommitmentEvent) => {
    setEventsByCommitment((prev) => ({
      ...prev,
      [event.commitmentId]: [event, ...(prev[event.commitmentId] ?? [])],
    }));
  };

  const logEvent = async ({
    commitmentId,
    eventType,
    eventLabel,
    details,
  }: {
    commitmentId: number;
    eventType: string;
    eventLabel: string;
    details: string;
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) return;

    const { data, error } = await supabase
      .from("commitment_events")
      .insert({
        commitment_id: commitmentId,
        actor_user_id: user.id,
        actor_email: user.email,
        event_type: eventType,
        event_label: eventLabel,
        details,
      })
      .select()
      .single();

    if (error || !data) return;

    appendEventLocal(mapRowToEvent(data as EventRow));
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
        "Dashboard load failed",
        `${ownedResponse.error.message}${
          ownedResponse.error.code ? ` (${ownedResponse.error.code})` : ""
        }`,
        "error"
      );
      return;
    }

    if (incomingResponse.error) {
      showToast(
        "Incoming mutual load failed",
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
        error,
      } = await supabase.auth.getUser();

      if (error) {
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setMounted(true);
        return;
      }

      if (user?.email) {
        setIsLoggedIn(true);
        setUserEmail(user.email);
        setUserId(user.id);

        await supabase.from("profiles").upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name ?? "",
          avatar_url: user.user_metadata?.avatar_url ?? "",
        });

        await loadCommitments(user.id, user.email);
      } else {
        setIsLoggedIn(false);
        setUserEmail("");
        setUserId("");
      }

      setMounted(true);
    };

    loadPage();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    showToast("Signed out", "You have been logged out.", "success");

    setTimeout(() => {
      router.push("/login");
    }, 700);
  };

  const canDeleteCommitment = (commitment: Commitment) => {
    if (commitment.mode === "solo") return true;

    return (
      commitment.status === "awaiting_acceptance" ||
      commitment.status === "rejected" ||
      commitment.status === "done"
    );
  };

  const handleDeleteClick = (id: number) => {
    setSelectedDeleteId(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedDeleteId === null) return;

    const selectedCommitment = commitments.find(
      (commitment) => commitment.id === selectedDeleteId
    );

    if (!selectedCommitment) {
      setDeleteModalOpen(false);
      setSelectedDeleteId(null);
      return;
    }

    if (!canDeleteCommitment(selectedCommitment)) {
      showToast(
        "Delete locked",
        "This mutual commitment was accepted already. It cannot be deleted until both sides complete it.",
        "error"
      );
      setDeleteModalOpen(false);
      setSelectedDeleteId(null);
      return;
    }

    const { error } = await supabase
      .from("commitments")
      .delete()
      .eq("id", selectedDeleteId)
      .eq("created_by", userId);

    if (error) {
      showToast(
        "Delete failed",
        `${error.message}${error.code ? ` (${error.code})` : ""}`,
        "error"
      );
      setDeleteModalOpen(false);
      setSelectedDeleteId(null);
      return;
    }

    setCommitments((prev) =>
      prev.filter((commitment) => commitment.id !== selectedDeleteId)
    );

    setEventsByCommitment((prev) => {
      const copy = { ...prev };
      delete copy[selectedDeleteId];
      return copy;
    });

    setDeleteModalOpen(false);
    setSelectedDeleteId(null);
    showToast("Commitment deleted", "The card was removed.", "success");
  };

  const handleAcceptMutual = async (id: number) => {
    const { error } = await supabase
      .from("commitments")
      .update({ status: "pending" })
      .eq("id", id);

    if (error) {
      showToast(
        "Accept failed",
        `${error.message}${error.code ? ` (${error.code})` : ""}`,
        "error"
      );
      return;
    }

    setCommitments((prev) =>
      prev.map((commitment) =>
        commitment.id === id ? { ...commitment, status: "pending" } : commitment
      )
    );

    await logEvent({
      commitmentId: id,
      eventType: "accepted",
      eventLabel: "Mutual commitment accepted",
      details: "The invited partner accepted this mutual commitment.",
    });

    showToast(
      "Mutual commitment accepted",
      "This shared commitment is now active.",
      "success"
    );
  };

  const handleRejectMutual = async (id: number) => {
    const { error } = await supabase
      .from("commitments")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) {
      showToast(
        "Reject failed",
        `${error.message}${error.code ? ` (${error.code})` : ""}`,
        "error"
      );
      return;
    }

    setCommitments((prev) =>
      prev.map((commitment) =>
        commitment.id === id ? { ...commitment, status: "rejected" } : commitment
      )
    );

    await logEvent({
      commitmentId: id,
      eventType: "rejected",
      eventLabel: "Mutual commitment rejected",
      details: "The invited partner rejected this mutual commitment.",
    });

    showToast(
      "Mutual commitment rejected",
      "This shared commitment was declined.",
      "info"
    );
  };

  const handleMarkSoloDone = async (id: number) => {
    const { error } = await supabase
      .from("commitments")
      .update({ status: "done" })
      .eq("id", id)
      .eq("created_by", userId);

    if (error) {
      showToast(
        "Update failed",
        `${error.message}${error.code ? ` (${error.code})` : ""}`,
        "error"
      );
      return;
    }

    setCommitments((prev) =>
      prev.map((commitment) =>
        commitment.id === id ? { ...commitment, status: "done" } : commitment
      )
    );

    await logEvent({
      commitmentId: id,
      eventType: "solo_done",
      eventLabel: "Solo commitment completed",
      details: "The creator marked this solo commitment as done.",
    });

    showToast("Marked as done", "This commitment is now completed.", "success");
  };
    const handleMarkMySideDone = async (commitment: Commitment) => {
    const isOwner = commitment.createdBy === userId;

    const { data: latestRow, error: fetchError } = await supabase
      .from("commitments")
      .select("*")
      .eq("id", commitment.id)
      .single();

    if (fetchError || !latestRow) {
      showToast(
        "Could not load latest commitment state",
        `${fetchError?.message ?? "Unknown error"}${
          fetchError?.code ? ` (${fetchError.code})` : ""
        }`,
        "error"
      );
      return;
    }

    const latest = mapRowToCommitment(latestRow as DashboardRow);

    const nextCreatorDone = isOwner ? true : latest.creatorDone;
    const nextPartnerDone = isOwner ? latest.partnerDone : true;
    const nextStatus = nextCreatorDone && nextPartnerDone ? "done" : "pending";

    const { error } = await supabase
      .from("commitments")
      .update({
        creator_done: nextCreatorDone,
        partner_done: nextPartnerDone,
        status: nextStatus,
      })
      .eq("id", commitment.id);

    if (error) {
      showToast(
        "Could not update your side",
        `${error.message}${error.code ? ` (${error.code})` : ""}`,
        "error"
      );
      return;
    }

    setCommitments((prev) =>
      prev.map((item) =>
        item.id === commitment.id
          ? {
              ...item,
              creatorDone: nextCreatorDone,
              partnerDone: nextPartnerDone,
              status: nextStatus,
            }
          : item
      )
    );

    await logEvent({
      commitmentId: commitment.id,
      eventType: isOwner ? "creator_side_done" : "partner_side_done",
      eventLabel: isOwner
        ? "Creator marked their side done"
        : "Partner marked their side done",
      details: isOwner
        ? "The creator finished their part of this mutual commitment."
        : "The invited partner finished their part of this mutual commitment.",
    });

    if (nextStatus === "done") {
      await logEvent({
        commitmentId: commitment.id,
        eventType: "completed",
        eventLabel: "Mutual commitment fully completed",
        details: "Both sides marked done, so the commitment is now complete.",
      });

      showToast(
        "Both sides completed",
        "This mutual commitment is now fully done.",
        "success"
      );
    } else {
      showToast(
        "Your side marked done",
        "Now waiting for the other person to finish their side.",
        "info"
      );
    }
  };

  const handleClearAllConfirm = async () => {
    const myCreatedCommitments = commitments.filter(
      (commitment) => commitment.createdBy === userId
    );

    const deletableCommitments = myCreatedCommitments.filter((commitment) =>
      canDeleteCommitment(commitment)
    );

    const lockedCommitments = myCreatedCommitments.filter(
      (commitment) => !canDeleteCommitment(commitment)
    );

    if (deletableCommitments.length === 0) {
      setClearModalOpen(false);

      showToast(
        "Nothing was cleared",
        lockedCommitments.length > 0
          ? "Your remaining created mutual commitments are locked because they were accepted and are not completed yet."
          : "You do not have any removable created commitments right now.",
        "info"
      );
      return;
    }

    const deletableIds = deletableCommitments.map((commitment) => commitment.id);

    const { error } = await supabase
      .from("commitments")
      .delete()
      .in("id", deletableIds)
      .eq("created_by", userId);

    if (error) {
      showToast(
        "Clear failed",
        `${error.message}${error.code ? ` (${error.code})` : ""}`,
        "error"
      );
      setClearModalOpen(false);
      return;
    }

    setCommitments((prev) =>
      prev.filter((commitment) => !deletableIds.includes(commitment.id))
    );

    setEventsByCommitment((prev) => {
      const copy = { ...prev };
      deletableIds.forEach((id) => {
        delete copy[id];
      });
      return copy;
    });

    localStorage.removeItem("editingCommitmentId");
    localStorage.removeItem("draftSourceText");
    setClearModalOpen(false);

    const clearedCount = deletableCommitments.length;
    const lockedCount = lockedCommitments.length;

    showToast(
      "Clear finished",
      lockedCount > 0
        ? `${clearedCount} cleared. ${lockedCount} locked mutual commitment${
            lockedCount > 1 ? "s were" : " was"
          } kept.`
        : `${clearedCount} commitment${
            clearedCount > 1 ? "s were" : " was"
          } cleared.`,
      "success"
    );
  };

  const handleEdit = (id: number) => {
    localStorage.setItem("editingCommitmentId", String(id));
    router.push("/edit");
  };

  const toggleHistory = (id: number) => {
    setOpenHistoryIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString();
  };

  const isDueToday = (commitment: Commitment) => {
    if (
      commitment.status === "done" ||
      commitment.status === "awaiting_acceptance" ||
      commitment.status === "rejected"
    ) {
      return false;
    }

    const dueDate = new Date(commitment.dueDate);
    const now = new Date();

    if (isNaN(dueDate.getTime())) return false;

    return (
      dueDate.getFullYear() === now.getFullYear() &&
      dueDate.getMonth() === now.getMonth() &&
      dueDate.getDate() === now.getDate()
    );
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
        glow: "shadow-[0_0_45px_rgba(16,185,129,0.18)]",
      };
    }

    if (displayStatus === "Overdue") {
      return {
        badge: "bg-rose-400 text-white",
        card: "border-rose-300/75 bg-[#3a0712]",
        rail: "bg-rose-400",
        glow: "shadow-[0_0_45px_rgba(244,63,94,0.2)]",
      };
    }

    if (displayStatus === "Awaiting") {
      return {
        badge: "bg-sky-300 text-sky-950",
        card: "border-sky-300/75 bg-[#06283f]",
        rail: "bg-sky-300",
        glow: "shadow-[0_0_45px_rgba(56,189,248,0.2)]",
      };
    }

    if (displayStatus === "Rejected") {
      return {
        badge: "bg-slate-400 text-slate-950",
        card: "border-slate-400/60 bg-[#1f2937]",
        rail: "bg-slate-400",
        glow: "shadow-[0_0_35px_rgba(148,163,184,0.12)]",
      };
    }

    return {
      badge: "bg-amber-300 text-amber-950",
      card: "border-amber-300/75 bg-[#352407]",
      rail: "bg-amber-300",
      glow: "shadow-[0_0_45px_rgba(251,191,36,0.2)]",
    };
  };

  const handleCopyReminder = async (
    commitment: Commitment,
    displayStatus: DisplayStatus
  ) => {
    const message =
      displayStatus === "Overdue"
        ? `Hi ${commitment.responsiblePerson}, just following up again about "${commitment.title}". It is overdue now. Please update me when you can.`
        : `Hi ${commitment.responsiblePerson}, just a reminder about "${commitment.title}". Please let me know once it is done.`;

    try {
      await navigator.clipboard.writeText(message);
      showToast(
        "Reminder copied",
        "The reminder text is now in your clipboard.",
        "success"
      );
    } catch {
      showToast("Copy failed", "Could not copy the reminder.", "error");
    }
  };

  const focusIncomingRequests = () => {
    setView("Incoming Mutual");
    setFilter("Awaiting");
    setSearchText("");

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const focusOverdue = () => {
    setView("All");
    setFilter("Overdue");
    setSearchText("");

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const viewedCommitments = commitments.filter((commitment) => {
    const isOwner = commitment.createdBy === userId;
    const isIncoming = commitment.mode === "mutual" && !isOwner;

    if (view === "All") return true;
    if (view === "Solo") return commitment.mode === "solo";
    if (view === "My Mutual") return commitment.mode === "mutual" && isOwner;
    if (view === "Incoming Mutual") return isIncoming;

    return true;
  });

  const incomingAwaitingRequests = commitments.filter((commitment) => {
    const isOwner = commitment.createdBy === userId;
    const isIncoming = commitment.mode === "mutual" && !isOwner;
    return isIncoming && getDisplayStatus(commitment) === "Awaiting";
  });

  const globalAwaitingIncomingCount = incomingAwaitingRequests.length;
  const globalOverdueCount = commitments.filter(
    (commitment) => getDisplayStatus(commitment) === "Overdue"
  ).length;

  const hasAnyCommitments = commitments.length > 0;
  const totalCount = viewedCommitments.length;
  const pendingCount = viewedCommitments.filter(
    (commitment) => getDisplayStatus(commitment) === "Pending"
  ).length;
  const awaitingCount = viewedCommitments.filter(
    (commitment) => getDisplayStatus(commitment) === "Awaiting"
  ).length;
  const doneCount = viewedCommitments.filter(
    (commitment) => getDisplayStatus(commitment) === "Done"
  ).length;
  const overdueCount = viewedCommitments.filter(
    (commitment) => getDisplayStatus(commitment) === "Overdue"
  ).length;
  const todayCount = viewedCommitments.filter((commitment) =>
    isDueToday(commitment)
  ).length;

  const filteredByStatus =
    filter === "All"
      ? viewedCommitments
      : filter === "Today"
      ? viewedCommitments.filter((commitment) => isDueToday(commitment))
      : viewedCommitments.filter(
          (commitment) => getDisplayStatus(commitment) === filter
        );

  const filteredCommitments = filteredByStatus.filter((commitment) => {
    const search = searchText.toLowerCase();

    return (
      commitment.title.toLowerCase().includes(search) ||
      commitment.responsiblePerson.toLowerCase().includes(search) ||
      (commitment.partnerEmail || "").toLowerCase().includes(search) ||
      commitment.category.toLowerCase().includes(search) ||
      commitment.mode.toLowerCase().includes(search) ||
      commitment.description.toLowerCase().includes(search) ||
      (commitment.sourceText || "").toLowerCase().includes(search)
    );
  });

  const getEmptyState = () => {
    if (!hasAnyCommitments) {
      return {
        title: "No commitments yet",
        description:
          "Start with a solo promise for yourself, or create a mutual commitment and invite someone else.",
      };
    }

    if (searchText.trim()) {
      return {
        title: "No search results",
        description:
          "Try a simpler keyword, another view, or remove the current filter.",
      };
    }

    return {
      title: "No commitments found",
      description:
        "Try another view, another filter, another search, or create a new promise.",
    };
  };

  const filterButtonClass = (name: FilterType) =>
    `inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition ${
      filter === name
        ? "bg-white text-black shadow-xl shadow-white/10"
        : "border border-white/10 bg-white/[0.05] text-white/65 hover:bg-white/[0.09] hover:text-white"
    }`;

  const viewButtonClass = (name: ViewType) =>
    `inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition ${
      view === name
        ? "bg-indigo-300 text-black shadow-xl shadow-indigo-500/20"
        : "border border-white/10 bg-white/[0.05] text-white/65 hover:bg-white/[0.09] hover:text-white"
    }`;

  const cardNeutralButtonClass =
    "inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white/85 shadow-sm transition hover:bg-white/[0.1] sm:w-auto";

  const emptyState = getEmptyState();

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#07070a] px-4 text-white">
        <div className="relative rounded-[30px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-black">Loading dashboard</p>
              <p className="mt-1 text-xs text-white/45">
                Reading your commitments...
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
            ← Back to Home
          </Link>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-white">
            You are not logged in
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/55">
            Please sign in with Google first to open your commitments.
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
        message="This will remove only the commitments you are currently allowed to delete. Accepted mutual commitments that are not completed will stay locked."
        confirmText="Yes, clear allowed"
        cancelText="Keep them"
        danger
        onConfirm={handleClearAllConfirm}
        onCancel={() => setClearModalOpen(false)}
      />

      <ConfirmModal
        open={deleteModalOpen}
        title="Delete this commitment?"
        message="This action cannot be undone once the commitment is removed."
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false);
          setSelectedDeleteId(null);
        }}
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
                  Dashboard control room
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/commitments/new"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-black shadow-xl shadow-white/10 transition hover:scale-[1.02] sm:px-5"
              >
                <Plus size={17} />
                <span className="hidden sm:inline">New</span>
              </Link>

              <Link
                href="/history"
                className="hidden items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10 md:inline-flex"
              >
                <History size={17} />
                History
              </Link>

              <Link
                href="/profile"
                className="hidden items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10 md:inline-flex"
              >
                <Users size={17} />
                Profile
              </Link>

              <button
                onClick={handleSignOut}
                className="hidden items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10 sm:inline-flex"
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
                  <ShieldAlert size={15} />
                  Active accountability
                </div>

                <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                  Keep today&apos;s promises visible.
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/58 sm:text-base">
                  Signed in as {userEmail}. Track solo promises, mutual requests,
                  overdue items, and completion history from one control room.
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
                  href="/chat-import"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm font-black text-white/85 shadow-xl backdrop-blur transition hover:bg-white/10 sm:w-auto lg:w-full"
                >
                  <MessageSquareText size={18} />
                  Paste Chat
                </Link>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <button
                onClick={() => setFilter("Today")}
                className="rounded-[26px] border border-cyan-300/30 bg-cyan-400/10 p-5 text-left shadow-xl transition hover:bg-cyan-400/[0.15]"
              >
                <p className="text-4xl font-black text-cyan-100">{todayCount}</p>
                <p className="mt-2 text-sm font-bold text-white/55">Due today</p>
              </button>

              <button
                onClick={focusIncomingRequests}
                className="rounded-[26px] border border-sky-300/35 bg-sky-400/[0.12] p-5 text-left shadow-xl transition hover:bg-sky-400/[0.18]"
              >
                <p className="text-4xl font-black text-sky-100">
                  {globalAwaitingIncomingCount}
                </p>
                <p className="mt-2 text-sm font-bold text-white/55">
                  Requests waiting
                </p>
              </button>

              <button
                onClick={focusOverdue}
                className="rounded-[26px] border border-rose-300/35 bg-rose-400/[0.12] p-5 text-left shadow-xl transition hover:bg-rose-400/[0.18]"
              >
                <p className="text-4xl font-black text-rose-100">
                  {globalOverdueCount}
                </p>
                <p className="mt-2 text-sm font-bold text-white/55">Overdue</p>
              </button>
            </div>

            <div className="mt-5 hidden flex-wrap gap-3 sm:flex">
              <button
                onClick={() => setClearModalOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-5 py-3 text-sm font-bold text-rose-100 shadow-xl backdrop-blur transition hover:bg-rose-400/15 sm:w-auto"
              >
                <Trash2 size={18} />
                Clear Created
              </button>
            </div>
          </motion.section>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {[
              {
                label: "Total",
                value: totalCount,
                icon: CalendarDays,
                card: "border-white/15 bg-white/[0.06]",
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
                icon: Users,
                card: "border-sky-300/70 bg-[#06283f]",
              },
              {
                label: "Done",
                value: doneCount,
                icon: CheckCircle2,
                card: "border-emerald-300/70 bg-[#042a22]",
              },
              {
                label: "Overdue",
                value: overdueCount,
                icon: AlertTriangle,
                card: "border-rose-300/70 bg-[#3a0712]",
              },
              {
                label: "Due Today",
                value: todayCount,
                icon: BellRing,
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
            className="mb-4 rounded-[28px] border border-white/10 bg-white/[0.06] p-3 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-black/25 px-4 py-3 ring-1 ring-white/10">
              <Search size={18} className="shrink-0 text-white/45" />
              <input
                type="text"
                placeholder="Search title, person, email, category, description, or source chat"
                className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.35 }}
            className="mb-6 overflow-x-auto pb-2"
          >
            <div className="flex min-w-max gap-3">
              <button onClick={() => setView("All")} className={viewButtonClass("All")}>
                All ({commitments.length})
              </button>
              <button onClick={() => setView("Solo")} className={viewButtonClass("Solo")}>
                Solo ({commitments.filter((item) => item.mode === "solo").length})
              </button>
              <button
                onClick={() => setView("My Mutual")}
                className={viewButtonClass("My Mutual")}
              >
                My Mutual (
                {
                  commitments.filter(
                    (item) => item.mode === "mutual" && item.createdBy === userId
                  ).length
                }
                )
              </button>
              <button
                onClick={() => setView("Incoming Mutual")}
                className={viewButtonClass("Incoming Mutual")}
              >
                Incoming Mutual (
                {
                  commitments.filter(
                    (item) => item.mode === "mutual" && item.createdBy !== userId
                  ).length
                }
                )
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.35 }}
            className="mb-6 overflow-x-auto pb-2"
          >
            <div className="flex min-w-max gap-3">
              <button onClick={() => setFilter("All")} className={filterButtonClass("All")}>
                All
              </button>
              <button onClick={() => setFilter("Pending")} className={filterButtonClass("Pending")}>
                Pending
              </button>
              <button onClick={() => setFilter("Awaiting")} className={filterButtonClass("Awaiting")}>
                Awaiting
              </button>
              <button onClick={() => setFilter("Done")} className={filterButtonClass("Done")}>
                Done
              </button>
              <button onClick={() => setFilter("Overdue")} className={filterButtonClass("Overdue")}>
                Overdue
              </button>
              <button onClick={() => setFilter("Rejected")} className={filterButtonClass("Rejected")}>
                Rejected
              </button>
              <button onClick={() => setFilter("Today")} className={filterButtonClass("Today")}>
                Due Today
              </button>
            </div>
          </motion.div>

          {filteredCommitments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[34px] border border-dashed border-white/15 bg-white/[0.05] p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10"
            >
              <p className="text-2xl font-black text-white">
                {emptyState.title}
              </p>
              <p className="mt-2 text-sm leading-7 text-white/45">
                {emptyState.description}
              </p>

              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/commitments/new"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-black shadow-lg shadow-white/10 sm:w-auto"
                >
                  <Plus size={16} />
                  New Commitment
                </Link>

                <button
                  onClick={() => {
                    setView("All");
                    setFilter("All");
                    setSearchText("");
                  }}
                  className={cardNeutralButtonClass}
                >
                  <Info size={16} />
                  Reset view
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-5">
              {filteredCommitments.map((commitment, index) => {
                const displayStatus = getDisplayStatus(commitment);
                const statusTheme = getStatusTheme(displayStatus);
                const isMutual = commitment.mode === "mutual";
                const isAwaiting = displayStatus === "Awaiting";
                const isRejected = displayStatus === "Rejected";
                const isOwner = commitment.createdBy === userId;
                const isIncoming = isMutual && !isOwner;
                const isActiveMutual =
                  isMutual &&
                  !isAwaiting &&
                  !isRejected &&
                  displayStatus !== "Done";

                const creatorProfile = getCreatorProfile(commitment);
                const partnerProfile = getPartnerProfile(commitment);
                const creatorLabel = getCreatorLabel(commitment);
                const partnerLabel = getPartnerLabel(commitment);

                const historyCount =
                  eventsByCommitment[commitment.id]?.length ?? 0;

                return (
                  <motion.div
                    key={commitment.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * index, duration: 0.28 }}
                    className={`relative overflow-hidden rounded-[36px] border p-5 shadow-2xl backdrop-blur-2xl sm:p-6 ${statusTheme.card} ${statusTheme.glow}`}
                  >
                    <div
                      className={`absolute bottom-0 left-0 top-0 w-2 ${statusTheme.rail}`}
                    />

                    <div className="flex flex-col gap-5 pl-2 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="min-w-0 break-words text-3xl font-black tracking-tight text-white">
                            {commitment.title}
                          </h2>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${statusTheme.badge}`}
                          >
                            {displayStatus}
                          </span>

                          <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs font-bold text-white/80">
                            {isMutual ? "Mutual" : "Solo"}
                          </span>

                          <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs font-bold text-white/80">
                            {isIncoming ? "Incoming to you" : "Created by you"}
                          </span>

                          <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs font-bold text-white/80">
                            {commitment.category}
                          </span>

                          {isActiveMutual && (
                            <span className="rounded-full bg-indigo-300 px-3 py-1 text-xs font-black text-black">
                              Accepted
                            </span>
                          )}
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-4">
                          <div className="flex min-w-0 items-center gap-3 rounded-[22px] border border-white/15 bg-black/20 px-3 py-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-xs font-black text-black">
                              {getInitials(isIncoming ? creatorLabel : "You")}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-white/50">
                                {isIncoming ? "Invited by" : "Creator"}
                              </p>
                              <p className="break-words text-sm font-black text-white">
                                {isIncoming ? creatorLabel : "You"}
                              </p>
                              {isIncoming && creatorProfile?.email && (
                                <p className="break-all text-xs text-white/45">
                                  {creatorProfile.email}
                                </p>
                              )}
                            </div>
                          </div>

                          {isMutual && (
                            <div className="flex min-w-0 items-center gap-3 rounded-[22px] border border-indigo-300/30 bg-indigo-400/15 px-3 py-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-300 text-xs font-black text-black">
                                {getInitials(partnerLabel)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-indigo-100/70">
                                  {isIncoming ? "Partner" : "Shared with"}
                                </p>
                                <p className="break-words text-sm font-black text-white">
                                  {isIncoming ? "You" : partnerLabel}
                                </p>
                                {!isIncoming && (
                                  <p className="break-all text-xs text-white/45">
                                    {partnerProfile?.email || commitment.partnerEmail}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-5 grid gap-3 text-sm text-white/70 md:grid-cols-2">
                          <p className="break-words rounded-2xl border border-white/15 bg-black/25 px-4 py-3">
                            <span className="font-black text-white">
                              Responsible:
                            </span>{" "}
                            {commitment.responsiblePerson}
                          </p>
                          <p className="break-words rounded-2xl border border-white/15 bg-black/25 px-4 py-3">
                            <span className="font-black text-white">Due:</span>{" "}
                            {formatDate(commitment.dueDate)}
                          </p>

                          {isMutual && commitment.partnerEmail && (
                            <p className="break-all rounded-2xl border border-white/15 bg-black/25 px-4 py-3 md:col-span-2">
                              <span className="font-black text-white">
                                Partner Contact:
                              </span>{" "}
                              {partnerProfile?.email || commitment.partnerEmail}
                            </p>
                          )}
                        </div>

                        {isMutual && !isRejected && (
                          <div className="mt-5 rounded-[24px] border border-white/15 bg-black/25 px-4 py-4 text-sm">
                            <p className="font-black text-white">
                              Mutual completion progress
                            </p>
                            <div className="mt-3 flex flex-wrap gap-3">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${
                                  commitment.creatorDone
                                    ? "bg-emerald-300 text-black"
                                    : "bg-white/10 text-white/70"
                                }`}
                              >
                                Creator: {commitment.creatorDone ? "Done" : "Not done"}
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${
                                  commitment.partnerDone
                                    ? "bg-emerald-300 text-black"
                                    : "bg-white/10 text-white/70"
                                }`}
                              >
                                Partner: {commitment.partnerDone ? "Done" : "Not done"}
                              </span>
                            </div>
                          </div>
                        )}

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

                        {isIncoming && isAwaiting && (
                          <div className="mt-5 rounded-[24px] border border-sky-300/30 bg-sky-400/15 px-4 py-3 text-sm leading-6 text-sky-100">
                            {creatorLabel} invited you to join this commitment.
                            You can accept or reject it now.
                          </div>
                        )}

                        {openHistoryIds[commitment.id] && (
                          <HistoryTimeline
                            events={eventsByCommitment[commitment.id] ?? []}
                          />
                        )}
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap xl:w-[340px] xl:justify-end">
                        <button
                          onClick={() => toggleHistory(commitment.id)}
                          className={cardNeutralButtonClass}
                        >
                          <History size={16} />
                          {openHistoryIds[commitment.id]
                            ? "Hide History"
                            : `History (${historyCount})`}
                        </button>

                        {isOwner && (
                          <>
                            {(!isMutual ||
                              commitment.status === "awaiting_acceptance" ||
                              commitment.status === "rejected") && (
                              <button
                                onClick={() => handleEdit(commitment.id)}
                                className={cardNeutralButtonClass}
                              >
                                <Pencil size={16} />
                                Edit
                              </button>
                            )}

                            {!isMutual &&
                              displayStatus !== "Done" &&
                              displayStatus !== "Rejected" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleCopyReminder(commitment, displayStatus)
                                    }
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-300/30 bg-sky-400/15 px-4 py-3 text-sm font-black text-sky-100 shadow-sm sm:w-auto"
                                  >
                                    <BellRing size={16} />
                                    Copy Reminder
                                  </button>

                                  <button
                                    onClick={() => handleMarkSoloDone(commitment.id)}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-black shadow-lg sm:w-auto"
                                  >
                                    <CheckCircle2 size={16} />
                                    Mark Done
                                  </button>
                                </>
                              )}

                            {isMutual && isAwaiting && (
                              <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-300/30 bg-indigo-400/15 px-4 py-3 text-sm font-black text-indigo-100 shadow-sm sm:w-auto">
                                <Users size={16} />
                                Waiting for {partnerLabel}
                              </div>
                            )}

                            {isMutual &&
                              isActiveMutual &&
                              !commitment.creatorDone && (
                                <button
                                  onClick={() => handleMarkMySideDone(commitment)}
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-black shadow-lg sm:w-auto"
                                >
                                  <CheckCheck size={16} />
                                  My Side Done
                                </button>
                              )}

                            {isMutual &&
                              isActiveMutual &&
                              commitment.creatorDone && (
                                <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-400/15 px-4 py-3 text-sm font-black text-emerald-100 shadow-sm sm:w-auto">
                                  <CheckCheck size={16} />
                                  Your side done
                                </div>
                              )}

                            {canDeleteCommitment(commitment) ? (
                              <button
                                onClick={() => handleDeleteClick(commitment.id)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-400 px-4 py-3 text-sm font-black text-white shadow-lg sm:w-auto"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            ) : (
                              <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300/30 bg-rose-400/15 px-4 py-3 text-sm font-black text-rose-100 shadow-sm sm:w-auto">
                                <Lock size={16} />
                                Delete locked
                              </div>
                            )}
                          </>
                        )}

                        {!isOwner && isAwaiting && (
                          <>
                            <button
                              onClick={() => handleAcceptMutual(commitment.id)}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-black shadow-lg sm:w-auto"
                            >
                              <CheckCheck size={16} />
                              Accept
                            </button>

                            <button
                              onClick={() => handleRejectMutual(commitment.id)}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-400 px-4 py-3 text-sm font-black text-white shadow-lg sm:w-auto"
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </>
                        )}

                        {!isOwner &&
                          !isAwaiting &&
                          !isRejected &&
                          !commitment.partnerDone && (
                            <button
                              onClick={() => handleMarkMySideDone(commitment)}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-black shadow-lg sm:w-auto"
                            >
                              <CheckCheck size={16} />
                              My Side Done
                            </button>
                          )}

                        {!isOwner &&
                          !isAwaiting &&
                          !isRejected &&
                          commitment.partnerDone && (
                            <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-400/15 px-4 py-3 text-sm font-black text-emerald-100 shadow-sm sm:w-auto">
                              <CheckCheck size={16} />
                              Your side done
                            </div>
                          )}

                        {!isOwner && isRejected && (
                          <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm font-black text-white/70 shadow-sm sm:w-auto">
                            <XCircle size={16} />
                            Rejected
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
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
            className="flex flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs font-black text-white"
          >
            <CalendarDays size={20} />
            <span className="mt-1">Home</span>
          </Link>

          <button
            onClick={focusIncomingRequests}
            className="relative flex flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs font-bold text-white/60"
          >
            <Inbox size={20} />
            <span className="mt-1">Requests</span>

            {globalAwaitingIncomingCount > 0 && (
              <span className="absolute right-3 top-1 rounded-full bg-sky-300 px-1.5 py-0.5 text-[10px] font-black text-black">
                {globalAwaitingIncomingCount}
              </span>
            )}
          </button>

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
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
      } = await supabase.auth.getUser();

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

    const nextCreatorDone = isOwner ? true : commitment.creatorDone;
    const nextPartnerDone = isOwner ? commitment.partnerDone : true;
    const nextStatus = nextCreatorDone && nextPartnerDone ? "done" : "pending";

    const updatePayload = isOwner
      ? { creator_done: true, status: nextStatus }
      : { partner_done: true, status: nextStatus };

    const { error } = await supabase
      .from("commitments")
      .update(updatePayload)
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
        ? `${clearedCount} cleared. ${lockedCount} locked mutual commitment${lockedCount > 1 ? "s were" : " was"} kept.`
        : `${clearedCount} commitment${clearedCount > 1 ? "s were" : " was"} cleared.`,
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

    if (isNaN(date.getTime())) {
      return dateString;
    }

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

    if (view === "Solo") {
      return {
        title: "No solo commitments here",
        description:
          "Create a personal task, reminder, or promise to see it in this tab.",
      };
    }

    if (view === "My Mutual") {
      return {
        title: "No mutual commitments created by you",
        description:
          "Create a shared promise with another person to populate this section.",
      };
    }

    if (view === "Incoming Mutual") {
      return {
        title: "No incoming mutual commitments",
        description:
          "When someone invites your email into a shared commitment, it will appear here.",
      };
    }

    if (filter === "Awaiting") {
      return {
        title: "Nothing is awaiting action",
        description:
          "There are no commitments in an awaiting state for the current view.",
      };
    }

    if (filter === "Done") {
      return {
        title: "Nothing completed yet",
        description:
          "Completed items will appear here after they are marked done.",
      };
    }

    if (filter === "Rejected") {
      return {
        title: "No rejected commitments",
        description: "Rejected mutual requests will show up here if any exist.",
      };
    }

    if (filter === "Overdue") {
      return {
        title: "Nothing overdue",
        description:
          "Good. There are no overdue commitments in this current view.",
      };
    }

    if (filter === "Today") {
      return {
        title: "Nothing due today",
        description:
          "You do not have any commitments due today in this current view.",
      };
    }

    return {
      title: "No commitments found",
      description:
        "Try another view, another filter, another search, or create a new promise.",
    };
  };

  const filterButtonClass = (name: FilterType) =>
    `inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
      filter === name
        ? "bg-black text-white shadow-lg"
        : "bg-white/70 text-gray-700 ring-1 ring-black/5 hover:bg-white"
    }`;

  const viewButtonClass = (name: ViewType) =>
    `inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
      view === name
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
        : "bg-white/70 text-gray-700 ring-1 ring-black/5 hover:bg-white"
    }`;

  const headerGhostButtonClass =
    "inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-gray-800 shadow-sm transition hover:scale-[1.02]";

  const headerDarkButtonClass =
    "inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white shadow-xl shadow-black/10 transition hover:scale-[1.02]";

  const cardNeutralButtonClass =
    "inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm";

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-2xl rounded-[28px] border border-white/60 bg-white/80 p-6 sm:p-8 shadow-2xl backdrop-blur">
          <Link href="/" className="text-sm text-gray-600 hover:underline">
            ← Back to Home
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            You are not logged in
          </h1>
          <p className="mt-2 text-gray-600">
            Please sign in with Google first.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 text-white transition hover:scale-[1.02]"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  const emptyState = getEmptyState();

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
        className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-4 py-6 sm:px-6 sm:py-8"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-6 rounded-[30px] border border-white/60 bg-white/75 p-5 sm:p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex flex-col gap-5">
              <div>
                <Link href="/" className="text-sm text-gray-600 hover:underline">
                  ← Back to Home
                </Link>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h1 className="break-words text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
                    Dashboard
                  </h1>

                  {(globalAwaitingIncomingCount > 0 || globalOverdueCount > 0) && (
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
                      {globalAwaitingIncomingCount + globalOverdueCount} need attention
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                    Solo + Mutual
                  </span>
                  <span className="max-w-full break-all rounded-full bg-white/80 px-3 py-1 text-xs text-gray-600 ring-1 ring-black/5">
                    Logged in as: {userEmail}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:flex sm:flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSignOut}
                  className={headerGhostButtonClass}
                >
                  <LogOut size={18} />
                  Sign Out
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setClearModalOpen(true)}
                  className="w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-red-200 sm:w-auto"
                >
                  Clear My Created
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={focusIncomingRequests}
                  className={`inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium shadow-sm transition ${
                    globalAwaitingIncomingCount > 0
                      ? "border border-rose-200 bg-rose-50 text-rose-700 shadow-rose-100"
                      : "border border-black/10 bg-white text-gray-800"
                  }`}
                >
                  <BellRing size={18} />
                  Requests
                  {globalAwaitingIncomingCount > 0 && (
                    <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                      {globalAwaitingIncomingCount}
                    </span>
                  )}
                </motion.button>

                <Link href="/history" className={headerGhostButtonClass}>
                  <History size={18} />
                  History
                </Link>

                <Link href="/profile" className={headerGhostButtonClass}>
                  <Users size={18} />
                  Profile
                </Link>

                <Link href="/chat-import" className={headerGhostButtonClass}>
                  <MessageSquareText size={18} />
                  Paste Chat
                </Link>

                <Link href="/commitments/new" className={headerDarkButtonClass}>
                  <Plus size={18} />
                  New Commitment
                </Link>
              </div>
            </div>
          </motion.div>

          {(globalAwaitingIncomingCount > 0 || globalOverdueCount > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 grid gap-4 lg:grid-cols-2"
            >
              {globalAwaitingIncomingCount > 0 && (
                <div className="rounded-[28px] border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-5 shadow-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">
                        Action needed
                      </p>
                      <h2 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-900">
                        {globalAwaitingIncomingCount} request
                        {globalAwaitingIncomingCount > 1 ? "s" : ""} waiting
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        You have incoming mutual commitments waiting for accept
                        or reject.
                      </p>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                      <Inbox size={22} />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={focusIncomingRequests}
                    className="mt-4 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-rose-200"
                  >
                    <ShieldAlert size={16} />
                    Review requests
                  </motion.button>
                </div>
              )}

              {globalOverdueCount > 0 && (
                <div className="rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                        Attention
                      </p>
                      <h2 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-900">
                        {globalOverdueCount} overdue commitment
                        {globalOverdueCount > 1 ? "s" : ""}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Some commitments passed their due date and still need
                        progress.
                      </p>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                      <AlertTriangle size={22} />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={focusOverdue}
                    className="mt-4 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-medium text-slate-900 shadow-lg shadow-amber-200"
                  >
                    <Clock3 size={16} />
                    View overdue
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {incomingAwaitingRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-[30px] border border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50 p-5 sm:p-6 shadow-xl"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 shadow-sm">
                    <Inbox size={24} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="break-words text-2xl font-black tracking-tight text-slate-900">
                        Request Center
                      </h2>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                        {incomingAwaitingRequests.length} waiting
                      </span>
                    </div>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      You have incoming mutual commitments that need your
                      response. They are shown here first so they do not get
                      buried.
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={focusIncomingRequests}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-slate-200"
                >
                  <ShieldAlert size={18} />
                  Open waiting requests
                </motion.button>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {incomingAwaitingRequests.slice(0, 4).map((commitment) => {
                  const creatorLabel = getCreatorLabel(commitment);
                  const creatorProfile = getCreatorProfile(commitment);

                  return (
                    <div
                      key={`request-center-${commitment.id}`}
                      className="rounded-[24px] border border-white/70 bg-white/85 p-4 shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-md">
                          {getInitials(creatorLabel)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="break-words text-lg font-bold text-slate-900">
                              {commitment.title}
                            </p>
                            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                              Awaiting
                            </span>
                          </div>

                          <p className="mt-1 break-words text-sm font-medium text-slate-700">
                            {creatorLabel} invited you
                          </p>

                          <p className="mt-1 break-all text-xs text-slate-500">
                            {creatorProfile?.email || "Shared request"} • Due{" "}
                            {formatDate(commitment.dueDate)}
                          </p>
                        </div>
                      </div>

                      {commitment.description && (
                        <p className="mt-3 break-words text-sm leading-6 text-slate-600">
                          {commitment.description}
                        </p>
                      )}

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleAcceptMutual(commitment.id)}
                          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-200"
                        >
                          <CheckCheck size={16} />
                          Accept
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleRejectMutual(commitment.id)}
                          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-rose-200"
                        >
                          <XCircle size={16} />
                          Reject
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {incomingAwaitingRequests.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-[26px] border border-white/60 bg-white/70 p-5 shadow-xl backdrop-blur"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Info size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    No requests are waiting for your response
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    When someone invites your email into a mutual commitment, it
                    will appear in the Request Center and in the Incoming Mutual
                    tab.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {!hasAnyCommitments && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-[30px] border border-indigo-100 bg-gradient-to-br from-white to-indigo-50 p-5 sm:p-6 shadow-xl"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">
                    First-time setup
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Start with a solo commitment for yourself, or create a
                    mutual one and invite another person by email.
                  </p>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-[22px] border border-white/70 bg-white/85 p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">
                        1. Create something
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Begin with a solo promise or a shared commitment.
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-white/70 bg-white/85 p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">
                        2. Accept if mutual
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        The other side can accept or reject from their request
                        center.
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-white/70 bg-white/85 p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">
                        3. Finish both sides
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Mutual commitments only become done when both sides mark
                        done.
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/commitments/new"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white shadow-xl shadow-black/10"
                >
                  <Plus size={18} />
                  Create first commitment
                </Link>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 overflow-x-auto pb-2"
          >
            <div className="flex min-w-max gap-3">
              <button
                onClick={() => setView("All")}
                className={viewButtonClass("All")}
              >
                <span>All ({commitments.length})</span>
              </button>

              <button
                onClick={() => setView("Solo")}
                className={viewButtonClass("Solo")}
              >
                <span>
                  Solo ({commitments.filter((item) => item.mode === "solo").length})
                </span>
              </button>

              <button
                onClick={() => setView("My Mutual")}
                className={viewButtonClass("My Mutual")}
              >
                <span>
                  My Mutual (
                  {
                    commitments.filter(
                      (item) => item.mode === "mutual" && item.createdBy === userId
                    ).length
                  }
                  )
                </span>
              </button>

              <button
                onClick={() => setView("Incoming Mutual")}
                className={viewButtonClass("Incoming Mutual")}
              >
                <span>
                  Incoming Mutual (
                  {
                    commitments.filter(
                      (item) => item.mode === "mutual" && item.createdBy !== userId
                    ).length
                  }
                  )
                </span>

                {globalAwaitingIncomingCount > 0 && (
                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {globalAwaitingIncomingCount} waiting
                  </span>
                )}
              </button>
            </div>
          </motion.div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {[
              {
                label: "Total",
                value: totalCount,
                icon: CalendarDays,
                color: "from-slate-900 to-slate-700 text-white",
              },
              {
                label: "Pending",
                value: pendingCount,
                icon: Clock3,
                color: "from-amber-400 to-yellow-500 text-slate-900",
              },
              {
                label: "Awaiting",
                value: awaitingCount,
                icon: Users,
                color: "from-sky-500 to-indigo-600 text-white",
              },
              {
                label: "Done",
                value: doneCount,
                icon: CheckCircle2,
                color: "from-emerald-500 to-green-600 text-white",
              },
              {
                label: "Overdue",
                value: overdueCount,
                icon: AlertTriangle,
                color: "from-rose-500 to-red-600 text-white",
              },
              {
                label: "Due Today",
                value: todayCount,
                icon: BellRing,
                color: "from-cyan-500 to-sky-600 text-white",
              },
            ].map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * index, duration: 0.35 }}
                  whileHover={{ y: -4, scale: 1.01 }}
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
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.35 }}
            className="mb-4 rounded-[24px] border border-white/60 bg-white/75 p-3 shadow-xl backdrop-blur"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 ring-1 ring-black/5">
              <Search size={18} className="shrink-0 text-gray-500" />
              <input
                type="text"
                placeholder="Search by title, mode, partner email, category, description, or source chat"
                className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-gray-400"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.35 }}
            className="mb-6 overflow-x-auto pb-2"
          >
            <div className="flex min-w-max gap-3">
              <button
                onClick={() => setFilter("All")}
                className={filterButtonClass("All")}
              >
                <span>All</span>
              </button>

              <button
                onClick={() => setFilter("Pending")}
                className={filterButtonClass("Pending")}
              >
                <span>Pending</span>
              </button>

              <button
                onClick={() => setFilter("Awaiting")}
                className={filterButtonClass("Awaiting")}
              >
                <span>Awaiting</span>
                {awaitingCount > 0 && (
                  <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {awaitingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setFilter("Done")}
                className={filterButtonClass("Done")}
              >
                <span>Done</span>
              </button>

              <button
                onClick={() => setFilter("Overdue")}
                className={filterButtonClass("Overdue")}
              >
                <span>Overdue</span>
                {overdueCount > 0 && (
                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {overdueCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setFilter("Rejected")}
                className={filterButtonClass("Rejected")}
              >
                <span>Rejected</span>
              </button>

              <button
                onClick={() => setFilter("Today")}
                className={filterButtonClass("Today")}
              >
                <span>Due Today</span>
                {todayCount > 0 && (
                  <span className="rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {todayCount}
                  </span>
                )}
              </button>
            </div>
          </motion.div>

          {filteredCommitments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-8 sm:p-10 text-center shadow-xl backdrop-blur"
            >
              <p className="text-lg font-semibold text-slate-800">
                {emptyState.title}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {emptyState.description}
              </p>

              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/commitments/new"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white shadow-lg shadow-black/10"
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
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm"
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

                const historyCount =
                  eventsByCommitment[commitment.id]?.length ?? 0;

                return (
                  <motion.div
                    key={commitment.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index, duration: 0.28 }}
                    whileHover={{ y: -3 }}
                    className={`rounded-[30px] border bg-white/80 p-5 sm:p-6 shadow-2xl backdrop-blur-xl ${
                      isIncoming && isAwaiting
                        ? "border-sky-200 ring-2 ring-sky-100"
                        : "border-white/60"
                    }`}
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="min-w-0 break-words text-2xl font-bold tracking-tight text-gray-900">
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

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                              isIncoming
                                ? "bg-sky-100 text-sky-700 ring-sky-200"
                                : "bg-slate-100 text-slate-700 ring-slate-200"
                            }`}
                          >
                            {isIncoming ? "Incoming to you" : "Created by you"}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                            {commitment.category}
                          </span>

                          {isActiveMutual && (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                              Accepted
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-4">
                          <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xs font-bold text-white">
                              {getInitials(isIncoming ? creatorLabel : "You")}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-slate-500">
                                {isIncoming ? "Invited by" : "Creator"}
                              </p>
                              <p className="break-words text-sm font-semibold text-slate-900">
                                {isIncoming ? creatorLabel : "You"}
                              </p>
                              {isIncoming && creatorProfile?.email && (
                                <p className="break-all text-xs text-slate-500">
                                  {creatorProfile.email}
                                </p>
                              )}
                            </div>
                          </div>

                          {isMutual && (
                            <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-indigo-50 px-3 py-2 ring-1 ring-indigo-100">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-xs font-bold text-white">
                                {getInitials(partnerLabel)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-indigo-600">
                                  {isIncoming ? "Partner" : "Shared with"}
                                </p>
                                <p className="break-words text-sm font-semibold text-slate-900">
                                  {isIncoming ? "You" : partnerLabel}
                                </p>
                                {!isIncoming && (
                                  <p className="break-all text-xs text-slate-500">
                                    {partnerProfile?.email || commitment.partnerEmail}
                                  </p>
                                )}
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

                          {isMutual && commitment.partnerEmail && (
                            <p className="break-all md:col-span-2">
                              <span className="font-semibold text-slate-800">
                                Partner Contact:
                              </span>{" "}
                              {partnerProfile?.email || commitment.partnerEmail}
                            </p>
                          )}
                        </div>

                        {isMutual && !isRejected && (
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                            <p className="font-semibold text-slate-800">
                              Mutual completion progress
                            </p>
                            <div className="mt-3 flex flex-wrap gap-3">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                                  commitment.creatorDone
                                    ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                                    : "bg-slate-100 text-slate-600 ring-slate-200"
                                }`}
                              >
                                Creator:{" "}
                                {commitment.creatorDone ? "Done" : "Not done"}
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                                  commitment.partnerDone
                                    ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                                    : "bg-slate-100 text-slate-600 ring-slate-200"
                                }`}
                              >
                                Partner:{" "}
                                {commitment.partnerDone ? "Done" : "Not done"}
                              </span>
                            </div>
                          </div>
                        )}

                        {commitment.description && (
                          <p className="mt-4 break-words rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 ring-1 ring-slate-100">
                            {commitment.description}
                          </p>
                        )}

                        {commitment.sourceText && (
                          <div className="mt-4 rounded-2xl bg-indigo-50/70 p-4 ring-1 ring-indigo-100">
                            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                              Source Chat
                            </p>
                            <p className="mt-2 break-words text-sm leading-6 text-slate-700">
                              {commitment.sourceText}
                            </p>
                          </div>
                        )}

                        {isIncoming && isAwaiting && (
                          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-700">
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
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleHistory(commitment.id)}
                          className={cardNeutralButtonClass}
                        >
                          <History size={16} />
                          {openHistoryIds[commitment.id]
                            ? "Hide History"
                            : `History (${historyCount})`}
                        </motion.button>

                        {isOwner && (
                          <>
                            {(!isMutual ||
                              commitment.status === "awaiting_acceptance" ||
                              commitment.status === "rejected") && (
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleEdit(commitment.id)}
                                className={cardNeutralButtonClass}
                              >
                                <Pencil size={16} />
                                Edit
                              </motion.button>
                            )}

                            {!isMutual &&
                              displayStatus !== "Done" &&
                              displayStatus !== "Rejected" && (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() =>
                                      handleCopyReminder(commitment, displayStatus)
                                    }
                                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 shadow-sm"
                                  >
                                    <BellRing size={16} />
                                    Copy Reminder
                                  </motion.button>

                                  <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleMarkSoloDone(commitment.id)}
                                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-200"
                                  >
                                    <CheckCircle2 size={16} />
                                    Mark as Done
                                  </motion.button>
                                </>
                              )}

                            {isMutual && isAwaiting && (
                              <div className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 shadow-sm">
                                <Users size={16} />
                                Waiting for {partnerLabel}
                              </div>
                            )}

                            {isMutual &&
                              isActiveMutual &&
                              !commitment.creatorDone && (
                                <motion.button
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => handleMarkMySideDone(commitment)}
                                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-200"
                                >
                                  <CheckCheck size={16} />
                                  Mark My Side Done
                                </motion.button>
                              )}

                            {isMutual &&
                              isActiveMutual &&
                              commitment.creatorDone && (
                                <div className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
                                  <CheckCheck size={16} />
                                  Your side done
                                </div>
                              )}

                            {canDeleteCommitment(commitment) ? (
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleDeleteClick(commitment.id)}
                                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-rose-200"
                              >
                                <Trash2 size={16} />
                                Delete
                              </motion.button>
                            ) : (
                              <div className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
                                <Lock size={16} />
                                Delete locked
                              </div>
                            )}
                          </>
                        )}

                        {!isOwner && isAwaiting && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleAcceptMutual(commitment.id)}
                              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-200"
                            >
                              <CheckCheck size={16} />
                              Accept
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleRejectMutual(commitment.id)}
                              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-rose-200"
                            >
                              <XCircle size={16} />
                              Reject
                            </motion.button>
                          </>
                        )}

                        {!isOwner &&
                          !isAwaiting &&
                          !isRejected &&
                          !commitment.partnerDone && (
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleMarkMySideDone(commitment)}
                              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-200"
                            >
                              <CheckCheck size={16} />
                              Mark My Side Done
                            </motion.button>
                          )}

                        {!isOwner &&
                          !isAwaiting &&
                          !isRejected &&
                          commitment.partnerDone && (
                            <div className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
                              <CheckCheck size={16} />
                              Your side done
                            </div>
                          )}

                        {!isOwner && isRejected && (
                          <div className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
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
    </>
  );
}
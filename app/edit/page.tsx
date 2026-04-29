"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  History,
  Lock,
  LogOut,
  MessageSquareText,
  Pencil,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
  Tag,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import Toast from "@/components/ui/toast";
import ConfirmModal from "@/components/ui/confirm-modal";

type CategoryType = "Task" | "Money" | "Item" | "Meeting" | "Reminder";
type ToastVariant = "success" | "error" | "info";
type CommitmentMode = "solo" | "mutual";

type Commitment = {
  id: number;
  title: string;
  description: string;
  sourceText: string;
  responsiblePerson: string;
  partnerEmail: string;
  dueDate: string;
  category: CategoryType;
  status: string;
  mode: CommitmentMode;
  createdBy: string;
  createdAt: string;
  creatorDone: boolean;
  partnerDone: boolean;
};

type CommitmentRow = {
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

export default function EditCommitmentPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [commitmentId, setCommitmentId] = useState<number | null>(null);
  const [commitment, setCommitment] = useState<Commitment | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState<CategoryType>("Task");
  const [mode, setMode] = useState<CommitmentMode>("solo");

  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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

  const mapRowToCommitment = (item: CommitmentRow): Commitment => ({
    id: item.id,
    title: item.title ?? "",
    description: item.description ?? "",
    sourceText: item.source_text ?? "",
    responsiblePerson: item.responsible_person ?? "",
    partnerEmail: item.partner_email ?? "",
    dueDate: item.due_date ?? "",
    category: (item.category ?? "Task") as CategoryType,
    status: item.status ?? "pending",
    mode: (item.mode ?? "solo") as CommitmentMode,
    createdBy: item.created_by ?? "",
    createdAt: item.created_at ?? "",
    creatorDone: item.creator_done ?? false,
    partnerDone: item.partner_done ?? false,
  });

  const formatDateForInput = (value: string) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
  };

  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value || "No due date";
    }

    return date.toLocaleString();
  };

  const canEditCommitment = (item: Commitment | null) => {
    if (!item) return false;

    if (item.mode === "solo") return true;

    return item.status === "awaiting_acceptance" || item.status === "rejected";
  };

  const canDeleteCommitment = (item: Commitment | null) => {
    if (!item) return false;

    if (item.mode === "solo") return true;

    return (
      item.status === "awaiting_acceptance" ||
      item.status === "rejected" ||
      item.status === "done"
    );
  };

  const guessCategory = (text: string): CategoryType => {
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes("pay") ||
      lowerText.includes("paid") ||
      lowerText.includes("taka") ||
      lowerText.includes("tk") ||
      lowerText.includes("bdt") ||
      lowerText.includes("money") ||
      lowerText.includes("cash")
    ) {
      return "Money";
    }

    if (
      lowerText.includes("return") ||
      lowerText.includes("bring") ||
      lowerText.includes("charger") ||
      lowerText.includes("book") ||
      lowerText.includes("calculator") ||
      lowerText.includes("copy") ||
      lowerText.includes("notebook")
    ) {
      return "Item";
    }

    if (
      lowerText.includes("meet") ||
      lowerText.includes("meeting") ||
      lowerText.includes("call") ||
      lowerText.includes("zoom") ||
      lowerText.includes("class") ||
      lowerText.includes("hangout")
    ) {
      return "Meeting";
    }

    if (
      lowerText.includes("remind") ||
      lowerText.includes("reminder") ||
      lowerText.includes("remember")
    ) {
      return "Reminder";
    }

    return "Task";
  };

  const loadCommitment = async (id: number, currentUserId: string) => {
    const { data, error } = await supabase
      .from("commitments")
      .select("*")
      .eq("id", id)
      .eq("created_by", currentUserId)
      .single();

    if (error || !data) {
      showToast(
        "Could not load commitment",
        error?.message
          ? `${error.message}${error.code ? ` (${error.code})` : ""}`
          : "The selected commitment was not found or you do not own it.",
        "error"
      );

      setTimeout(() => {
        router.push("/dashboard");
      }, 900);

      return;
    }

    const mapped = mapRowToCommitment(data as CommitmentRow);

    setCommitment(mapped);
    setTitle(mapped.title);
    setDescription(mapped.description);
    setSourceText(mapped.sourceText);
    setResponsiblePerson(mapped.responsiblePerson);
    setPartnerEmail(mapped.partnerEmail);
    setDueDate(formatDateForInput(mapped.dueDate));
    setCategory(mapped.category);
    setMode(mapped.mode);
  };

  useEffect(() => {
    const loadPage = async () => {
      try {
        const rawId = localStorage.getItem("editingCommitmentId");
        const parsedId = rawId ? Number(rawId) : NaN;

        if (!rawId || Number.isNaN(parsedId)) {
          showToast(
            "No commitment selected",
            "Open a commitment from the dashboard first.",
            "error"
          );

          setTimeout(() => {
            router.push("/dashboard");
          }, 900);

          setMounted(true);
          return;
        }

        setCommitmentId(parsedId);

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

        await loadCommitment(parsedId, user.id);

        setMounted(true);
      } catch (error) {
        console.error("Edit page load failed:", error);
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setMounted(true);
      }
    };

    loadPage();
  }, []);

  const handleQuickFill = () => {
    const cleanText = sourceText.trim().replace(/\s+/g, " ");

    if (!cleanText) {
      showToast(
        "Source chat needed",
        "Paste or type the original message first.",
        "error"
      );
      return;
    }

    const words = cleanText.split(" ").slice(0, 8);
    const generatedTitle = words.join(" ");

    if (!title.trim()) {
      setTitle(generatedTitle);
    }

    if (!description.trim()) {
      setDescription(cleanText);
    }

    setCategory(guessCategory(cleanText));

    showToast(
      "Quick Fill applied",
      "Title, description, and category were updated from the source chat.",
      "success"
    );
  };

  const handleSave = async () => {
    if (saving || !commitmentId || !commitment) return;

    if (!canEditCommitment(commitment)) {
      showToast(
        "Editing locked",
        "This mutual commitment was already accepted. You cannot edit it unless it is awaiting acceptance or rejected.",
        "error"
      );
      return;
    }

    if (!title.trim() || !responsiblePerson.trim() || !dueDate.trim()) {
      showToast(
        "Missing required fields",
        "Please fill Title, Responsible Person, and Due Date.",
        "error"
      );
      return;
    }

    if (mode === "mutual" && !partnerEmail.trim()) {
      showToast(
        "Partner email needed",
        "Please enter the other person's email for a mutual commitment.",
        "error"
      );
      return;
    }

    setSaving(true);

    const nextStatus =
      mode === "mutual"
        ? commitment.status === "rejected"
          ? "awaiting_acceptance"
          : commitment.status || "awaiting_acceptance"
        : commitment.status === "done"
        ? "done"
        : "pending";

    const { error } = await supabase
      .from("commitments")
      .update({
        title: title.trim(),
        description: description.trim(),
        source_text: sourceText.trim(),
        responsible_person: responsiblePerson.trim(),
        partner_email:
          mode === "mutual" ? normalizeEmail(partnerEmail) : "",
        due_date: dueDate,
        category,
        mode,
        status: nextStatus,
        creator_done:
          mode === "mutual" ? commitment.creatorDone : false,
        partner_done:
          mode === "mutual" ? commitment.partnerDone : false,
      })
      .eq("id", commitmentId)
      .eq("created_by", userId);

    if (error) {
      showToast(
        "Save failed",
        `${error.message}${error.code ? ` (${error.code})` : ""}`,
        "error"
      );
      setSaving(false);
      return;
    }

    await supabase.from("commitment_events").insert({
      commitment_id: commitmentId,
      actor_user_id: userId,
      actor_email: userEmail,
      event_type: "edited",
      event_label: "Commitment edited",
      details: "The creator updated this commitment.",
    });

    localStorage.removeItem("editingCommitmentId");

    showToast(
      "Commitment updated",
      "Your changes were saved successfully.",
      "success"
    );

    setTimeout(() => {
      router.push("/dashboard");
    }, 750);
  };

  const handleDeleteConfirm = async () => {
    if (!commitmentId || !commitment || deleting) return;

    if (!canDeleteCommitment(commitment)) {
      showToast(
        "Delete locked",
        "Accepted mutual commitments cannot be deleted until completed.",
        "error"
      );
      setDeleteModalOpen(false);
      return;
    }

    setDeleting(true);

    const { error } = await supabase
      .from("commitments")
      .delete()
      .eq("id", commitmentId)
      .eq("created_by", userId);

    if (error) {
      showToast(
        "Delete failed",
        `${error.message}${error.code ? ` (${error.code})` : ""}`,
        "error"
      );
      setDeleting(false);
      setDeleteModalOpen(false);
      return;
    }

    localStorage.removeItem("editingCommitmentId");

    showToast("Commitment deleted", "The commitment was removed.", "success");

    setTimeout(() => {
      router.push("/dashboard");
    }, 750);
  };

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);
    await supabase.auth.signOut();

    showToast("Signed out", "You have been logged out.", "success");

    setTimeout(() => {
      router.push("/login");
    }, 700);
  };
    const inputClass =
    "w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white shadow-sm outline-none ring-1 ring-white/5 transition placeholder:text-white/30 focus:border-indigo-300/50 focus:bg-black/35 focus:ring-2 focus:ring-indigo-400/30";

  const labelClass =
    "mb-2 flex items-center gap-2 text-sm font-black text-white/75";

  const locked = commitment ? !canEditCommitment(commitment) : false;
  const deleteLocked = commitment ? !canDeleteCommitment(commitment) : false;

  const previewTitle = title.trim() || "Commitment title";
  const previewResponsible = responsiblePerson.trim() || "Responsible person";
  const previewDescription =
    description.trim() || "A clear promise with owner, deadline, and status.";
  const previewDue = dueDate ? formatDate(dueDate) : "No due date selected";

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#07070a] px-4 text-white">
        <div className="relative rounded-[30px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
              <Pencil size={18} />
            </div>

            <div>
              <p className="text-sm font-black">Loading editor</p>
              <p className="mt-1 text-xs text-white/45">
                Opening the selected commitment...
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
            Please sign in with Google first to edit commitments.
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
        open={deleteModalOpen}
        title="Delete this commitment?"
        message="This action cannot be undone. Accepted active mutual commitments cannot be deleted until both sides complete them."
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalOpen(false)}
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
                  Edit commitment
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

          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden rounded-[38px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-2xl sm:p-7 lg:p-8"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-indigo-200">
                <Pencil size={15} />
                Commitment editor
              </div>

              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                Edit before the promise becomes locked.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/58 sm:text-base">
                Solo commitments can be edited. Mutual commitments can be edited
                only while awaiting acceptance or after rejection.
              </p>

              {locked && (
                <div className="mt-6 rounded-[28px] border border-rose-300/35 bg-rose-400/10 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-400 text-white">
                      <Lock size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-black text-white">
                        Editing locked
                      </p>
                      <p className="mt-2 text-sm leading-7 text-white/60">
                        This accepted mutual commitment cannot be edited now.
                        Both sides must complete it first.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      <Users size={16} />
                      Mode
                    </label>

                    <select
                      className={inputClass}
                      value={mode}
                      onChange={(event) =>
                        setMode(event.target.value as CommitmentMode)
                      }
                      disabled={locked}
                    >
                      <option className="bg-[#0d0d13]" value="solo">
                        Solo
                      </option>
                      <option className="bg-[#0d0d13]" value="mutual">
                        Mutual
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      <Tag size={16} />
                      Category
                    </label>

                    <select
                      className={inputClass}
                      value={category}
                      onChange={(event) =>
                        setCategory(event.target.value as CategoryType)
                      }
                      disabled={locked}
                    >
                      <option className="bg-[#0d0d13]">Task</option>
                      <option className="bg-[#0d0d13]">Money</option>
                      <option className="bg-[#0d0d13]">Item</option>
                      <option className="bg-[#0d0d13]">Meeting</option>
                      <option className="bg-[#0d0d13]">Reminder</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    <Sparkles size={16} />
                    Title
                  </label>

                  <input
                    type="text"
                    placeholder="Example: Send project file before 10 PM"
                    className={inputClass}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    disabled={locked}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    <MessageSquareText size={16} />
                    Description
                  </label>

                  <textarea
                    placeholder="Write a short explanation..."
                    className={`${inputClass} min-h-28 resize-none`}
                    rows={4}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    disabled={locked}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    <MessageSquareText size={16} />
                    Source chat / original message
                  </label>

                  <textarea
                    placeholder="Paste the original chat or message here..."
                    className={`${inputClass} min-h-36 resize-none`}
                    rows={5}
                    value={sourceText}
                    onChange={(event) => setSourceText(event.target.value)}
                    disabled={locked}
                  />
                </div>

                <button
                  onClick={handleQuickFill}
                  disabled={locked}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-300/25 bg-indigo-400/10 px-5 py-4 text-sm font-black text-indigo-100 shadow-xl transition hover:bg-indigo-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles size={18} />
                  Quick Fill from Source Chat
                </button>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      <UserRound size={16} />
                      Responsible person
                    </label>

                    <input
                      type="text"
                      placeholder="Example: Ayat"
                      className={inputClass}
                      value={responsiblePerson}
                      onChange={(event) =>
                        setResponsiblePerson(event.target.value)
                      }
                      disabled={locked}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      <Clock3 size={16} />
                      Due date
                    </label>

                    <input
                      type="datetime-local"
                      className={inputClass}
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                      disabled={locked}
                    />
                  </div>
                </div>

                {mode === "mutual" && (
                  <div className="rounded-[28px] border border-sky-300/35 bg-sky-400/10 p-5">
                    <label className="mb-2 flex items-center gap-2 text-sm font-black text-sky-100">
                      <Users size={16} />
                      Partner email
                    </label>

                    <input
                      type="email"
                      placeholder="Example: friend@gmail.com"
                      className={inputClass}
                      value={partnerEmail}
                      onChange={(event) => setPartnerEmail(event.target.value)}
                      disabled={locked}
                    />

                    <p className="mt-3 text-xs leading-5 text-sky-100/65">
                      If a rejected mutual commitment is saved again, it returns
                      to awaiting acceptance.
                    </p>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    onClick={handleSave}
                    disabled={saving || locked}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-black shadow-xl shadow-white/10 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
                  >
                    <Save size={17} />
                    {saving ? "Saving..." : "Save changes"}
                  </button>

                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    disabled={deleteLocked || deleting}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300/30 bg-rose-400/10 px-5 py-4 text-sm font-black text-rose-100 shadow-xl transition hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={17} />
                    Delete
                  </button>
                </div>
              </div>
            </motion.section>

            <motion.aside
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.35 }}
              className="space-y-5"
            >
              <div className="rounded-[38px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">
                  <CheckCircle2 size={15} />
                  Live preview
                </div>

                <div className="mt-6 rounded-[32px] border border-white/10 bg-gradient-to-br from-white to-slate-200 p-5 text-black shadow-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">
                        Promise
                      </p>

                      <h2 className="mt-3 break-words text-2xl font-black leading-tight tracking-tight">
                        {previewTitle}
                      </h2>
                    </div>

                    <div className="rounded-2xl bg-amber-300 px-3 py-2 text-xs font-black text-black">
                      {commitment?.status === "rejected"
                        ? "Rejected"
                        : mode === "mutual"
                        ? "Mutual"
                        : "Solo"}
                    </div>
                  </div>

                  <p className="mt-4 break-words text-sm leading-6 text-black/60">
                    {previewDescription}
                  </p>

                  <div className="mt-6 grid gap-3">
                    <div className="rounded-2xl bg-black/[0.04] p-4">
                      <p className="text-xs font-bold text-black/45">
                        Responsible
                      </p>
                      <p className="mt-1 break-words font-black">
                        {previewResponsible}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/[0.04] p-4">
                      <p className="text-xs font-bold text-black/45">Due</p>
                      <p className="mt-1 break-words font-black">
                        {previewDue}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/[0.04] p-4">
                      <p className="text-xs font-bold text-black/45">
                        Category
                      </p>
                      <p className="mt-1 font-black">{category}</p>
                    </div>

                    {mode === "mutual" && (
                      <div className="rounded-2xl bg-black p-4 text-white">
                        <p className="text-xs font-bold text-white/45">
                          Partner email
                        </p>
                        <p className="mt-1 break-all font-black">
                          {partnerEmail.trim() || "partner@example.com"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-[38px] border border-amber-300/70 bg-[#352407] p-5 shadow-2xl sm:p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-black">
                  <ShieldAlert size={20} />
                </div>

                <h2 className="mt-5 text-3xl font-black tracking-tight text-white">
                  Editing rule
                </h2>

                <p className="mt-3 text-sm leading-7 text-white/65">
                  Editing accepted mutual commitments would break trust. That is
                  why they become locked after acceptance.
                </p>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white/70">
                  Current status: {commitment?.status || "unknown"}
                </div>
              </div>

              <div className="rounded-[38px] border border-sky-300/70 bg-[#06283f] p-5 shadow-2xl sm:p-7">
                <h2 className="text-2xl font-black tracking-tight text-white">
                  Navigation
                </h2>

                <div className="mt-5 grid gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-4 text-sm font-black text-white/85 transition hover:bg-white/12"
                  >
                    <CalendarDays size={17} />
                    Dashboard
                  </Link>

                  <Link
                    href="/history"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-4 text-sm font-black text-white/85 transition hover:bg-white/12"
                  >
                    <History size={17} />
                    History
                  </Link>
                </div>
              </div>
            </motion.aside>
          </section>
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
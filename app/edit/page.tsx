/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  CalendarDays,
  FilePenLine,
  Lock,
  MessageSquareText,
  Tag,
  UserRound,
  Users,
} from "lucide-react";
import Toast from "@/components/ui/toast";

type CommitmentMode = "solo" | "mutual";
type CategoryType = "Task" | "Money" | "Item" | "Meeting" | "Reminder";
type SoloStatusType = "pending" | "done";
type ToastVariant = "success" | "error" | "info";

type EditRow = {
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
  creator_done: boolean | null;
  partner_done: boolean | null;
};

export default function EditCommitmentPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [editingId, setEditingId] = useState<string>("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState<CategoryType>("Task");
  const [status, setStatus] = useState<SoloStatusType>("pending");
  const [mode, setMode] = useState<CommitmentMode>("solo");
  const [creatorDone, setCreatorDone] = useState(false);
  const [partnerDone, setPartnerDone] = useState(false);
  const [rawStatus, setRawStatus] = useState("pending");

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

  const isMutualLocked =
    mode === "mutual" &&
    rawStatus !== "awaiting_acceptance" &&
    rawStatus !== "rejected";

  useEffect(() => {
    const loadCommitment = async () => {
      const localEditingId = localStorage.getItem("editingCommitmentId");

      if (!localEditingId) {
        setNotFound(true);
        setMounted(true);
        return;
      }

      setEditingId(localEditingId);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("commitments")
        .select("*")
        .eq("id", Number(localEditingId))
        .eq("created_by", user.id)
        .single<EditRow>();

      if (error || !data) {
        setNotFound(true);
        setMounted(true);
        return;
      }

      const loadedMode = (data.mode ?? "solo") as CommitmentMode;
      const loadedStatus = data.status ?? "pending";

      setTitle(data.title ?? "");
      setDescription(data.description ?? "");
      setSourceText(data.source_text ?? "");
      setResponsiblePerson(data.responsible_person ?? "");
      setPartnerEmail(data.partner_email ?? "");
      setDueDate(data.due_date ?? "");
      setCategory((data.category ?? "Task") as CategoryType);
      setMode(loadedMode);
      setRawStatus(loadedStatus);
      setCreatorDone(data.creator_done ?? false);
      setPartnerDone(data.partner_done ?? false);

      if (loadedStatus === "done") {
        setStatus("done");
      } else {
        setStatus("pending");
      }

      setMounted(true);
    };

    loadCommitment();
  }, [router]);

  const getMutualStatusLabel = () => {
    if (rawStatus === "awaiting_acceptance") return "Awaiting acceptance";
    if (rawStatus === "rejected") return "Rejected";
    if (rawStatus === "done") return "Done";
    return "Accepted / Active";
  };

  const getMutualStatusClass = () => {
    if (rawStatus === "awaiting_acceptance") {
      return "bg-sky-100 text-sky-700 ring-sky-200";
    }

    if (rawStatus === "rejected") {
      return "bg-slate-200 text-slate-700 ring-slate-300";
    }

    if (rawStatus === "done") {
      return "bg-emerald-100 text-emerald-700 ring-emerald-200";
    }

    return "bg-amber-100 text-amber-700 ring-amber-200";
  };

  const handleUpdate = async () => {
    if (isMutualLocked) {
      showToast(
        "Editing locked",
        "This mutual commitment was already accepted, so edits are no longer allowed.",
        "error"
      );
      return;
    }

    if (!title || !responsiblePerson || !dueDate) {
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
        "Mutual commitments must keep a partner email.",
        "error"
      );
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      showToast("Login required", "Please log in first.", "error");
      setTimeout(() => {
        router.push("/login");
      }, 800);
      return;
    }

    const updatePayload =
      mode === "solo"
        ? {
            title,
            description,
            source_text: sourceText,
            responsible_person: responsiblePerson,
            due_date: dueDate,
            category,
            status,
          }
        : {
            title,
            description,
            source_text: sourceText,
            responsible_person: responsiblePerson,
            partner_email: partnerEmail.trim().toLowerCase(),
            due_date: dueDate,
            category,
          };

    const { error } = await supabase
      .from("commitments")
      .update(updatePayload)
      .eq("id", Number(editingId))
      .eq("created_by", user.id);

    if (error) {
      showToast(
        "Could not update commitment",
        `${error.message}${error.code ? ` (${error.code})` : ""}`,
        "error"
      );
      return;
    }

    await supabase.from("commitment_events").insert({
      commitment_id: Number(editingId),
      actor_user_id: user.id,
      actor_email: user.email,
      event_type: "edited",
      event_label: "Commitment details updated",
      details:
        mode === "mutual"
          ? "The creator updated details before acceptance."
          : "The creator updated this solo commitment.",
    });

    localStorage.removeItem("editingCommitmentId");

    showToast(
      "Commitment updated",
      mode === "mutual"
        ? "Mutual details were updated before acceptance."
        : "Your changes were saved successfully.",
      "success"
    );

    setTimeout(() => {
      router.push("/dashboard");
    }, 850);
  };

  const inputClass =
    "w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-gray-800 shadow-sm outline-none ring-1 ring-black/5 transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200";

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-6 py-8">
        <div className="mx-auto max-w-3xl rounded-[30px] border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
          <p className="text-sm text-gray-600">Loading commitment...</p>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-6 py-8">
        <div className="mx-auto max-w-3xl rounded-[30px] border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
            Commitment not found
          </h1>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            The selected commitment could not be loaded.
          </p>
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
        className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-6 py-8"
      >
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.35 }}
            className="rounded-[30px] border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl"
          >
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:underline"
            >
              ← Back to Dashboard
            </Link>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                Edit Flow
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                  mode === "mutual"
                    ? "bg-sky-100 text-sky-700 ring-sky-200"
                    : "bg-white/80 text-slate-700 ring-black/5"
                }`}
              >
                {mode === "mutual" ? "Mutual" : "Solo"}
              </span>

              {isMutualLocked && (
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                  Locked after acceptance
                </span>
              )}
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">
              Edit Commitment
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Update the commitment details without breaking the accountability
              rules.
            </p>

            {mode === "mutual" && (
              <div className="mt-6 rounded-[24px] border border-sky-200 bg-sky-50/80 p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getMutualStatusClass()}`}
                  >
                    {getMutualStatusLabel()}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                      creatorDone
                        ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                        : "bg-slate-100 text-slate-600 ring-slate-200"
                    }`}
                  >
                    Creator: {creatorDone ? "Done" : "Not done"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                      partnerDone
                        ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                        : "bg-slate-100 text-slate-600 ring-slate-200"
                    }`}
                  >
                    Partner: {partnerDone ? "Done" : "Not done"}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-sky-700">
                  Mutual completion is controlled from the dashboard.
                  {isMutualLocked
                    ? " This commitment was already accepted, so all edits are now locked."
                    : " Since it is not accepted yet, edits are still allowed."}
                </p>
              </div>
            )}

            {isMutualLocked && (
              <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                    <Lock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-rose-800">
                      Editing is disabled
                    </p>
                    <p className="mt-1 text-sm leading-6 text-rose-700">
                      This mutual commitment has already been accepted. To keep
                      the promise fair and trustworthy, its details can no
                      longer be changed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 space-y-5">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FilePenLine size={16} />
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Edit title"
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isMutualLocked}
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MessageSquareText size={16} />
                  Description
                </label>
                <textarea
                  placeholder="Edit description"
                  className={`${inputClass} min-h-28 resize-none`}
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isMutualLocked}
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MessageSquareText size={16} />
                  Source Chat / Original Message
                </label>
                <textarea
                  placeholder="Edit source chat"
                  className={`${inputClass} min-h-32 resize-none`}
                  rows={4}
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  disabled={isMutualLocked}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <UserRound size={16} />
                    Responsible Person
                  </label>
                  <input
                    type="text"
                    placeholder="Responsible person"
                    className={inputClass}
                    value={responsiblePerson}
                    onChange={(e) => setResponsiblePerson(e.target.value)}
                    disabled={isMutualLocked}
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <CalendarDays size={16} />
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={isMutualLocked}
                  />
                </div>
              </div>

              {mode === "mutual" && (
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Users size={16} />
                    Partner Email
                  </label>
                  <input
                    type="email"
                    placeholder="Partner email"
                    className={inputClass}
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    disabled={isMutualLocked}
                  />
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Tag size={16} />
                    Category
                  </label>
                  <select
                    className={inputClass}
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryType)}
                    disabled={isMutualLocked}
                  >
                    <option>Task</option>
                    <option>Money</option>
                    <option>Item</option>
                    <option>Meeting</option>
                    <option>Reminder</option>
                  </select>
                </div>

                {mode === "solo" ? (
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Tag size={16} />
                      Status
                    </label>
                    <select
                      className={inputClass}
                      value={status}
                      onChange={(e) => setStatus(e.target.value as SoloStatusType)}
                    >
                      <option value="pending">Pending</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Tag size={16} />
                      Mutual Status
                    </label>
                    <div
                      className={`${inputClass} flex items-center bg-slate-50 text-slate-700`}
                    >
                      {getMutualStatusLabel()}
                    </div>
                  </div>
                )}
              </div>

              {!isMutualLocked && (
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={handleUpdate}
                  className="w-full rounded-2xl bg-black px-5 py-4 text-sm font-semibold text-white shadow-xl shadow-black/10 transition"
                >
                  Update Commitment
                </motion.button>
              )}

              {isMutualLocked && (
                <Link
                  href="/dashboard"
                  className="block w-full rounded-2xl bg-black px-5 py-4 text-center text-sm font-semibold text-white shadow-xl shadow-black/10 transition"
                >
                  Back to Dashboard
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </motion.main>
    </>
  );
}
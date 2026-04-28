/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  CalendarDays,
  MessageSquareText,
  Sparkles,
  Tag,
  UserRound,
  Users,
} from "lucide-react";
import Toast from "@/components/ui/toast";

type CategoryType = "Task" | "Money" | "Item" | "Meeting" | "Reminder";
type ToastVariant = "success" | "error" | "info";
type CommitmentMode = "solo" | "mutual";

export default function NewCommitmentPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState<CategoryType>("Task");
  const [mode, setMode] = useState<CommitmentMode>("solo");

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

  useEffect(() => {
    const draftSourceText = localStorage.getItem("draftSourceText");

    if (draftSourceText) {
      setSourceText(draftSourceText);
      localStorage.removeItem("draftSourceText");
    }
  }, []);

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

  const handleQuickFill = () => {
    if (!sourceText.trim()) {
      showToast(
        "Source chat needed",
        "Paste or type the original message first.",
        "error"
      );
      return;
    }

    const cleanText = sourceText.trim().replace(/\s+/g, " ");
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
        "Please enter the other person's email for a mutual commitment.",
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

    const initialStatus = mode === "mutual" ? "awaiting_acceptance" : "pending";

    const { data: insertedRow, error } = await supabase
      .from("commitments")
      .insert({
        title,
        description,
        source_text: sourceText,
        responsible_person: responsiblePerson,
        partner_email: mode === "mutual" ? partnerEmail.trim().toLowerCase() : "",
        due_date: dueDate,
        category,
        status: initialStatus,
        mode,
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !insertedRow) {
      showToast(
        "Could not save commitment",
        `${error?.message ?? "Unknown error"}${
          error?.code ? ` (${error.code})` : ""
        }`,
        "error"
      );
      return;
    }

    await supabase.from("commitment_events").insert({
      commitment_id: insertedRow.id,
      actor_user_id: user.id,
      actor_email: user.email,
      event_type: "created",
      event_label: mode === "mutual" ? "Mutual commitment created" : "Commitment created",
      details:
        mode === "mutual"
          ? `Created a mutual commitment and invited ${partnerEmail.trim().toLowerCase()}.`
          : "Created a solo commitment.",
    });

    showToast(
      mode === "mutual" ? "Mutual commitment saved" : "Commitment saved",
      mode === "mutual"
        ? "The partner email was attached and the activity log has started."
        : "Your solo commitment has been added successfully.",
      "success"
    );

    setTimeout(() => {
      router.push("/dashboard");
    }, 850);
  };

  const inputClass =
    "w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-gray-800 shadow-sm outline-none ring-1 ring-black/5 transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200";

  const modeButtonClass = (currentMode: CommitmentMode) =>
    `flex-1 rounded-2xl px-4 py-4 text-left transition ${
      mode === currentMode
        ? "bg-black text-white shadow-xl shadow-black/10"
        : "bg-white text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
    }`;

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
            <Link href="/" className="text-sm text-gray-600 hover:underline">
              ← Back to Home
            </Link>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                Hybrid Flow
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
                Solo + Mutual
              </span>
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-gray-900">
              Create Commitment
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Choose whether this is a personal promise or a mutual commitment
              involving another person.
            </p>

            <div className="mt-8">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Users size={16} />
                Commitment Mode
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode("solo")}
                  className={modeButtonClass("solo")}
                >
                  <p className="text-sm font-semibold">Solo</p>
                  <p
                    className={`mt-1 text-xs leading-5 ${
                      mode === "solo" ? "text-white/80" : "text-slate-500"
                    }`}
                  >
                    For your personal task, promise, or reminder.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("mutual")}
                  className={modeButtonClass("mutual")}
                >
                  <p className="text-sm font-semibold">Mutual</p>
                  <p
                    className={`mt-1 text-xs leading-5 ${
                      mode === "mutual" ? "text-white/80" : "text-slate-500"
                    }`}
                  >
                    For a shared promise involving another person.
                  </p>
                </button>
              </div>
            </div>

            <div className="mt-8 space-y-5">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Sparkles size={16} />
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Example: Send project file before 10 PM"
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MessageSquareText size={16} />
                  Description
                </label>
                <textarea
                  placeholder="Write a short explanation..."
                  className={`${inputClass} min-h-28 resize-none`}
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MessageSquareText size={16} />
                  Source Chat / Original Message
                </label>
                <textarea
                  placeholder="Paste the original chat or message here..."
                  className={`${inputClass} min-h-36 resize-none`}
                  rows={5}
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={handleQuickFill}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition"
              >
                <Sparkles size={18} />
                Quick Fill from Source Chat
              </motion.button>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <UserRound size={16} />
                    Responsible Person
                  </label>
                  <input
                    type="text"
                    placeholder="Example: Ayat"
                    className={inputClass}
                    value={responsiblePerson}
                    onChange={(e) => setResponsiblePerson(e.target.value)}
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
                  />
                </div>
              </div>

              {mode === "mutual" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[24px] border border-indigo-100 bg-indigo-50/70 p-5 shadow-sm"
                >
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-800">
                    <Users size={16} />
                    Partner Email
                  </label>
                  <input
                    type="email"
                    placeholder="Example: friend@gmail.com"
                    className={inputClass}
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                  />
                  <p className="mt-2 text-xs leading-5 text-indigo-700">
                    This mutual commitment will be saved with the partner email.
                  </p>
                </motion.div>
              )}

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Tag size={16} />
                  Category
                </label>
                <select
                  className={inputClass}
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                >
                  <option>Task</option>
                  <option>Money</option>
                  <option>Item</option>
                  <option>Meeting</option>
                  <option>Reminder</option>
                </select>
              </div>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={handleSave}
                className="w-full rounded-2xl bg-black px-5 py-4 text-sm font-semibold text-white shadow-xl shadow-black/10 transition"
              >
                Save Commitment
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.main>
    </>
  );
}
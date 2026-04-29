/* eslint-disable react-hooks/set-state-in-effect */
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
  Handshake,
  MessageSquareText,
  ShieldCheck,
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
  const [saving, setSaving] = useState(false);

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
    if (saving) return;

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

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        await supabase.auth.signOut();
        showToast("Login required", "Please log in again first.", "error");
        setTimeout(() => {
          router.push("/login");
        }, 800);
        return;
      }

      if (!user?.email) {
        showToast("Login required", "Please log in first.", "error");
        setTimeout(() => {
          router.push("/login");
        }, 800);
        return;
      }

      const initialStatus =
        mode === "mutual" ? "awaiting_acceptance" : "pending";

      const { data: insertedRow, error } = await supabase
        .from("commitments")
        .insert({
          title: title.trim(),
          description: description.trim(),
          source_text: sourceText.trim(),
          responsible_person: responsiblePerson.trim(),
          partner_email:
            mode === "mutual" ? partnerEmail.trim().toLowerCase() : "",
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
        event_label:
          mode === "mutual"
            ? "Mutual commitment created"
            : "Commitment created",
        details:
          mode === "mutual"
            ? `Created a mutual commitment and invited ${partnerEmail
                .trim()
                .toLowerCase()}.`
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
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white shadow-sm outline-none ring-1 ring-white/5 transition placeholder:text-white/30 focus:border-indigo-300/50 focus:bg-white/[0.09] focus:ring-2 focus:ring-indigo-400/30";

  const labelClass =
    "mb-2 flex items-center gap-2 text-sm font-bold text-white/75";

  const modeButtonClass = (currentMode: CommitmentMode) =>
    `rounded-[24px] border p-5 text-left transition ${
      mode === currentMode
        ? "border-white/20 bg-white text-black shadow-2xl shadow-white/10"
        : "border-white/10 bg-white/[0.05] text-white hover:bg-white/[0.08]"
    }`;

  const previewTitle = title.trim() || "Finish 2 hours of focused study tonight";
  const previewResponsible = responsiblePerson.trim() || "You";
  const previewDescription =
    description.trim() ||
    "A clear promise with one responsible person, one deadline, and visible status.";
  const previewDue = dueDate
    ? new Date(dueDate).toLocaleString()
    : "No due date selected";

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
        className="min-h-screen overflow-hidden bg-[#07070a] text-white"
      >
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-indigo-600/25 blur-3xl" />
          <div className="absolute right-[-12rem] top-[18rem] h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="absolute bottom-[-16rem] left-[-10rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <nav className="mb-8 flex items-center justify-between rounded-[28px] border border-white/10 bg-white/[0.04] px-4 py-4 shadow-2xl backdrop-blur-xl sm:px-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black shadow-lg">
                <Sparkles size={20} />
              </div>

              <div>
                <p className="text-lg font-black tracking-tight">We Keep</p>
                <p className="hidden text-xs text-white/45 sm:block">
                  Create a visible promise
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="hidden rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 sm:inline-flex"
              >
                Dashboard
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
              >
                <ArrowLeft size={16} />
                Home
              </Link>
            </div>
          </nav>

          <section className="grid gap-8 pb-12 lg:grid-cols-[1fr_0.82fr] lg:items-start">
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="rounded-[38px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-2xl sm:p-7 lg:p-8"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-indigo-200">
                <ShieldCheck size={15} />
                New commitment
              </div>

              <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-6xl">
                Turn a promise into something visible.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/58">
                Define what has to happen, who is responsible, when it is due,
                and whether another person must confirm it.
              </p>

              <div className="mt-8">
                <label className={labelClass}>
                  <Users size={16} />
                  Commitment mode
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setMode("solo")}
                    className={modeButtonClass("solo")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
                        <UserRound size={18} />
                      </div>

                      {mode === "solo" && (
                        <CheckCircle2 size={20} className="text-black" />
                      )}
                    </div>

                    <p className="mt-4 text-lg font-black">Solo</p>
                    <p
                      className={`mt-2 text-sm leading-6 ${
                        mode === "solo" ? "text-black/55" : "text-white/45"
                      }`}
                    >
                      A personal promise, task, or reminder you complete
                      yourself.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("mutual")}
                    className={modeButtonClass("mutual")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
                        <Handshake size={18} />
                      </div>

                      {mode === "mutual" && (
                        <CheckCircle2 size={20} className="text-black" />
                      )}
                    </div>

                    <p className="mt-4 text-lg font-black">Mutual</p>
                    <p
                      className={`mt-2 text-sm leading-6 ${
                        mode === "mutual" ? "text-black/55" : "text-white/45"
                      }`}
                    >
                      A shared commitment where another person must accept and
                      confirm.
                    </p>
                  </button>
                </div>
              </div>

              <div className="mt-8 space-y-5">
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
                    onChange={(e) => setTitle(e.target.value)}
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
                    onChange={(e) => setDescription(e.target.value)}
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
                    onChange={(e) => setSourceText(e.target.value)}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={handleQuickFill}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-300/20 bg-indigo-400/10 px-5 py-4 text-sm font-black text-indigo-100 shadow-xl shadow-indigo-900/10 transition hover:bg-indigo-400/15"
                >
                  <Sparkles size={18} />
                  Quick Fill from Source Chat
                </motion.button>

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
                      onChange={(e) => setResponsiblePerson(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      <CalendarDays size={16} />
                      Due date
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
                    className="rounded-[28px] border border-indigo-300/20 bg-indigo-400/10 p-5 shadow-xl shadow-indigo-950/10"
                  >
                    <label className="mb-2 flex items-center gap-2 text-sm font-bold text-indigo-100">
                      <Users size={16} />
                      Partner email
                    </label>

                    <input
                      type="email"
                      placeholder="Example: friend@gmail.com"
                      className={inputClass}
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                    />

                    <p className="mt-3 text-xs leading-5 text-indigo-100/60">
                      This mutual commitment will wait for the other person to
                      accept it.
                    </p>
                  </motion.div>
                )}

                <div>
                  <label className={labelClass}>
                    <Tag size={16} />
                    Category
                  </label>

                  <select
                    className={inputClass}
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as CategoryType)
                    }
                  >
                    <option className="bg-[#0d0d13]">Task</option>
                    <option className="bg-[#0d0d13]">Money</option>
                    <option className="bg-[#0d0d13]">Item</option>
                    <option className="bg-[#0d0d13]">Meeting</option>
                    <option className="bg-[#0d0d13]">Reminder</option>
                  </select>
                </div>

                <motion.button
                  whileHover={{ scale: saving ? 1 : 1.015 }}
                  whileTap={{ scale: saving ? 1 : 0.985 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-black shadow-2xl shadow-white/10 transition hover:scale-[1.015] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Saving commitment..." : "Save commitment"}
                  {!saving && <ArrowRight size={18} />}
                </motion.button>
              </div>
            </motion.section>

            <motion.aside
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.45 }}
              className="lg:sticky lg:top-6"
            >
              <div className="relative">
                <div className="absolute -inset-4 rounded-[42px] bg-gradient-to-br from-indigo-500/30 via-fuchsia-500/10 to-cyan-400/20 blur-2xl" />

                <div className="relative rounded-[38px] border border-white/12 bg-white/[0.07] p-4 shadow-2xl backdrop-blur-2xl sm:p-5">
                  <div className="rounded-[32px] border border-white/10 bg-[#0d0d13] p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white/45">
                          Live preview
                        </p>
                        <h2 className="mt-2 text-3xl font-black tracking-tight">
                          Commitment card
                        </h2>
                      </div>

                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-white/60">
                        {mode === "mutual" ? "Mutual" : "Solo"}
                      </span>
                    </div>

                    <div className="mt-6 rounded-[28px] bg-gradient-to-br from-white to-slate-200 p-5 text-black shadow-2xl sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">
                            Promise
                          </p>

                          <h3 className="mt-3 break-words text-2xl font-black leading-tight tracking-tight">
                            {previewTitle}
                          </h3>
                        </div>

                        <div className="rounded-2xl bg-amber-300 px-3 py-2 text-xs font-black text-black">
                          {mode === "mutual" ? "Awaiting" : "Pending"}
                        </div>
                      </div>

                      <p className="mt-4 break-words text-sm leading-6 text-black/58">
                        {previewDescription}
                      </p>

                      <div className="mt-6 grid gap-3">
                        <div className="rounded-2xl bg-black/[0.04] p-4">
                          <div className="flex items-center gap-2 text-black/45">
                            <UserRound size={16} />
                            <p className="text-xs font-semibold">
                              Responsible
                            </p>
                          </div>
                          <p className="mt-2 break-words font-black">
                            {previewResponsible}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-black/[0.04] p-4">
                          <div className="flex items-center gap-2 text-black/45">
                            <Clock3 size={16} />
                            <p className="text-xs font-semibold">Due</p>
                          </div>
                          <p className="mt-2 break-words font-black">
                            {previewDue}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-black/[0.04] p-4">
                          <div className="flex items-center gap-2 text-black/45">
                            <Tag size={16} />
                            <p className="text-xs font-semibold">Category</p>
                          </div>
                          <p className="mt-2 font-black">{category}</p>
                        </div>

                        {mode === "mutual" && (
                          <div className="rounded-2xl bg-black p-4 text-white">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-black">
                                <Handshake size={18} />
                              </div>

                              <div>
                                <p className="text-sm font-black">
                                  Waiting for partner acceptance
                                </p>
                                <p className="mt-1 break-all text-xs leading-5 text-white/50">
                                  {partnerEmail.trim()
                                    ? partnerEmail.trim().toLowerCase()
                                    : "partner@example.com"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                      <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-black">
                            <CheckCircle2 size={17} />
                          </div>

                          <div>
                            <p className="text-sm font-black">
                              Clear completion
                            </p>
                            <p className="mt-1 text-xs leading-5 text-white/45">
                              Solo commitments become done when you mark them.
                              Mutual commitments need both sides.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-black">
                            <MessageSquareText size={17} />
                          </div>

                          <div>
                            <p className="text-sm font-black">
                              Source chat preserved
                            </p>
                            <p className="mt-1 text-xs leading-5 text-white/45">
                              The original message can stay attached so the
                              promise has context.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm font-bold text-white/80 shadow-xl backdrop-blur transition hover:bg-white/10"
              >
                Go to dashboard
                <ArrowRight size={18} />
              </Link>
            </motion.aside>
          </section>
        </div>
      </motion.main>
    </>
  );
}
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
  History,
  Info,
  LogOut,
  MessageSquareText,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import Toast from "@/components/ui/toast";

type ToastVariant = "success" | "error" | "info";

export default function ChatImportPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const [sourceText, setSourceText] = useState("");
  const [saving, setSaving] = useState(false);
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
        setUserEmail(user.email);
        setMounted(true);
      } catch (error) {
        console.error("Chat import load failed:", error);
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setMounted(true);
      }
    };

    loadPage();
  }, []);

  const handleUseExample = () => {
    setSourceText(
      "Bro I promise I will finish 2 hours of focused study tonight before 10:30 PM. If I don't, remind me again."
    );

    showToast(
      "Example added",
      "You can edit the message before sending it to New Commitment.",
      "info"
    );
  };

  const handleClear = () => {
    setSourceText("");
    localStorage.removeItem("draftSourceText");

    showToast("Cleared", "The pasted message was removed.", "success");
  };

  const handleSendToNewCommitment = () => {
    const cleanText = sourceText.trim();

    if (!cleanText) {
      showToast(
        "Paste something first",
        "Add a chat, promise, or message before creating a commitment.",
        "error"
      );
      return;
    }

    if (cleanText.length < 8) {
      showToast(
        "Too short",
        "The source text is too short to become a useful commitment.",
        "error"
      );
      return;
    }

    setSaving(true);

    localStorage.setItem("draftSourceText", cleanText);

    showToast(
      "Source saved",
      "Opening New Commitment with your pasted text.",
      "success"
    );

    setTimeout(() => {
      router.push("/commitments/new");
    }, 650);
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

  const characterCount = sourceText.length;
  const wordCount = sourceText.trim()
    ? sourceText.trim().split(/\s+/).filter(Boolean).length
    : 0;

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#07070a] px-4 text-white">
        <div className="relative rounded-[30px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
              <MessageSquareText size={18} />
            </div>

            <div>
              <p className="text-sm font-black">Loading chat import</p>
              <p className="mt-1 text-xs text-white/45">
                Preparing the paste workspace...
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
            Please sign in with Google first to import a chat into a commitment.
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
                  Paste chat into commitment
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
                <MessageSquareText size={15} />
                Chat import
              </div>

              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                Turn a message into a visible promise.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/58 sm:text-base">
                Paste a chat, verbal promise, or loose message. Then send it to
                New Commitment and use Quick Fill to create a structured
                commitment.
              </p>

              <div className="mt-8">
                <label className="mb-3 flex items-center gap-2 text-sm font-black text-white/80">
                  <MessageSquareText size={17} />
                  Source chat / message
                </label>

                <textarea
                  value={sourceText}
                  onChange={(event) => setSourceText(event.target.value)}
                  placeholder="Paste the original message here..."
                  className="min-h-[320px] w-full resize-none rounded-[30px] border border-white/10 bg-black/25 px-5 py-5 text-sm leading-7 text-white shadow-xl outline-none ring-1 ring-white/5 transition placeholder:text-white/30 focus:border-indigo-300/50 focus:bg-black/35 focus:ring-2 focus:ring-indigo-400/30"
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-white/45">
                  <span>{wordCount} words</span>
                  <span>{characterCount} characters</span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <button
                  onClick={handleSendToNewCommitment}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-black shadow-xl shadow-white/10 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
                >
                  {saving ? "Opening..." : "Send to New Commitment"}
                  {!saving && <ArrowRight size={18} />}
                </button>

                <button
                  onClick={handleClear}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300/30 bg-rose-400/10 px-5 py-4 text-sm font-black text-rose-100 shadow-xl transition hover:bg-rose-400/15"
                >
                  <Trash2 size={17} />
                  Clear
                </button>
              </div>
            </motion.section>

            <motion.aside
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.35 }}
              className="space-y-5"
            >
              <div className="rounded-[38px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">
                      <CheckCircle2 size={15} />
                      Flow
                    </div>

                    <h2 className="mt-5 text-3xl font-black tracking-tight text-white">
                      How this works
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-white/55">
                      This page does not directly create the commitment. It
                      passes the original message to the creation form.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    {
                      title: "1. Paste the message",
                      text: "Add the original chat or promise here.",
                    },
                    {
                      title: "2. Send to New Commitment",
                      text: "The message moves into the commitment form.",
                    },
                    {
                      title: "3. Use Quick Fill",
                      text: "Quick Fill creates title, description, and category.",
                    },
                    {
                      title: "4. Save clearly",
                      text: "Choose solo or mutual, add deadline, then save.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[24px] border border-white/10 bg-black/20 p-4"
                    >
                      <p className="text-sm font-black text-white">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-white/50">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[38px] border border-amber-300/70 bg-[#352407] p-5 shadow-2xl sm:p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-black">
                  <Info size={20} />
                </div>

                <h2 className="mt-5 text-3xl font-black tracking-tight text-white">
                  Better source = better commitment.
                </h2>

                <p className="mt-3 text-sm leading-7 text-white/65">
                  The pasted message should include what needs to be done, who
                  should do it, and when it should be completed. Otherwise Quick
                  Fill will be weak.
                </p>

                <button
                  onClick={handleUseExample}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-black shadow-xl shadow-white/10 transition hover:scale-[1.02]"
                >
                  <Sparkles size={17} />
                  Use example message
                </button>
              </div>

              <div className="rounded-[38px] border border-sky-300/70 bg-[#06283f] p-5 shadow-2xl sm:p-7">
                <h2 className="text-2xl font-black tracking-tight text-white">
                  Current account
                </h2>

                <p className="mt-3 break-all rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white/70">
                  {userEmail}
                </p>

                <div className="mt-4 grid gap-3">
                  <Link
                    href="/commitments/new"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-4 text-sm font-black text-white/85 transition hover:bg-white/12"
                  >
                    <Plus size={17} />
                    Open New Commitment
                  </Link>

                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-4 text-sm font-black text-white/85 transition hover:bg-white/12"
                  >
                    <CalendarDays size={17} />
                    Dashboard
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
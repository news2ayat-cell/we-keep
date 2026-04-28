"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquareText, Sparkles } from "lucide-react";

export default function ChatImportPage() {
  const router = useRouter();
  const [chatText, setChatText] = useState("");

  const handleContinue = () => {
    if (!chatText.trim()) {
      alert("Please paste a chat or message first.");
      return;
    }

    localStorage.setItem("draftSourceText", chatText);
    router.push("/commitments/new");
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-6 py-8"
    >
      <div className="mx-auto max-w-4xl">
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
              Smart Capture
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-black/5">
              Paste chat → create commitment
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">
            Paste Chat
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Drop in the original message, conversation, or promise. Then move
            into a cleaner commitment flow with quick fill and tracking.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <MessageSquareText size={16} />
                Original Chat / Message
              </label>

              <textarea
                placeholder="Example: Bro, please send me the notes before tonight..."
                className="min-h-72 w-full resize-none rounded-[28px] border border-white/60 bg-white/85 p-5 text-sm leading-7 text-slate-800 shadow-lg outline-none ring-1 ring-black/5 transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
              />

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={handleContinue}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 text-sm font-semibold text-white shadow-xl shadow-black/10 transition"
              >
                Continue to Create Commitment
                <ArrowRight size={18} />
              </motion.button>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-5 text-white shadow-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                  <Sparkles size={20} />
                </div>

                <h2 className="mt-4 text-xl font-black tracking-tight">
                  Why use this?
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/80">
                  Capture commitments directly from real conversations instead of
                  rewriting everything from scratch.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/60 bg-slate-50/90 p-5 shadow-lg">
                <p className="text-sm font-semibold text-slate-900">
                  Best for:
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  <li>• promises from chats</li>
                  <li>• reminders from friends</li>
                  <li>• repayment messages</li>
                  <li>• return-item requests</li>
                  <li>• meeting follow-ups</li>
                </ul>
              </div>

              <div className="rounded-[24px] border border-indigo-100 bg-indigo-50/80 p-5 shadow-lg">
                <p className="text-sm font-semibold text-indigo-800">
                  What happens next?
                </p>
                <p className="mt-2 text-sm leading-6 text-indigo-700">
                  The message will be carried into the Create Commitment page,
                  where Quick Fill can turn it into a cleaner tracked promise.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.main>
  );
}
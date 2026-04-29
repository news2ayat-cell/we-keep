"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const Icon = danger ? AlertTriangle : CheckCircle2;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 22, scale: 0.94 }}
            transition={{ duration: 0.22 }}
            className={`w-full max-w-lg overflow-hidden rounded-[34px] border p-5 shadow-2xl sm:p-6 ${
              danger
                ? "border-rose-300/35 bg-[#3a0712]/95"
                : "border-emerald-300/35 bg-[#042a22]/95"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                  danger ? "bg-rose-400 text-white" : "bg-emerald-300 text-black"
                }`}
              >
                <Icon size={24} />
              </div>

              <button
                onClick={onCancel}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close modal"
              >
                <X size={17} />
              </button>
            </div>

            <h2 className="mt-6 break-words text-3xl font-black leading-tight tracking-[-0.04em] text-white">
              {title}
            </h2>

            <p className="mt-3 break-words text-sm leading-7 text-white/65">
              {message}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                onClick={onCancel}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm font-black text-white/80 transition hover:bg-white/10"
              >
                {cancelText}
              </button>

              <button
                onClick={onConfirm}
                className={`inline-flex items-center justify-center rounded-2xl px-5 py-4 text-sm font-black shadow-xl transition hover:scale-[1.02] ${
                  danger
                    ? "bg-rose-400 text-white shadow-rose-950/20"
                    : "bg-emerald-300 text-black shadow-emerald-950/20"
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
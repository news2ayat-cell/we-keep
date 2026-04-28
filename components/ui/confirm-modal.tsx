"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

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
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-900/35 backdrop-blur-[2px]"
            onClick={onCancel}
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[120] flex items-center justify-center px-4"
          >
            <div className="w-full max-w-md rounded-[28px] border border-white/60 bg-white/95 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    danger
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <AlertTriangle size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold tracking-tight text-slate-900">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {message}
                      </p>
                    </div>

                    <button
                      onClick={onCancel}
                      className="rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                      onClick={onCancel}
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:scale-[1.02]"
                    >
                      {cancelText}
                    </button>

                    <button
                      onClick={onConfirm}
                      className={`rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:scale-[1.02] ${
                        danger
                          ? "bg-rose-600 shadow-rose-200"
                          : "bg-black shadow-black/10"
                      }`}
                    >
                      {confirmText}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
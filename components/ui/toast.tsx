"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, OctagonAlert, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

type ToastProps = {
  show: boolean;
  title: string;
  message?: string;
  variant?: ToastVariant;
  onClose: () => void;
};

export default function Toast({
  show,
  title,
  message,
  variant = "info",
  onClose,
}: ToastProps) {
  const styles = {
    success: {
      icon: CheckCircle2,
      iconWrap: "bg-emerald-100 text-emerald-700",
      card: "border-emerald-100",
    },
    error: {
      icon: OctagonAlert,
      iconWrap: "bg-rose-100 text-rose-700",
      card: "border-rose-100",
    },
    info: {
      icon: Info,
      iconWrap: "bg-indigo-100 text-indigo-700",
      card: "border-indigo-100",
    },
  };

  const Icon = styles[variant].icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          transition={{ duration: 0.22 }}
          className="fixed right-5 top-5 z-[100] w-[92vw] max-w-sm"
        >
          <div
            className={`rounded-[24px] border bg-white/95 p-4 shadow-2xl backdrop-blur-xl ${styles[variant].card}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${styles[variant].iconWrap}`}
              >
                <Icon size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                {message && (
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {message}
                  </p>
                )}
              </div>

              <button
                onClick={onClose}
                className="rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
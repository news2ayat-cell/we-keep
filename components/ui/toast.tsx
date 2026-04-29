"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

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
  message = "",
  variant = "info",
  onClose,
}: ToastProps) {
  const Icon =
    variant === "success"
      ? CheckCircle2
      : variant === "error"
      ? AlertTriangle
      : Info;

  const theme =
    variant === "success"
      ? {
          border: "border-emerald-300/40",
          bg: "bg-[#042a22]/95",
          icon: "bg-emerald-300 text-black",
          title: "text-emerald-50",
          message: "text-emerald-100/70",
        }
      : variant === "error"
      ? {
          border: "border-rose-300/45",
          bg: "bg-[#3a0712]/95",
          icon: "bg-rose-400 text-white",
          title: "text-rose-50",
          message: "text-rose-100/75",
        }
      : {
          border: "border-sky-300/40",
          bg: "bg-[#06283f]/95",
          icon: "bg-sky-300 text-black",
          title: "text-sky-50",
          message: "text-sky-100/70",
        };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="fixed right-4 top-4 z-[9999] w-[calc(100%-2rem)] max-w-md sm:right-6 sm:top-6"
        >
          <div
            className={`overflow-hidden rounded-[28px] border ${theme.border} ${theme.bg} p-4 shadow-2xl backdrop-blur-2xl`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${theme.icon}`}
              >
                <Icon size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <p className={`break-words text-sm font-black ${theme.title}`}>
                  {title}
                </p>

                {message && (
                  <p className={`mt-1 break-words text-sm leading-6 ${theme.message}`}>
                    {message}
                  </p>
                )}
              </div>

              <button
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close toast"
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
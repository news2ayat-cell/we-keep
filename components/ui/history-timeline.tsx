"use client";

import { motion } from "framer-motion";
import {
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  PencilLine,
  Users,
  XCircle,
} from "lucide-react";

type CommitmentEvent = {
  id: number;
  actorEmail: string;
  eventType: string;
  eventLabel: string;
  details: string;
  createdAt: string;
};

type Props = {
  events: CommitmentEvent[];
};

export default function HistoryTimeline({ events }: Props) {
  const getStyle = (eventType: string) => {
    switch (eventType) {
      case "created":
        return {
          icon: ClipboardList,
          wrap: "bg-indigo-100 text-indigo-700",
        };
      case "accepted":
        return {
          icon: Users,
          wrap: "bg-sky-100 text-sky-700",
        };
      case "rejected":
        return {
          icon: XCircle,
          wrap: "bg-rose-100 text-rose-700",
        };
      case "solo_done":
      case "creator_side_done":
      case "partner_side_done":
      case "completed":
        return {
          icon: CheckCheck,
          wrap: "bg-emerald-100 text-emerald-700",
        };
      case "edited":
        return {
          icon: PencilLine,
          wrap: "bg-amber-100 text-amber-700",
        };
      default:
        return {
          icon: CheckCircle2,
          wrap: "bg-slate-100 text-slate-700",
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return dateString;

    return date.toLocaleString();
  };

  return (
    <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50/90 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <CalendarClock size={16} className="text-slate-700" />
        <p className="text-sm font-semibold text-slate-900">Activity</p>
      </div>

      {events.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No history yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {events.map((event, index) => {
            const style = getStyle(event.eventType);
            const Icon = style.icon;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-100"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${style.wrap}`}
                >
                  <Icon size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {event.eventLabel}
                    </p>
                    <span className="text-xs text-slate-400">•</span>
                    <p className="text-xs text-slate-500">
                      {formatDate(event.createdAt)}
                    </p>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    by {event.actorEmail || "Unknown"}
                  </p>

                  {event.details && (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {event.details}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
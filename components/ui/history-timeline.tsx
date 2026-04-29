"use client";

import { motion } from "framer-motion";
import {
  CheckCheck,
  Clock3,
  History,
  Pencil,
  Plus,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type CommitmentEvent = {
  id: number;
  commitmentId: number;
  actorEmail: string;
  eventType: string;
  eventLabel: string;
  details: string;
  createdAt: string;
};

type HistoryTimelineProps = {
  events: CommitmentEvent[];
};

export default function HistoryTimeline({ events }: HistoryTimelineProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString || "Unknown date";
    }

    return date.toLocaleString();
  };

  const getEventIcon = (eventType: string) => {
    const type = eventType.toLowerCase();

    if (type.includes("created")) return Plus;
    if (type.includes("edited")) return Pencil;
    if (type.includes("rejected")) return XCircle;
    if (type.includes("accepted")) return ShieldCheck;
    if (type.includes("done") || type.includes("completed")) return CheckCheck;

    return Clock3;
  };

  const getEventTheme = (eventType: string) => {
    const type = eventType.toLowerCase();

    if (type.includes("rejected")) {
      return {
        icon: "bg-rose-400 text-white",
        border: "border-rose-300/25",
        bg: "bg-rose-400/10",
      };
    }

    if (type.includes("done") || type.includes("completed")) {
      return {
        icon: "bg-emerald-300 text-black",
        border: "border-emerald-300/25",
        bg: "bg-emerald-400/10",
      };
    }

    if (type.includes("accepted")) {
      return {
        icon: "bg-sky-300 text-black",
        border: "border-sky-300/25",
        bg: "bg-sky-400/10",
      };
    }

    if (type.includes("edited")) {
      return {
        icon: "bg-amber-300 text-black",
        border: "border-amber-300/25",
        bg: "bg-amber-400/10",
      };
    }

    return {
      icon: "bg-white text-black",
      border: "border-white/10",
      bg: "bg-white/[0.06]",
    };
  };

  if (events.length === 0) {
    return (
      <div className="mt-5 rounded-[24px] border border-dashed border-white/15 bg-black/20 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-black">
            <History size={17} />
          </div>

          <div>
            <p className="text-sm font-black text-white">No history yet</p>
            <p className="mt-1 text-sm leading-6 text-white/45">
              Activity events will appear here after this commitment changes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-[28px] border border-white/10 bg-black/20 p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-white">Activity timeline</p>
          <p className="mt-1 text-xs text-white/45">
            {events.length} event{events.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
          <History size={17} />
        </div>
      </div>

      <div className="space-y-4">
        {events.map((event, index) => {
          const EventIcon = getEventIcon(event.eventType);
          const theme = getEventTheme(event.eventType);

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
              className={`rounded-[24px] border ${theme.border} ${theme.bg} p-4`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${theme.icon}`}
                >
                  <EventIcon size={17} />
                </div>

                <div className="min-w-0">
                  <p className="break-words text-sm font-black text-white">
                    {event.eventLabel || "Activity event"}
                  </p>

                  {event.details && (
                    <p className="mt-1 break-words text-sm leading-6 text-white/58">
                      {event.details}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/50">
                      {formatDate(event.createdAt)}
                    </span>

                    {event.actorEmail && (
                      <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/50">
                        {event.actorEmail}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
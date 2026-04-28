"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-2xl flex-col items-center rounded-[32px] border border-white/60 bg-white/80 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="rounded-full bg-rose-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-rose-700 ring-1 ring-rose-200">
          Something went wrong
        </div>

        <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Unexpected app error
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
          An unexpected problem happened while loading this page. You can try
          again or return to the dashboard.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white shadow-lg"
          >
            Try again
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-slate-800 shadow-sm"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
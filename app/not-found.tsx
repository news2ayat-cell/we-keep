import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-2xl flex-col items-center rounded-[32px] border border-white/60 bg-white/80 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
          404
        </div>

        <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Page not found
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
          The page you tried to open does not exist, was moved, or the link was
          typed incorrectly.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white shadow-lg"
          >
            Go to Dashboard
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-slate-800 shadow-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
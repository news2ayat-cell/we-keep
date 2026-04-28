export default function Loading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Loading
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Please wait while the app prepares your page.
          </p>
        </div>
      </div>
    </main>
  );
}
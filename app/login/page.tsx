"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/dashboard");
        return;
      }

      setCheckingUser(false);
    };

    checkUser();
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      console.error(error);
      alert("Google login failed.");
      setLoading(false);
    }
  };

  if (checkingUser) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <p className="text-sm text-slate-600">Checking login status...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_35%,_#f8fafc_70%)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-[30px] border border-white/60 bg-white/80 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
          <Link href="/" className="text-sm text-slate-600 hover:underline">
            ← Back to Home
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_1.2fr]">
          <section className="rounded-[32px] border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
            <div className="inline-flex rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700 ring-1 ring-indigo-100">
              Secure access
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Login to
              <span className="block text-indigo-600">We Keep</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">
              Sign in with Google to manage solo commitments, mutual promises,
              request approvals, and completion history.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-4 text-sm font-medium text-white shadow-xl shadow-black/10 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Redirecting to Google..." : "Continue with Google"}
              </button>

              <p className="text-sm text-slate-500">
                After login, you will be taken directly to your dashboard.
              </p>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
            <div className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 text-white shadow-xl">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-300">
                What you get
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Accountability that feels structured
              </h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-300">
                    Step 1
                  </p>
                  <p className="mt-2 text-lg font-bold">
                    Create personal commitments
                  </p>
                </div>

                <div className="rounded-[24px] bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-300">
                    Step 2
                  </p>
                  <p className="mt-2 text-lg font-bold">
                    Send mutual requests
                  </p>
                </div>

                <div className="rounded-[24px] bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-300">
                    Step 3
                  </p>
                  <p className="mt-2 text-lg font-bold">
                    Accept and track progress
                  </p>
                </div>

                <div className="rounded-[24px] bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-300">
                    Step 4
                  </p>
                  <p className="mt-2 text-lg font-bold">
                    Confirm full completion
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-xl font-black tracking-tight text-slate-900">
                  Personal commitments
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Keep your own promises visible with reminders, due dates, and
                  status tracking.
                </p>
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-xl font-black tracking-tight text-slate-900">
                  Mutual accountability
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Build shared commitments where both sides can accept, track,
                  and confirm completion.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic import — Three.js can't render server-side
const MiloModel = dynamic(() => import("@/components/MiloModel"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-stone-300 border-t-amber-500 rounded-full animate-spin" />
    </div>
  ),
});

const STEPS = [
  {
    num: "01",
    title: "Choose Your Language",
    desc: "Pick from French, Spanish, or Arabic and jump into a real scenario.",
  },
  {
    num: "02",
    title: "Talk to Milo",
    desc: "Have a real voice conversation. Milo listens, responds, and speaks back.",
  },
  {
    num: "03",
    title: "Get Better Every Day",
    desc: "Milo corrects mistakes, suggests phrases, and tracks your growth.",
  },
];

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
    title: "Voice Conversations",
    desc: "Speak naturally. Milo understands you in real time and talks back through ElevenLabs AI voice.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    title: "Live Captions",
    desc: "Everything said is transcribed in real time so you can read along as you speak and listen.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
    title: "Smart Corrections",
    desc: "Milo gently corrects grammar, suggests better phrasing, and helps you sound more natural.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Track Progress",
    desc: "Monitor hours practiced, session streaks, and watch your confidence grow over time.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-[#e8e0d6] text-stone-900 min-h-screen overflow-x-hidden">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-stone-900 flex items-center justify-center">
            <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span className="font-bold text-stone-900 text-base tracking-tight">
            Milo
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-stone-600 hover:text-stone-900 transition-colors px-3 py-2"
          >
            Log In
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-colors px-5 py-2.5 rounded-full"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-8 pb-4">
        {/* Top decorative lines */}
        <div className="flex justify-center gap-2 mb-10">
          <div className="w-12 h-1 rounded-full bg-stone-400/50" />
          <div className="w-8 h-1 rounded-full bg-stone-400/30" />
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-center leading-[1.05] tracking-tight text-stone-900 mb-6">
          Speak the
          <br />
          World&apos;s
          <br />
          Language!
        </h1>

        <p className="text-center text-stone-500 text-base sm:text-lg max-w-md mx-auto mb-8 leading-relaxed">
          Practice real conversations with Milo, your AI language companion.
          He listens, speaks back, and helps you get better every day.
        </p>

        {/* 3D Milo — tall viewport so the full figure fits; shadow anchored to visual “feet” */}
        <div className="relative mx-auto w-full max-w-lg min-h-[min(52vh,520px)] h-[min(52vh,520px)] sm:min-h-[560px] sm:h-[560px]">
          <div className="absolute bottom-[18%] left-1/2 z-0 w-[70%] max-w-sm -translate-x-1/2 h-10 bg-stone-500/15 rounded-[100%] blur-2xl" />
          <div className="relative z-[1] h-full w-full">
            <MiloModel />
          </div>
        </div>

        {/* CTA Button — positive margin so it doesn’t cover the model */}
        <div className="flex justify-center mt-8 mb-16">
          <Link
            href="/signup"
            className="px-10 py-4 bg-stone-900 hover:bg-stone-800 text-white text-base font-semibold rounded-full transition-all shadow-lg shadow-stone-900/20 active:scale-95"
          >
            Get started
          </Link>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section className="bg-[#f5f0eb] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-stone-900">
            How It Works
          </h2>
          <p className="text-center text-stone-400 text-sm mb-14 max-w-md mx-auto">
            Three simple steps to start speaking a new language today.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow border border-stone-100"
              >
                <span className="text-3xl font-black text-stone-200 mb-3 block">
                  {step.num}
                </span>
                <h3 className="font-bold text-stone-900 mb-2 text-base">
                  {step.title}
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-stone-900">
            Why Milo?
          </h2>
          <p className="text-center text-stone-400 text-sm mb-14 max-w-md mx-auto">
            More than a chatbot. A real conversation partner powered by AI.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white/60 backdrop-blur-sm border border-stone-200/80 rounded-2xl p-6 hover:bg-white transition-colors group"
              >
                <div className="w-11 h-11 rounded-xl bg-stone-900 text-white flex items-center justify-center mb-4 group-hover:bg-amber-500 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-bold text-stone-900 mb-2">{f.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-stone-900 rounded-3xl px-8 sm:px-14 py-16 text-center relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl" />

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 relative z-10">
              Ready to Start Speaking?
            </h2>
            <p className="text-stone-400 text-sm mb-8 max-w-md mx-auto relative z-10">
              Join Milo and build real confidence in a new language through
              natural conversation.
            </p>
            <Link
              href="/login"
              className="relative z-10 inline-block px-10 py-3.5 rounded-full bg-white text-stone-900 font-semibold text-sm hover:bg-stone-100 transition-all active:scale-95"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-stone-300/50 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xs text-stone-400">
            &copy; 2026 Milo. All rights reserved.
          </span>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-stone-900 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-xs font-semibold text-stone-500">Milo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

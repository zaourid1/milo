"use client";

import Link from "next/link";

const NAV_LOGO = (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
          clipRule="evenodd"
        />
      </svg>
    </div>
    <span className="font-semibold text-gray-900 text-sm">Immersion AI</span>
  </div>
);

const HOW_IT_WORKS = [
  {
    icon: (
      <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
      </svg>
    ),
    step: "1. Choose Your Language",
    desc: "Select from French, Spanish, Arabic, English, and more.",
  },
  {
    icon: (
      <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    step: "2. Start Speaking",
    desc: "Talk naturally with Milo. No scripts, just real conversation.",
  },
  {
    icon: (
      <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    step: "3. Track Progress",
    desc: "Watch your hours, streaks, and confidence grow over time.",
  },
];

const FEATURES = [
  {
    title: "Real-Time Voice Responses",
    desc: "Milo responds instantly with natural speech powered by advanced AI voice technology.",
  },
  {
    title: "Live Captions",
    desc: "See exactly what's being said with accessible, real-time captions during every session.",
  },
  {
    title: "Natural Conversation Practice",
    desc: "Skip the boring drills. Learn by having real conversations about topics you care about.",
  },
  {
    title: "Progress Tracking",
    desc: "Monitor your speaking hours, session streaks, and improvement over time.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-900 min-h-screen">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        {NAV_LOGO}
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5">
            Log In
          </Link>
          <Link href="/login" className="text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors px-4 py-2 rounded-lg">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-14 pb-16 max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-5 bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">
          Practice Real Conversations,<br />Not Boring Drills
        </h1>
        <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
          Learn by speaking with Milo, your AI language companion. Get real-time
          responses, live captions, and track your progress over time.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/login" className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-md shadow-violet-200 active:scale-95">
            Start Learning Now
          </Link>
          <Link href="/login" className="px-6 py-3 rounded-xl border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold text-sm transition-all active:scale-95">
            Log In
          </Link>
        </div>

        {/* Demo Card */}
        <div className="mt-12 rounded-2xl shadow-xl shadow-violet-100 overflow-hidden border border-violet-100">
          <div className="bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-100 px-8 py-16 flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-300">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-gray-700 text-base italic font-medium">
              &quot;Bonjour! How can I help you practice today?&quot;
            </p>
            <span className="bg-gray-900 text-white text-xs font-medium px-4 py-1.5 rounded-full">
              Live captions powered by AI
            </span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center">
                {item.icon}
              </div>
              <h3 className="font-semibold text-sm text-gray-900">{item.step}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Immersion AI */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">Why Immersion AI?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">{f.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-4 sm:mx-auto max-w-4xl mb-16 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-blue-500 px-8 py-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to Start Speaking?</h2>
          <p className="text-violet-100 text-sm mb-8">Join thousands of learners building confidence through conversation.</p>
          <Link href="/login" className="inline-block px-8 py-3 rounded-xl border-2 border-white text-white font-semibold text-sm hover:bg-white hover:text-violet-600 transition-all active:scale-95">
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
}

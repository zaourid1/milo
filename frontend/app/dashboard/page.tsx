"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const LANGUAGES = [
  { id: "french", name: "French", flag: "\u{1F1EB}\u{1F1F7}" },
  { id: "spanish", name: "Spanish", flag: "\u{1F1EA}\u{1F1F8}" },
  { id: "arabic", name: "Arabic", flag: "\u{1F1F8}\u{1F1E6}" },
];

const SCENARIOS = [
  { id: "coffee_shop", name: "Coffee Shop", icon: "\u2615", description: "Order drinks, chat with a barista" },
  { id: "airport", name: "Airport", icon: "\u2708\uFE0F", description: "Check in, navigate the terminal" },
  { id: "job_interview", name: "Job Interview", icon: "\u{1F4BC}", description: "Answer questions, impress the interviewer" },
];

const STATS = [
  { value: "24.5", label: "Hours Learned", color: "text-violet-400" },
  { value: "32", label: "Sessions", color: "text-green-400" },
  { value: "7", label: "Day Streak", color: "text-orange-400" },
  { value: "156", label: "Words Learned", color: "text-blue-400" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState("spanish");
  const [selectedScenario, setSelectedScenario] = useState("coffee_shop");
  const [showStats, setShowStats] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const user = localStorage.getItem("user");
    if (user) {
      try {
        setUserName(JSON.parse(user).name || "");
      } catch {}
    }
  }, [router]);

  const handleStart = () => {
    router.push(`/chat?language=${selectedLang}&scenario=${selectedScenario}`);
  };

  return (
    <div className="bg-gray-950 min-h-screen text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-semibold text-sm">ImmersionAI</span>
          </Link>
          <Link href="/profile" className="text-sm text-gray-400 hover:text-white transition-colors">
            Profile
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Welcome + Check Stats */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">
            {userName ? `Hey ${userName}, what would you like to practice?` : "What would you like to practice?"}
          </h1>
            <p className="text-gray-400 text-sm mt-2">Pick a language and scenario — guided voice + text with live translations and hints.</p>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className="shrink-0 ml-4 px-4 py-2 rounded-xl border border-gray-700 bg-gray-900 hover:bg-gray-800 text-sm text-gray-300 hover:text-white transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            {showStats ? "Hide Stats" : "Check Stats"}
          </button>
        </div>

        {/* Stats panel (collapsible) */}
        {showStats && (
          <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border border-gray-800 bg-gray-900 px-4 py-5 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Language selection */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Language</h2>
          <div className="grid grid-cols-3 gap-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedLang(lang.id)}
                className={`px-4 py-5 rounded-2xl border-2 transition-all text-center ${
                  selectedLang === lang.id
                    ? "border-violet-500 bg-violet-600/10"
                    : "border-gray-800 bg-gray-900 hover:border-gray-700"
                }`}
              >
                <span className="text-3xl block mb-2">{lang.flag}</span>
                <div className="font-semibold text-sm">{lang.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Scenario selection */}
        <div className="mb-10">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Scenario</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc.id)}
                className={`text-left px-5 py-4 rounded-2xl border-2 transition-all ${
                  selectedScenario === sc.id
                    ? "border-violet-500 bg-violet-600/10"
                    : "border-gray-800 bg-gray-900 hover:border-gray-700"
                }`}
              >
                <span className="text-2xl block mb-2">{sc.icon}</span>
                <div className="font-semibold text-sm">{sc.name}</div>
                <div className="text-xs text-gray-500 mt-1">{sc.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-base transition-all shadow-lg shadow-violet-900/30 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          Start Session
        </button>
      </div>
    </div>
  );
}

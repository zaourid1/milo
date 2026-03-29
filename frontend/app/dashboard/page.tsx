"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "../config";

type StatsSummary = {
  hours_learned: number;
  session_count: number;
  day_streak: number;
  words_learned: number;
};

function formatHours(h: number): string {
  if (h <= 0) return "0";
  return Number.isInteger(h) ? String(h) : h.toFixed(1);
}

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

export default function DashboardPage() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState("spanish");
  const [selectedScenario, setSelectedScenario] = useState("coffee_shop");
  const [showStats, setShowStats] = useState(false);
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [statsError, setStatsError] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setStatsLoading(true);
    setStatsError(false);
    fetch(`${API_BASE}/stats/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("stats failed");
        return r.json() as Promise<StatsSummary>;
      })
      .then((data) => {
        setStats({
          hours_learned: Number(data.hours_learned) || 0,
          session_count: Number(data.session_count) || 0,
          day_streak: Number(data.day_streak) || 0,
          words_learned: Number(data.words_learned) || 0,
        });
      })
      .catch(() => {
        setStatsError(true);
        setStats(null);
      })
      .finally(() => setStatsLoading(false));
  }, []);

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

    loadStats();
  }, [router, loadStats]);

  useEffect(() => {
    if (showStats) loadStats();
  }, [showStats, loadStats]);

  const handleStart = () => {
    router.push(`/chat?language=${selectedLang}&scenario=${selectedScenario}`);
  };

  return (
    <div className="bg-[#e8e0d6] min-h-screen text-stone-900">
      {/* Navbar */}
      <nav className="border-b border-stone-300/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-bold text-sm">Milo</span>
          </Link>
          <Link href="/profile" className="text-sm text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Profile
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Welcome + Check Stats */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">
              {userName ? `Hey ${userName}, what would you like to practice?` : "What would you like to practice?"}
            </h1>
            <p className="text-stone-500 text-sm mt-2">
              Pick a language and scenario to start a conversation with Milo.
            </p>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className="shrink-0 ml-4 px-4 py-2.5 rounded-full border border-stone-300 bg-white hover:bg-stone-50 text-sm text-stone-600 hover:text-stone-900 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            {showStats ? "Hide Stats" : "Check Stats"}
          </button>
        </div>

        {/* Stats panel (collapsible) — synced from /stats/summary after logged-in practice */}
        {showStats && (
          <div className="mb-8">
            {statsError && (
              <p className="mb-3 text-center text-sm text-rose-600">
                Couldn&apos;t load stats. Is the API running?
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  {
                    label: "Hours Learned",
                    color: "text-amber-600",
                    value: statsLoading && !stats ? "…" : formatHours(stats?.hours_learned ?? 0),
                  },
                  {
                    label: "Sessions",
                    color: "text-stone-900",
                    value: statsLoading && !stats ? "…" : String(stats?.session_count ?? 0),
                  },
                  {
                    label: "Day Streak",
                    color: "text-orange-600",
                    value: statsLoading && !stats ? "…" : String(stats?.day_streak ?? 0),
                  },
                  {
                    label: "Words Practiced",
                    color: "text-stone-700",
                    value: statsLoading && !stats ? "…" : String(stats?.words_learned ?? 0),
                  },
                ] as const
              ).map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl bg-white border border-stone-200/60 px-4 py-5 text-center"
                >
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-stone-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-stone-400">
              Tap End in chat while logged in to save a session. Streak counts consecutive days
              with practice (from today or yesterday).
            </p>
          </div>
        )}

        {/* Language selection */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Language</h2>
          <div className="grid grid-cols-3 gap-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedLang(lang.id)}
                className={`px-4 py-5 rounded-2xl border-2 transition-all text-center ${
                  selectedLang === lang.id
                    ? "border-stone-900 bg-white shadow-sm"
                    : "border-stone-200/60 bg-white/50 hover:bg-white hover:border-stone-300"
                }`}
              >
                <span className="text-3xl block mb-2">{lang.flag}</span>
                <div className="font-semibold text-sm text-stone-900">{lang.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Scenario selection */}
        <div className="mb-10">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Scenario</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc.id)}
                className={`text-left px-5 py-4 rounded-2xl border-2 transition-all ${
                  selectedScenario === sc.id
                    ? "border-stone-900 bg-white shadow-sm"
                    : "border-stone-200/60 bg-white/50 hover:bg-white hover:border-stone-300"
                }`}
              >
                <span className="text-2xl block mb-2">{sc.icon}</span>
                <div className="font-semibold text-sm text-stone-900">{sc.name}</div>
                <div className="text-xs text-stone-400 mt-1">{sc.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold text-base transition-all shadow-lg shadow-stone-900/15 active:scale-[0.98] flex items-center justify-center gap-2"
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

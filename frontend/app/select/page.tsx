"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const LANGUAGES = [
  { value: "french", label: "\u{1F1EB}\u{1F1F7} French" },
  { value: "spanish", label: "\u{1F1EA}\u{1F1F8} Spanish" },
  { value: "arabic", label: "\u{1F1F8}\u{1F1E6} Arabic" },
];

const SCENARIOS = [
  { value: "coffee_shop", label: "\u2615 Coffee Shop", description: "Order drinks, chat with a barista" },
  { value: "airport", label: "\u2708\uFE0F Airport", description: "Check in, ask for directions" },
  { value: "job_interview", label: "\u{1F4BC} Job Interview", description: "Answer questions, impress the interviewer" },
];

function SelectContent() {
  const router = useRouter();
  const params = useSearchParams();
  const initialLang = params.get("language") || "french";
  const validLang = LANGUAGES.some((l) => l.value === initialLang) ? initialLang : "french";

  const [language, setLanguage] = useState(validLang);
  const [scenario, setScenario] = useState("coffee_shop");

  const handleStart = () => {
    router.push(`/chat?language=${language}&scenario=${scenario}`);
  };

  return (
    <div className="bg-[#e8e0d6] text-stone-900 min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/dashboard" className="inline-flex items-center gap-1 mb-6 text-stone-500 hover:text-stone-900 transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2 text-stone-900">Choose Your Setup</h1>
          <p className="text-stone-400 text-sm">Pick a language and scenario to begin.</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-stone-200/60">
          <div className="mb-6">
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Language</label>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLanguage(lang.value)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                    language === lang.value
                      ? "bg-stone-900 text-white shadow-sm"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Scenario</label>
            <div className="flex flex-col gap-2">
              {SCENARIOS.map((sc) => (
                <button
                  key={sc.value}
                  onClick={() => setScenario(sc.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all border-2 ${
                    scenario === sc.value
                      ? "border-stone-900 bg-stone-50"
                      : "border-stone-100 bg-stone-50/50 hover:border-stone-300"
                  }`}
                >
                  <div className="font-medium text-stone-900 text-sm">{sc.label}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{sc.description}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition-all active:scale-95"
          >
            Start Conversation
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SelectPage() {
  return (
    <Suspense>
      <SelectContent />
    </Suspense>
  );
}

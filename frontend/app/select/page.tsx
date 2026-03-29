"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const LANGUAGES = [
  { value: "french", label: "🇫🇷 French" },
  { value: "spanish", label: "🇪🇸 Spanish" },
  { value: "arabic", label: "🇸🇦 Arabic" },
];

const SCENARIOS = [
  { value: "coffee_shop", label: "☕ Coffee Shop", description: "Order drinks, chat with a barista" },
  { value: "airport", label: "✈️ Airport", description: "Check in, ask for directions, navigate the terminal" },
  { value: "job_interview", label: "💼 Job Interview", description: "Answer questions, impress the interviewer" },
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
    <div className="bg-gray-950 text-white min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/dashboard" className="inline-flex items-center gap-2 mb-6 text-gray-400 hover:text-white transition-colors text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Immersion AI
          </h1>
          <p className="text-gray-400 text-lg">Choose your language and scenario.</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Language</label>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLanguage(lang.value)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                    language === lang.value
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-900"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Scenario</label>
            <div className="flex flex-col gap-2">
              {SCENARIOS.map((sc) => (
                <button
                  key={sc.value}
                  onClick={() => setScenario(sc.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${
                    scenario === sc.value
                      ? "bg-violet-600/20 border-violet-500 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <div className="font-medium">{sc.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{sc.description}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-base transition-all shadow-lg shadow-violet-900/40 active:scale-95"
          >
            Start Conversation →
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

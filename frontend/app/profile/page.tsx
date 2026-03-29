"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "../config";

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("english");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setName(data.name);
        setEmail(data.email);
        setNativeLanguage(data.native_language || "english");
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      });
  }, [router]);

  const handleSave = async () => {
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, native_language: nativeLanguage }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Failed to save");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Could not reach the server");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="bg-[#e8e0d6] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#e8e0d6] min-h-screen text-stone-900">
      {/* Navbar */}
      <nav className="border-b border-stone-300/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-bold text-sm">Milo</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-8 text-stone-900">Profile Settings</h1>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-20 h-20 rounded-full bg-stone-900 flex items-center justify-center text-3xl font-bold text-white shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-semibold text-stone-900">{name}</div>
            <div className="text-sm text-stone-400">{email}</div>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl border border-stone-200/60 p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-stone-600 mb-2">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-200 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-600 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-200 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-600 mb-2">Native Language</label>
            <select
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-200 transition-all appearance-none"
            >
              <option value="english">English</option>
              <option value="french">French</option>
              <option value="spanish">Spanish</option>
              <option value="arabic">Arabic</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition-all active:scale-[0.98]"
          >
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>

        {/* Account actions */}
        <div className="mt-10 pt-8 border-t border-stone-300/50 flex items-center justify-between">
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-full border border-stone-300 text-stone-600 hover:bg-white text-sm transition-colors"
          >
            Log Out
          </button>
          <button className="px-5 py-2.5 rounded-full border border-red-300 text-red-500 hover:bg-red-50 text-sm transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

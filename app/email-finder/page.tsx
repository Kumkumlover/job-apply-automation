"use client";

import React, { useState, useEffect, type FormEvent } from "react";
import {
  Settings,
  UserPlus,
  Trash2,
  Search,
  Mail,
  AlertCircle,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Key,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface PersonRow {
  id: number;
  name: string;
  company: string;
  domain: string;
}

interface EmailData {
  email: string;
  type: "verified" | "discovered" | "predicted";
  confidence: number;
  source: string;
}

interface PersonResult {
  name: string;
  company: string;
  domain: string;
  emails: EmailData[];
  recommended: string | null;
}

type Status = "idle" | "loading" | "success" | "error";

// ─── Component ──────────────────────────────────────────────────

export default function EmailFinderPage() {
  const [apiKeys, setApiKeys] = useState({ hunter: "", apollo: "" });
  const [showKeys, setShowKeys] = useState(false);

  // Load saved keys on mount
  useEffect(() => {
    const savedHunter = localStorage.getItem("hunterKey");
    const savedApollo = localStorage.getItem("apolloKey");
    if (savedHunter || savedApollo) {
      setApiKeys({ hunter: savedHunter || "", apollo: savedApollo || "" });
    }
  }, []);

  const handleKeyChange = (provider: "hunter" | "apollo", val: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: val }));
    localStorage.setItem(`${provider}Key`, val);
  };
  const [people, setPeople] = useState<PersonRow[]>([
    { id: Date.now(), name: "", company: "", domain: "" },
  ]);
  const [results, setResults] = useState<PersonResult[] | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [feedbackGiven, setFeedbackGiven] = useState<
    Record<string, "correct" | "incorrect">
  >({});

  // ── Handlers ──

  const handleAddRow = () => {
    setPeople([
      ...people,
      { id: Date.now(), name: "", company: "", domain: "" },
    ]);
  };

  const handleRemoveRow = (id: number) => {
    setPeople(people.filter((p) => p.id !== id));
  };

  const handleInputChange = (id: number, field: keyof PersonRow, value: string) => {
    setPeople(people.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleEnrich = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    setResults(null);

    const payload = people
      .filter((p) => p.name && p.company)
      .map((p) => ({ name: p.name, company: p.company, domain: p.domain }));

    if (payload.length === 0) {
      setError("Please fill in Name and Company for at least one person.");
      setStatus("error");
      return;
    }

    try {
      const res = await fetch("/api/enrich-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hunter-Key": apiKeys.hunter,
          "X-Apollo-Key": apiKeys.apollo,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? `Server error: ${res.status}`);
      }

      const data: PersonResult[] = await res.json();
      setResults(data);
      setStatus("success");
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  };

  const handleFeedback = async (
    email: string,
    feedbackStatus: "correct" | "incorrect"
  ) => {
    try {
      const res = await fetch("/api/submit-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, status: feedbackStatus }),
      });

      if (res.ok) {
        setFeedbackGiven((prev) => ({ ...prev, [email]: feedbackStatus }));
      }
    } catch (err) {
      console.error("Failed to submit feedback", err);
    }
  };

  // ── Render ──

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-slate-200 font-sans">
      {/* Gradient background effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-purple-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[98%] mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 border border-blue-500/20 rounded-xl">
              <Search className="w-7 h-7 text-blue-400" />
            </div>
            Email Intelligence Engine
          </h1>
          <p className="text-slate-400 text-lg">
            Discover, verify, and predict professional email addresses.
          </p>
        </header>

        {/* API Keys Panel */}
        <div className="bg-[#111113] rounded-xl border border-[#1e1e22] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowKeys(!showKeys)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#161619] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-500" />
              <span className="font-semibold text-slate-300">
                API Keys Configuration
              </span>
            </div>
            <span className="text-xs text-slate-500">
              {showKeys ? "Hide" : "Show"}
            </span>
          </button>

          {showKeys && (
            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-[#1e1e22] pt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-orange-400" /> Hunter.io API Key
                  </span>
                  {apiKeys.hunter.length > 5 && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Saved & Active
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  placeholder="Enter Hunter API key..."
                  value={apiKeys.hunter}
                  onChange={(e) => handleKeyChange("hunter", e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-[#2a2a30] rounded-lg text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-400" /> Apollo.io API Key
                  </span>
                  {apiKeys.apollo.length > 5 && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Saved & Active
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  placeholder="Enter Apollo API key..."
                  value={apiKeys.apollo}
                  onChange={(e) => handleKeyChange("apollo", e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-[#2a2a30] rounded-lg text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all"
                />
              </div>
              <p className="col-span-full text-xs text-slate-600">
                Keys are sent via headers and never stored. Without keys, only
                permutation-based prediction is used.
              </p>
            </div>
          )}
        </div>

        {/* Input Panel */}
        <form
          onSubmit={handleEnrich}
          className="bg-[#111113] rounded-xl border border-[#1e1e22] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-[#1e1e22]">
            <h2 className="font-semibold text-slate-300">Target Contacts</h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-slate-500 px-1">
              <div className="col-span-4">Full Name</div>
              <div className="col-span-3">Company Name</div>
              <div className="col-span-4">Domain</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {/* Dynamic Rows */}
            {people.map((person) => (
              <div
                key={person.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
              >
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="e.g. Jane Doe"
                    value={person.name}
                    onChange={(e) =>
                      handleInputChange(person.id, "name", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-[#2a2a30] rounded-lg text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/40 outline-none transition-all"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp"
                    value={person.company}
                    onChange={(e) =>
                      handleInputChange(person.id, "company", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-[#2a2a30] rounded-lg text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/40 outline-none transition-all"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="e.g. acme.com"
                    value={person.domain}
                    onChange={(e) =>
                      handleInputChange(person.id, "domain", e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-[#2a2a30] rounded-lg text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/40 outline-none transition-all"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(person.id)}
                    disabled={people.length === 1}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-4 flex justify-between items-center border-t border-[#1e1e22]">
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Add Person
              </button>

              <button
                type="submit"
                disabled={status === "loading"}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {status === "loading" ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {status === "loading" ? "Enriching..." : "Find Emails"}
              </button>
            </div>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-6 py-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Results Panel */}
        {results && results.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">
              Intelligence Results
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map((personResult, idx) => (
                <div
                  key={idx}
                  className="bg-[#111113] rounded-xl border border-[#1e1e22] overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-[#1e1e22]">
                    <h3 className="text-lg font-bold text-white">
                      {personResult.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {personResult.company} · {personResult.domain}
                    </p>
                    {personResult.recommended ? (
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-300 text-sm font-medium rounded-full border border-emerald-500/20">
                        <CheckCircle className="w-4 h-4" />
                        Best: {personResult.recommended}
                      </div>
                    ) : (
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-300 text-sm font-medium rounded-full border border-amber-500/20">
                        <AlertCircle className="w-4 h-4" />
                        No confident match
                      </div>
                    )}
                  </div>

                  {/* Emails List */}
                  <div className="p-5 space-y-3">
                    {personResult.emails.length === 0 ? (
                      <p className="text-slate-500 text-sm italic">
                        No emails discovered or predicted.
                      </p>
                    ) : (
                      personResult.emails.map((emailData, eIdx) => (
                        <div
                          key={eIdx}
                          className="group relative border border-[#1e1e22] rounded-lg p-3 hover:border-blue-500/30 hover:bg-[#0d0d0f] transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-500" />
                                <span className="font-medium text-white text-sm">
                                  {emailData.email}
                                </span>
                              </div>
                              <div className="flex gap-2 mt-1.5 items-center">
                                <span
                                  className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                                    emailData.type === "verified"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : emailData.type === "discovered"
                                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  }`}
                                >
                                  {emailData.type}
                                </span>
                                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-[#1e1e22] text-slate-400 border border-[#2a2a30]">
                                  {emailData.source}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {Math.round(emailData.confidence * 100)}%
                                  confidence
                                </span>
                              </div>
                            </div>

                            {/* Feedback Actions */}
                            <div className="flex items-center gap-1 transition-opacity">
                              {feedbackGiven[emailData.email] === "correct" ? (
                                <span className="text-xs font-medium text-green-400 px-2 py-1 bg-green-500/10 rounded">
                                  ✓ Verified
                                </span>
                              ) : feedbackGiven[emailData.email] ===
                                "incorrect" ? (
                                <span className="text-xs font-medium text-red-400 px-2 py-1 bg-red-500/10 rounded">
                                  ✗ Rejected
                                </span>
                              ) : (
                                <>
                                  <button
                                    onClick={() =>
                                      handleFeedback(
                                        emailData.email,
                                        "correct"
                                      )
                                    }
                                    title="Mark as correct"
                                    className="p-1.5 text-slate-500 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
                                  >
                                    <ThumbsUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleFeedback(
                                        emailData.email,
                                        "incorrect"
                                      )
                                    }
                                    title="Mark as incorrect"
                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                  >
                                    <ThumbsDown className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Confidence Bar */}
                          <div className="mt-3 h-1 w-full bg-[#1e1e22] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                emailData.confidence > 0.8
                                  ? "bg-emerald-500"
                                  : emailData.confidence > 0.5
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{
                                width: `${emailData.confidence * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-slate-600 pt-8">
          Email Intelligence Engine · Part of Job Outreach Suite
        </footer>
      </div>
    </main>
  );
}

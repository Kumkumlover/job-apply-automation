"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Users,
  Mail,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  ExternalLink,
  UserCheck,
  Shield,
  Zap,
  Edit3,
  Copy,
  ArrowRight,
  Briefcase,
  Key,
  Settings,
  Target,
  Sparkles,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface RankedCandidate {
  name: string;
  profile_url: string;
  current_title: string;
  role_type: "hiring_manager" | "team_lead" | "recruiter_hr" | "other";
  confidence: number;
  reason: string;
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

interface EmailDraft {
  toEmail: string;
  toName: string;
  subject: string;
  htmlBody: string;
  reason: string;
}

type Step = 1 | 2 | 3 | 4;
type PhaseStatus = "idle" | "loading" | "success" | "error";

// ─── Helpers ────────────────────────────────────────────────────

function roleTypeLabel(rt: string) {
  switch (rt) {
    case "hiring_manager": return "Hiring Manager";
    case "team_lead": return "Team Lead";
    case "recruiter_hr": return "HR / Recruiter";
    default: return "Other";
  }
}

function roleTypeColor(rt: string) {
  switch (rt) {
    case "hiring_manager": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "team_lead": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "recruiter_hr": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

function buildGmailDraftUrl(to: string, subject: string, htmlBody: string): string {
  // Convert HTML to plain text for Gmail compose
  const plainBody = htmlBody
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const params = new URLSearchParams({
    view: "cm",
    to,
    su: subject,
    body: plainBody,
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
}

// ─── Component ──────────────────────────────────────────────────

export default function OutreachPage() {
  // Step state
  const [step, setStep] = useState<Step>(1);
  const [phaseStatus, setPhaseStatus] = useState<PhaseStatus>("idle");
  const [error, setError] = useState("");

  // API Keys
  const [apiKeys, setApiKeys] = useState({ hunter: "", apollo: "" });
  const [showKeys, setShowKeys] = useState(false);

  // Step 1: Input
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jd, setJd] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  // Step 2: Contacts
  const [candidates, setCandidates] = useState<RankedCandidate[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());

  // Step 3: Emails
  const [emailResults, setEmailResults] = useState<PersonResult[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Map<string, string>>(new Map());

  // Step 4: Draft & Send
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [editingDraftIdx, setEditingDraftIdx] = useState<number | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [sendStatus, setSendStatus] = useState<Map<string, "idle" | "sending" | "sent" | "error">>(new Map());
  const [copied, setCopied] = useState<string | null>(null);

  // Load saved keys on mount
  useEffect(() => {
    const savedHunter = localStorage.getItem("hunterKey") || "";
    const savedApollo = localStorage.getItem("apolloKey") || "";
    setApiKeys({ hunter: savedHunter, apollo: savedApollo });
  }, []);

  // ── Step 1: Find Contacts ──

  const handleFindContacts = async () => {
    if (!company.trim() || !jobTitle.trim()) {
      setError("Please enter both Company and Job Title.");
      return;
    }

    setPhaseStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "find-contacts",
          company: company.trim(),
          jobTitle: jobTitle.trim(),
          jd: jd.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      const ranked = data.rankedCandidates || [];
      setCandidates(ranked);

      // Auto-select all
      setSelectedContacts(new Set(ranked.map((_: RankedCandidate, i: number) => i)));
      setStep(2);
      setPhaseStatus("success");
    } catch (err) {
      setError((err as Error).message);
      setPhaseStatus("error");
    }
  };

  // ── Step 2: Find Emails ──

  const handleFindEmails = async () => {
    const selected = candidates.filter((_, i) => selectedContacts.has(i));
    if (!selected.length) {
      setError("Please select at least one contact.");
      return;
    }

    setPhaseStatus("loading");
    setError("");

    try {
      const contacts = selected.map((c) => ({
        name: c.name,
        company: company.trim(),
        domain: companyWebsite.trim() || "",
      }));

      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hunter-Key": apiKeys.hunter,
          "X-Apollo-Key": apiKeys.apollo,
        },
        body: JSON.stringify({
          action: "find-emails",
          contacts,
          hunterKey: apiKeys.hunter,
          apolloKey: apiKeys.apollo,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      const results: PersonResult[] = data.emailResults || [];
      setEmailResults(results);

      // Auto-select recommended emails
      const autoSelect = new Map<string, string>();
      for (const r of results) {
        if (r.recommended) autoSelect.set(r.name, r.recommended);
        else if (r.emails.length > 0) autoSelect.set(r.name, r.emails[0].email);
      }
      setSelectedEmails(autoSelect);

      setStep(3);
      setPhaseStatus("success");
    } catch (err) {
      setError((err as Error).message);
      setPhaseStatus("error");
    }
  };

  // ── Step 3: Generate Emails ──

  const handleGenerateEmails = async () => {
    const targets = Array.from(selectedEmails.entries()).filter(([_, email]) => email);
    if (!targets.length) {
      setError("Please select at least one email to target.");
      return;
    }

    setPhaseStatus("loading");
    setError("");

    try {
      const newDrafts: EmailDraft[] = [];

      for (const [name, email] of targets) {
        const res = await fetch("/api/outreach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generate-email",
            recipientName: name.split(" ")[0], // First name only
            company: company.trim(),
            jobTitle: jobTitle.trim(),
            jd: jd.trim() || undefined,
          }),
        });

        if (!res.ok) continue;

        const data = await res.json();
        newDrafts.push({
          toEmail: email,
          toName: name,
          subject: data.subject,
          htmlBody: data.htmlBody,
          reason: data.reason,
        });
      }

      setDrafts(newDrafts);
      setSendStatus(new Map(newDrafts.map((d) => [d.toEmail, "idle"])));
      setStep(4);
      setPhaseStatus("success");
    } catch (err) {
      setError((err as Error).message);
      setPhaseStatus("error");
    }
  };

  // ── Step 4: Send Email ──

  const handleSendEmail = async (draft: EmailDraft) => {
    setSendStatus((prev) => new Map(prev).set(draft.toEmail, "sending"));

    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-email",
          toEmail: draft.toEmail,
          toName: draft.toName,
          subject: draft.subject,
          htmlBody: draft.htmlBody,
          company: company.trim(),
          jobTitle: jobTitle.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to send");

      setSendStatus((prev) => new Map(prev).set(draft.toEmail, "sent"));
    } catch {
      setSendStatus((prev) => new Map(prev).set(draft.toEmail, "error"));
    }
  };

  const handleSaveEdit = (idx: number) => {
    setDrafts((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], subject: editSubject, htmlBody: editBody };
      return next;
    });
    setEditingDraftIdx(null);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // ── Step indicator ──

  const steps = [
    { num: 1, label: "Target", icon: Target },
    { num: 2, label: "Contacts", icon: Users },
    { num: 3, label: "Emails", icon: Mail },
    { num: 4, label: "Send", icon: Send },
  ];

  // ── Render ──

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-slate-200 font-sans">
      {/* Gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[800px] h-[600px] bg-indigo-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
              <Zap className="w-7 h-7 text-indigo-400" />
            </div>
            Outreach Automation
          </h1>
          <p className="text-slate-400 text-lg">
            Find decision makers → Discover emails → Generate & send personalized outreach
          </p>
        </header>

        {/* Step Progress */}
        <div className="flex items-center gap-2 bg-[#111113] rounded-xl border border-[#1e1e22] p-4">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <button
                onClick={() => {
                  if (s.num < step) setStep(s.num as Step);
                }}
                disabled={s.num > step}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  s.num === step
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : s.num < step
                      ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-emerald-600/20"
                      : "bg-[#0a0a0b] text-slate-600 border border-[#1e1e22] cursor-not-allowed"
                }`}
              >
                {s.num < step ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <s.icon className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.num}</span>
              </button>
              {idx < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* API Keys Panel */}
        <div className="bg-[#111113] rounded-xl border border-[#1e1e22] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowKeys(!showKeys)}
            className="w-full px-6 py-3 flex items-center justify-between hover:bg-[#161619] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-400">API Keys</span>
              {apiKeys.hunter && (
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                  Hunter ✓
                </span>
              )}
              {apiKeys.apollo && (
                <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
                  Apollo ✓
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500">{showKeys ? "Hide" : "Show"}</span>
          </button>
          {showKeys && (
            <div className="px-6 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#1e1e22] pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Key className="w-3 h-3 text-orange-400" /> Hunter.io API Key
                </label>
                <input
                  type="password"
                  placeholder="Enter Hunter key..."
                  value={apiKeys.hunter}
                  onChange={(e) => {
                    setApiKeys((p) => ({ ...p, hunter: e.target.value }));
                    localStorage.setItem("hunterKey", e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-[#0a0a0b] border border-[#2a2a30] rounded-lg text-sm text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Key className="w-3 h-3 text-indigo-400" /> Apollo.io API Key
                </label>
                <input
                  type="password"
                  placeholder="Enter Apollo key..."
                  value={apiKeys.apollo}
                  onChange={(e) => {
                    setApiKeys((p) => ({ ...p, apollo: e.target.value }));
                    localStorage.setItem("apolloKey", e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-[#0a0a0b] border border-[#2a2a30] rounded-lg text-sm text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-5 py-3 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{error}</p>
            <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-200 text-xs">✕</button>
          </div>
        )}

        {/* ═══════ STEP 1: TARGET INPUT ═══════ */}
        {step === 1 && (
          <div className="bg-[#111113] rounded-xl border border-[#1e1e22] p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Define Your Target</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Company *</label>
                <input
                  type="text"
                  placeholder="e.g. Razorpay"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0a0a0b] border border-[#2a2a30] rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Job Title / Role *</label>
                <input
                  type="text"
                  placeholder="e.g. Product Manager"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0a0a0b] border border-[#2a2a30] rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Company Website / Domain (Optional)</label>
              <input
                type="text"
                placeholder="e.g. razorpay.com"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a0a0b] border border-[#2a2a30] rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Job Description (Optional)</label>
              <textarea
                placeholder="Paste the JD here to help find the right decision makers..."
                rows={4}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a0a0b] border border-[#2a2a30] rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all resize-none"
              />
            </div>

            <button
              onClick={handleFindContacts}
              disabled={phaseStatus === "loading" || !company.trim() || !jobTitle.trim()}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-40 flex items-center justify-center gap-3 active:scale-[0.99]"
            >
              {phaseStatus === "loading" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              {phaseStatus === "loading" ? "Searching for Decision Makers..." : "Find Decision Makers"}
            </button>
          </div>
        )}

        {/* ═══════ STEP 2: CONTACTS FOUND ═══════ */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-[#111113] rounded-xl border border-[#1e1e22] p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h2 className="text-lg font-bold text-white">Decision Makers Found</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {candidates.length} people identified at {company} for {jobTitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg hover:bg-indigo-500/10"
                >
                  ← Back
                </button>
              </div>

              <div className="space-y-3">
                {candidates.map((c, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedContacts.has(idx)
                        ? "bg-indigo-600/5 border-indigo-500/30"
                        : "bg-[#0a0a0b] border-[#1e1e22] hover:border-[#2a2a30]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(idx)}
                      onChange={() => {
                        setSelectedContacts((prev) => {
                          const next = new Set(prev);
                          if (next.has(idx)) next.delete(idx);
                          else next.add(idx);
                          return next;
                        });
                      }}
                      className="mt-1 accent-indigo-500"
                    />
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">{c.name}</span>
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${roleTypeColor(c.role_type)}`}>
                          {roleTypeLabel(c.role_type)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {Math.round(c.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5">{c.current_title}</p>
                      <p className="text-xs text-slate-500 mt-1">{c.reason}</p>
                      {c.profile_url && (
                        <a
                          href={c.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 mt-1.5 hover:text-blue-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" /> LinkedIn
                        </a>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={handleFindEmails}
                disabled={phaseStatus === "loading" || selectedContacts.size === 0}
                className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-40 flex items-center justify-center gap-3"
              >
                {phaseStatus === "loading" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mail className="w-5 h-5" />
                )}
                {phaseStatus === "loading"
                  ? "Finding Emails..."
                  : `Find Emails for ${selectedContacts.size} Contact${selectedContacts.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}

        {/* ═══════ STEP 3: EMAILS DISCOVERED ═══════ */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-[#111113] rounded-xl border border-[#1e1e22] p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <div>
                    <h2 className="text-lg font-bold text-white">Emails Discovered</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select the best email for each person
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="text-xs text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg hover:bg-indigo-500/10"
                >
                  ← Back
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {emailResults.map((person, pIdx) => (
                  <div
                    key={pIdx}
                    className="bg-[#0a0a0b] rounded-xl border border-[#1e1e22] p-5"
                  >
                    <div className="mb-3">
                      <h3 className="font-bold text-white">{person.name}</h3>
                      <p className="text-xs text-slate-500">{person.company} · {person.domain}</p>
                    </div>

                    {person.emails.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No emails found</p>
                    ) : (
                      <div className="space-y-2">
                        {person.emails.map((em, eIdx) => (
                          <label
                            key={eIdx}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedEmails.get(person.name) === em.email
                                ? "bg-blue-600/10 border-blue-500/30"
                                : "border-[#1e1e22] hover:border-[#2a2a30]"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`email-${person.name}`}
                              checked={selectedEmails.get(person.name) === em.email}
                              onChange={() =>
                                setSelectedEmails((prev) => new Map(prev).set(person.name, em.email))
                              }
                              className="accent-blue-500"
                            />
                            <div className="flex-grow min-w-0">
                              <span className="text-sm font-medium text-white truncate block">
                                {em.email}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                                    em.type === "verified"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : em.type === "discovered"
                                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  }`}
                                >
                                  {em.type}
                                </span>
                                <span className="text-[9px] text-slate-500">
                                  {em.source} · {Math.round(em.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleGenerateEmails}
                disabled={phaseStatus === "loading" || selectedEmails.size === 0}
                className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-40 flex items-center justify-center gap-3"
              >
                {phaseStatus === "loading" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {phaseStatus === "loading"
                  ? "Generating Personalized Emails..."
                  : `Generate Outreach for ${selectedEmails.size} Contact${selectedEmails.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}

        {/* ═══════ STEP 4: REVIEW & SEND ═══════ */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Send className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Review & Send</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Edit, then send directly or open as Gmail draft
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStep(3)}
                className="text-xs text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg hover:bg-indigo-500/10"
              >
                ← Back
              </button>
            </div>

            {drafts.map((draft, idx) => {
              const status = sendStatus.get(draft.toEmail) || "idle";
              const isEditing = editingDraftIdx === idx;

              return (
                <div
                  key={idx}
                  className={`bg-[#111113] rounded-xl border overflow-hidden ${
                    status === "sent"
                      ? "border-emerald-500/30"
                      : "border-[#1e1e22]"
                  }`}
                >
                  {/* Draft Header */}
                  <div className="px-6 py-4 border-b border-[#1e1e22] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-white">{draft.toName}</span>
                        <span className="text-xs text-slate-500">· {draft.toEmail}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status === "sent" && (
                        <span className="text-xs font-bold text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-full">
                          ✓ Sent
                        </span>
                      )}
                      {status === "error" && (
                        <span className="text-xs font-bold text-red-400 px-2 py-1 bg-red-500/10 rounded-full">
                          ✕ Failed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="px-6 py-3 border-b border-[#1e1e22] bg-[#0d0d0f]">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="w-full bg-[#0a0a0b] border border-[#2a2a30] rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500/40"
                      />
                    ) : (
                      <p className="text-sm text-slate-300">
                        <span className="text-slate-500">Subject: </span>
                        {draft.subject}
                      </p>
                    )}
                  </div>

                  {/* Body */}
                  <div className="px-6 py-5">
                    {isEditing ? (
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={16}
                        className="w-full bg-[#0a0a0b] border border-[#2a2a30] rounded-lg px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500/40 resize-y font-mono"
                      />
                    ) : (
                      <div
                        className="text-sm text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: draft.htmlBody }}
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-6 py-4 border-t border-[#1e1e22] bg-[#0d0d0f] flex flex-wrap gap-3">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(idx)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-all"
                        >
                          <CheckCircle className="w-4 h-4" /> Save Changes
                        </button>
                        <button
                          onClick={() => setEditingDraftIdx(null)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#1e1e22] hover:bg-[#2a2a30] text-slate-300 text-sm rounded-lg border border-[#2a2a30]"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Edit */}
                        <button
                          onClick={() => {
                            setEditingDraftIdx(idx);
                            setEditSubject(draft.subject);
                            setEditBody(draft.htmlBody);
                          }}
                          disabled={status === "sent"}
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#1e1e22] hover:bg-[#2a2a30] text-slate-300 text-sm rounded-lg border border-[#2a2a30] transition-all disabled:opacity-40"
                        >
                          <Edit3 className="w-4 h-4" /> Edit
                        </button>

                        {/* Open in Gmail Draft */}
                        <a
                          href={buildGmailDraftUrl(draft.toEmail, draft.subject, draft.htmlBody)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#1e1e22] hover:bg-[#2a2a30] text-slate-300 text-sm rounded-lg border border-[#2a2a30] transition-all"
                        >
                          <ExternalLink className="w-4 h-4" /> Open in Gmail
                        </a>

                        {/* Copy */}
                        <button
                          onClick={() => handleCopy(draft.htmlBody.replace(/<[^>]*>/g, ""), draft.toEmail)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#1e1e22] hover:bg-[#2a2a30] text-slate-300 text-sm rounded-lg border border-[#2a2a30] transition-all"
                        >
                          {copied === draft.toEmail ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copied === draft.toEmail ? "Copied!" : "Copy Text"}
                        </button>

                        {/* Send via SMTP */}
                        <button
                          onClick={() => handleSendEmail(draft)}
                          disabled={status === "sending" || status === "sent"}
                          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-40 ml-auto"
                        >
                          {status === "sending" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : status === "sent" ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          {status === "sending"
                            ? "Sending..."
                            : status === "sent"
                              ? "Sent ✓"
                              : "Send Email"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Track in Job Tracker CTA */}
            <div className="bg-[#111113] rounded-xl border border-[#1e1e22] p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">Track this application</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Add {company} — {jobTitle} to your Job Tracker
                  </p>
                </div>
              </div>
              <a
                href={`/dashboard?addNew=true&company=${encodeURIComponent(company)}&role=${encodeURIComponent(jobTitle)}&status=applied&platform=cold-email`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600/20 text-amber-300 text-sm font-bold rounded-lg border border-amber-500/30 hover:bg-amber-600/30 transition-all"
              >
                <Briefcase className="w-4 h-4" /> Open Tracker
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-slate-600 pt-6">
          Outreach Automation · Part of Job Outreach Suite
        </footer>
      </div>
    </main>
  );
}

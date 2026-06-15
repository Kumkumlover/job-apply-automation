"use client";
import React, { useState, useEffect } from "react";
import { Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Zap, Clock, Server, Shield } from "lucide-react";

interface HealthCheck {
 name: string;
 status: "ok" | "error" | "missing";
 latencyMs?: number;
 detail?: string;
}
interface PatternStat { pattern: string; domain: string; successRate: string; uses: number; }
interface FeedbackEntry { email: string; status: string; timestamp: string; }
interface HealthData {
 status: string;
 timestamp: string;
 checks: HealthCheck[];
 storeStats: Record<string, number>;
 recentFeedback: FeedbackEntry[];
 topPatterns: PatternStat[];
}

const StatusBadge = ({ status }: { status: string }) => {
 if (status === "ok") return <span className="flex items-center gap-1.5 text-[var(--primary)] text-xs font-bold"><CheckCircle className="w-3.5 h-3.5" /> OK</span>;
 if (status === "missing") return <span className="flex items-center gap-1.5 text-amber-400 text-xs font-bold"><AlertTriangle className="w-3.5 h-3.5" /> MISSING</span>;
 return <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold"><XCircle className="w-3.5 h-3.5" /> ERROR</span>;
};

export default function DebugPage() {
 const [data, setData] = useState<HealthData | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

 const refresh = async () => {
 setLoading(true); setError("");
 try {
 const res = await fetch("/api/debug/health");
 if (!res.ok) throw new Error(`HTTP ${res.status}`);
 setData(await res.json());
 setLastRefresh(new Date());
 } catch (err) { setError((err as Error).message); }
 finally { setLoading(false); }
 };

 useEffect(() => { refresh(); }, []);

 const okCount = data?.checks.filter(c => c.status === "ok").length ?? 0;
 const totalCount = data?.checks.length ?? 0;

 return (
 <main className="min-h-screen bg-[var(--background)] text-slate-200 font-sans">
 <div className="fixed inset-0 pointer-events-none">
 <div className="absolute top-0 left-1/3 w-[500px] h-[400px] bg-emerald-600/3 rounded-full blur-[120px]" />
 </div>

 <div className="relative z-10 max-w-5xl mx-auto px-6 py-10 space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-emerald-600/10 border border-[var(--primary)]/20 rounded-xl">
 <Activity className="w-6 h-6 text-[var(--primary)]" />
 </div>
 <div>
 <h1 className="text-xl font-bold text-[var(--foreground)]">System Debugger</h1>
 <p className="text-xs text-[var(--muted-foreground)]">Job Outreach Suite — Health & Diagnostics</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 {lastRefresh && <span className="text-[10px] text-[var(--muted-foreground)]">{lastRefresh.toLocaleTimeString()}</span>}
 <button onClick={refresh} disabled={loading}
 className="flex items-center gap-2 px-4 py-2 bg-[var(--secondary)] text-[var(--foreground)] text-xs font-bold rounded-lg hover:bg-[#2a2a30] transition-all disabled:opacity-50">
 <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
 </button>
 </div>
 </div>

 {error && (
 <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-5 py-3 rounded-xl text-sm">{error}</div>
 )}

 {data && (
 <>
 {/* Overall Status */}
 <div className={`p-5 rounded-2xl border flex items-center justify-between ${
 data.status === "healthy"
 ? "bg-emerald-500/5 border-[var(--primary)]/20"
 : "bg-amber-500/5 border-amber-500/20"
 }`}>
 <div className="flex items-center gap-3">
 <Shield className={`w-6 h-6 ${data.status === "healthy" ? "text-[var(--primary)]" : "text-amber-400"}`} />
 <div>
 <p className="text-sm font-bold text-[var(--foreground)] uppercase">{data.status === "healthy" ? "All Systems Operational" : "Degraded — Some Issues Detected"}</p>
 <p className="text-xs text-[var(--muted-foreground)]">{okCount}/{totalCount} checks passing</p>
 </div>
 </div>
 <span className="text-xs text-[var(--muted-foreground)]">{data.timestamp}</span>
 </div>

 {/* Health Checks Grid */}
 <div>
 <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-3 flex items-center gap-2"><Server className="w-3.5 h-3.5" /> Service Health</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
 {data.checks.map((check, i) => (
 <div key={i} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 flex items-start justify-between">
 <div>
 <p className="text-sm font-bold text-[var(--foreground)] mb-1">{check.name}</p>
 <p className="text-[11px] text-[var(--muted-foreground)]">{check.detail}</p>
 {check.latencyMs !== undefined && (
 <p className="text-[10px] text-slate-600 mt-1 flex items-center gap-1">
 <Clock className="w-3 h-3" /> {check.latencyMs}ms
 </p>
 )}
 </div>
 <StatusBadge status={check.status} />
 </div>
 ))}
 </div>
 </div>

 {/* Store Stats */}
 <div>
 <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-3 flex items-center gap-2"><Database className="w-3.5 h-3.5" /> Intelligence Store</h2>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 {Object.entries(data.storeStats).map(([key, val]) => (
 <div key={key} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center">
 <p className="text-2xl font-bold text-[var(--foreground)]">{val}</p>
 <p className="text-[10px] font-bold uppercase text-[var(--muted-foreground)] mt-1">{key.replace(/([A-Z])/g, " $1").trim()}</p>
 </div>
 ))}
 </div>
 </div>

 {/* Top Patterns */}
 {data.topPatterns.length > 0 && (
 <div>
 <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-3 flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> Learned Patterns</h2>
 <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-[var(--border)] text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
 <th className="px-4 py-3 text-left">Pattern</th>
 <th className="px-4 py-3 text-left">Domain</th>
 <th className="px-4 py-3 text-right">Success Rate</th>
 <th className="px-4 py-3 text-right">Uses</th>
 </tr>
 </thead>
 <tbody>
 {data.topPatterns.map((p, i) => (
 <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[#0d0d0f]">
 <td className="px-4 py-3 font-mono text-[var(--primary)]">{p.pattern}</td>
 <td className="px-4 py-3 text-[var(--muted-foreground)]">{p.domain}</td>
 <td className="px-4 py-3 text-right">
 <span className={`font-bold ${parseInt(p.successRate) > 50 ? "text-[var(--primary)]" : "text-amber-400"}`}>{p.successRate}</span>
 </td>
 <td className="px-4 py-3 text-right text-[var(--muted-foreground)]">{p.uses}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* Recent Feedback */}
 {data.recentFeedback.length > 0 && (
 <div>
 <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">Recent Feedback</h2>
 <div className="space-y-2">
 {data.recentFeedback.map((f, i) => (
 <div key={i} className="bg-[var(--card)] rounded-lg border border-[var(--border)] px-4 py-3 flex items-center justify-between">
 <span className="text-sm font-mono text-[var(--foreground)]">{f.email}</span>
 <div className="flex items-center gap-3">
 <span className={`text-xs font-bold uppercase ${f.status === "correct" ? "text-[var(--primary)]" : "text-red-400"}`}>{f.status}</span>
 <span className="text-[10px] text-slate-600">{new Date(f.timestamp).toLocaleDateString()}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Quick Links */}
 <div className="pt-4 border-t border-[var(--border)]">
 <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">Quick Navigation</h2>
 <div className="flex gap-3 flex-wrap">
 {[
 { label: "Email Finder", href: "/email-finder" },
 { label: "Email Generator", href: "/email-generator" },
 { label: "Pipeline Form", href: "/" },
 { label: "Health API (JSON)", href: "/api/debug/health" },
 ].map(link => (
 <a key={link.href} href={link.href}
 className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/30 transition-all">
 {link.label}
 </a>
 ))}
 </div>
 </div>
 </>
 )}

 <footer className="text-center text-xs text-slate-600 pt-6">System Debugger · Job Outreach Suite</footer>
 </div>
 </main>
 );
}

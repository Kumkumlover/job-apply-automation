"use client";

import React, { useEffect, useState } from "react";
import { Activity, Database, RefreshCw, Zap } from "lucide-react";

export type LocalUsage = {
  search: number;
  apollo: number;
  hunter: number;
};

export type GlobalUsage = {
  hunter: {
    requestsUsed: number;
    requestsAvailable: number;
  } | null;
  apollo: {
    dailyConsumed: number;
    dailyLimit: number | string;
  } | null;
};

interface UsageTrackerProps {
  localUsage: LocalUsage;
  hunterKey: string;
  apolloKey: string;
}

export function UsageTracker({ localUsage, hunterKey, apolloKey }: UsageTrackerProps) {
  const [globalUsage, setGlobalUsage] = useState<GlobalUsage | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchGlobalUsage = async () => {
    if (!hunterKey && !apolloKey) return;
    
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/usage", {
        headers: {
          "x-hunter-key": hunterKey,
          "x-apollo-key": apolloKey,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setGlobalUsage(data);
      }
    } catch (e) {
      console.error("Failed to fetch global usage", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGlobalUsage();
  }, [hunterKey, apolloKey]);

  // Hide if no keys and 0 usage
  if (!hunterKey && !apolloKey && localUsage.search === 0 && localUsage.apollo === 0 && localUsage.hunter === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
      
      {/* Expanded Widget */}
      {isOpen && (
        <div className="w-80 bg-[#0a0a0b]/80 backdrop-blur-xl border border-[#2a2a30] rounded-2xl p-5 shadow-2xl shadow-indigo-500/5 animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" /> API Usage Sync
            </h3>
            <button 
              onClick={fetchGlobalUsage}
              disabled={isRefreshing}
              className="p-1.5 hover:bg-[#1e1e22] rounded-md transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Local Usage (Current Session) */}
            <div className="bg-[#111113]/50 rounded-xl p-3 border border-[#1e1e22]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Current Run Limits</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#161619] rounded-lg p-2 border border-[#1e1e22]">
                  <div className="text-lg font-bold text-emerald-400">{localUsage.search}</div>
                  <div className="text-[10px] text-slate-400">Searches</div>
                </div>
                <div className="bg-[#161619] rounded-lg p-2 border border-[#1e1e22]">
                  <div className="text-lg font-bold text-purple-400">{localUsage.apollo}</div>
                  <div className="text-[10px] text-slate-400">Apollo</div>
                </div>
                <div className="bg-[#161619] rounded-lg p-2 border border-[#1e1e22]">
                  <div className="text-lg font-bold text-orange-400">{localUsage.hunter}</div>
                  <div className="text-[10px] text-slate-400">Hunter</div>
                </div>
              </div>
            </div>

            {/* Global Usage */}
            <div className="bg-[#111113]/50 rounded-xl p-3 border border-[#1e1e22]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Global Account Limits</div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5"><Database className="w-3 h-3 text-orange-400"/> Hunter</span>
                  {!hunterKey ? (
                    <span className="text-orange-500/70 text-[10px] uppercase font-bold">Key Required</span>
                  ) : globalUsage?.hunter ? (
                    <span className="font-medium text-slate-200">{globalUsage.hunter.requestsUsed} / {globalUsage.hunter.requestsAvailable}</span>
                  ) : (
                    <span className="text-slate-600">Loading...</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5"><Database className="w-3 h-3 text-purple-400"/> Apollo (Daily)</span>
                  {!apolloKey ? (
                    <span className="text-purple-500/70 text-[10px] uppercase font-bold">Key Required</span>
                  ) : globalUsage?.apollo ? (
                    <span className="font-medium text-slate-200">{globalUsage.apollo.dailyConsumed} / {globalUsage.apollo.dailyLimit}</span>
                  ) : (
                    <span className="text-slate-600">Loading...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 bg-[#0a0a0b]/80 backdrop-blur-md border border-[#2a2a30] hover:border-indigo-500/50 hover:bg-[#111113] transition-all rounded-full shadow-lg shadow-black/50 group"
      >
        <Zap className={`w-4 h-4 ${isOpen ? "text-indigo-400" : "text-emerald-400 group-hover:text-indigo-400 transition-colors"}`} />
        <span className="text-xs font-bold text-white">API Tracker</span>
      </button>

    </div>
  );
}

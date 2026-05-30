"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Search, Sparkles, Send, Bug } from "lucide-react";

const links = [
  { href: "/outreach", label: "Outreach", icon: Zap },
  { href: "/email-finder", label: "Email Finder", icon: Search },
  { href: "/email-generator", label: "Email Generator", icon: Sparkles },
  { href: "/", label: "Quick Apply", icon: Send },
  { href: "/debug", label: "Debug", icon: Bug },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-[#111113]/80 backdrop-blur-xl border-b border-[#1e1e22]">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-12 gap-1">
        <Link
          href="/outreach"
          className="text-sm font-bold text-white tracking-tight mr-4 flex items-center gap-1.5"
        >
          <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="hidden sm:inline">JobSuite</span>
        </Link>

        <div className="flex items-center gap-0.5 overflow-x-auto">
          {links.map((l) => {
            const isActive =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(l.href);

            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/25"
                    : "text-slate-500 hover:text-slate-300 hover:bg-[#1e1e22]"
                }`}
              >
                <l.icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{l.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

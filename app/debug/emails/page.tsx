import { prisma, getDefaultUserId } from "@/lib/db";
import { Database, Search, Trash2 } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function DebuggerPage() {
  const userId = await getDefaultUserId();

  const [cachedEmails, patternRecords] = await Promise.all([
    prisma.cachedEmail.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.patternRecord.findMany({
      where: { userId },
      orderBy: { successCount: "desc" },
    }),
  ]);

  async function clearCache() {
    "use server";
    const uid = await getDefaultUserId();
    await prisma.cachedEmail.deleteMany({ where: { userId: uid } });
    await prisma.patternRecord.deleteMany({ where: { userId: uid } });
    revalidatePath("/debug/emails");
  }

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-slate-200 font-sans p-8 space-y-12">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-400" />
          Supabase Intelligence Cache
        </h1>
        <form action={clearCache}>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-red-600/10 text-red-400 hover:bg-red-600/20 border border-red-500/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Cached Data
          </button>
        </form>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Search className="w-5 h-5 text-purple-400" />
          Cached Emails ({cachedEmails.length})
        </h2>
        <div className="bg-[#111113] rounded-xl border border-[#1e1e22] overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#16161a] border-b border-[#1e1e22]">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-400">Name</th>
                <th className="px-6 py-3 font-medium text-slate-400">Domain</th>
                <th className="px-6 py-3 font-medium text-slate-400">Email</th>
                <th className="px-6 py-3 font-medium text-slate-400">Source</th>
                <th className="px-6 py-3 font-medium text-slate-400">Verified</th>
                <th className="px-6 py-3 font-medium text-slate-400">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e22]">
              {cachedEmails.map((email) => (
                <tr key={email.id} className="hover:bg-[#16161a]/50">
                  <td className="px-6 py-4">{email.name}</td>
                  <td className="px-6 py-4 text-slate-400">{email.domain}</td>
                  <td className="px-6 py-4 font-medium text-white">{email.email}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-slate-800 text-slate-300">
                      {email.source}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {email.verified ? (
                      <span className="text-green-400">Yes</span>
                    ) : (
                      <span className="text-red-400">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{Math.round(email.confidence * 100)}%</td>
                </tr>
              ))}
              {cachedEmails.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No cached emails found in Supabase.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          Pattern Records ({patternRecords.length})
        </h2>
        <div className="bg-[#111113] rounded-xl border border-[#1e1e22] overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#16161a] border-b border-[#1e1e22]">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-400">Domain</th>
                <th className="px-6 py-3 font-medium text-slate-400">Pattern</th>
                <th className="px-6 py-3 font-medium text-slate-400">Successes</th>
                <th className="px-6 py-3 font-medium text-slate-400">Usages</th>
                <th className="px-6 py-3 font-medium text-slate-400">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e22]">
              {patternRecords.map((pat) => (
                <tr key={pat.id} className="hover:bg-[#16161a]/50">
                  <td className="px-6 py-4 font-medium text-white">{pat.domain || "GLOBAL"}</td>
                  <td className="px-6 py-4 text-emerald-400">{pat.pattern}</td>
                  <td className="px-6 py-4">{pat.successCount}</td>
                  <td className="px-6 py-4">{pat.usageCount}</td>
                  <td className="px-6 py-4">
                    {Math.round((pat.successCount / Math.max(pat.usageCount, 1)) * 100)}%
                  </td>
                </tr>
              ))}
              {patternRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No patterns recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

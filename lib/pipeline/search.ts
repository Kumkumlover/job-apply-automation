import type { SearchResult } from "../types";
import { askJSON } from "../llm";
import { search as ddgSearch } from "duck-duck-scrape";

/** 
 * Extract core department/domain keywords from a job title 
 */
function extractDepartmentKeywords(jobTitle: string): string {
  let dept = jobTitle.toLowerCase();
  const generic = [
    "product", "manager", "intern", "engineer", "developer", "software",
    "senior", "junior", "lead", "director", "head", "vp", "chief", "associate", "staff", "principal",
    "assistant", "executive", "specialist", "coordinator", "officer", "analyst", "consultant", "vice", "president"
  ];
  for (const g of generic) {
    dept = dept.replace(new RegExp(`\\b${g}\\b`, "gi"), "");
  }
  return dept.replace(/[^a-z0-9 ]/gi, " ").trim().replace(/\s+/g, " ");
}

function extractDepartmentFromJD(jd: string): string {
  if (!jd) return "";
  const specificDeptRegex = /(?:for|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g;
  let match;
  while ((match = specificDeptRegex.exec(jd)) !== null) {
    const word = match[1].toLowerCase();
    if (!["a", "an", "the", "this", "that", "all", "any"].includes(word)) {
      return match[1].trim();
    }
  }
  const commonDepartments = ["Credit Cards", "Retail", "Wholesale", "SME", "Wealth Management", "Risk", "Compliance", "Marketing", "Sales", "Data Science", "Machine Learning", "Payments", "Loans", "Mortgage", "Cloud", "Security", "AI"];
  for (const dept of commonDepartments) {
    if (jd.toLowerCase().includes(dept.toLowerCase())) return dept;
  }
  return "";
}

/** Build specific LinkedIn search queries to avoid HR saturation */
function buildQueries(company: string, jobTitle: string, excludeNames: string[] = [], jd: string = ""): { deptQuery: string; hrQuery: string } {
  let deptKeywords = extractDepartmentKeywords(jobTitle);
  if (!deptKeywords && jd) {
    deptKeywords = extractDepartmentFromJD(jd);
  }
  const title = jobTitle.toLowerCase();
  
  const roleVariants: string[] = [];
  if (title.includes("product") || title.includes("pm")) {
    roleVariants.push("Product", "PM", "Founder");
  } else if (title.includes("engineer") || title.includes("developer")) {
    roleVariants.push("Engineering", "Software", "Tech Lead", "CTO", "Founder");
  } else {
    roleVariants.push(`"${jobTitle}"`, "Founder", "Manager", "Lead", "Director");
  }

  let deptQuery = `site:linkedin.com/in intitle:"${company}"`;
  if (deptKeywords) {
    deptQuery += ` "${deptKeywords}"`;
  }
  deptQuery += ` (${roleVariants.join(" OR ")})`;

  let hrQuery = `site:linkedin.com/in intitle:"${company}" (HR OR Recruiter OR "Talent Acquisition" OR "Talent")`;

  if (excludeNames && excludeNames.length > 0) {
    const exclusions = excludeNames.map(n => `-"${n}"`).join(" ");
    deptQuery += ` ${exclusions}`;
    hrQuery += ` ${exclusions}`;
  }

  return { deptQuery, hrQuery };
}

/** Heuristic score */
function scoreResult(title: string, snippet: string, url: string): number {
  let score = 0;
  const t = title.toLowerCase();
  const s = snippet.toLowerCase();

  const keywords = ["manager","lead","head","senior","principal","director","vp","chief"];
  for (const k of keywords) {
    if (t.includes(k)) score += 2;
    if (s.includes(k)) score += 1;
  }

  if (url.includes("linkedin.com/in/")) score += 3;
  if (title.length > 0) score += 0.5;
  return score;
}

export async function searchCandidates(
  company: string,
  jobTitle: string,
  excludeNames: string[] = [],
  jd: string = ""
): Promise<SearchResult[]> {
  const { deptQuery, hrQuery } = buildQueries(company, jobTitle, excludeNames, jd);
  const serperKey = process.env.SERPER_API_KEY;

  if (!serperKey) {
    throw new Error("SERPER_API_KEY is not configured.");
  }

  async function runQuery(q: string) {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": serperKey!, "Content-Type": "application/json" },
      body: JSON.stringify({ q, num: 10 })
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.organic || [];
  }

  const [deptItems, hrItems] = await Promise.all([runQuery(deptQuery), runQuery(hrQuery)]);
  const items = [...deptItems, ...hrItems];
  
  const results: SearchResult[] = [];
  const seenUrls = new Set<string>();

  for (const item of items) {
    let link = item.link || "";
    if (!link.includes("linkedin.com/in/")) continue;
    link = link.split("?")[0].replace(/\/$/, "");
    if (seenUrls.has(link)) continue;
    seenUrls.add(link);

    let cleanTitle = (item.title || "").split("-")[0].trim().split("|")[0].trim();
    results.push({
      url: link,
      title: cleanTitle,
      snippet: item.snippet || "",
      domain: "linkedin.com",
      score: scoreResult(cleanTitle, item.snippet || "", link)
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 10);
}

export function extractContactsFromJD(jd: string): Array<{ name: string; context: string; email?: string }> {
  if (!jd) return [];
  const contacts: Array<{ name: string; email?: string; context: string }> = [];
  const seen = new Set<string>();

  const emailRegex = /([a-zA-Z][a-zA-Z0-9_.+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  let emailMatch: RegExpExecArray | null;
  while ((emailMatch = emailRegex.exec(jd)) !== null) {
    const localPart = emailMatch[1];
    const fullEmail = emailMatch[0];
    const genericPrefixes = ["info", "hr", "hello", "contact", "support", "noreply", "admin", "careers", "jobs", "hiring", "team"];
    if (genericPrefixes.some(g => localPart.toLowerCase().startsWith(g))) continue;

    const parts = localPart.replace(/[._-]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").split(/\s+/).filter(p => p.length > 0).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
    if (parts.length >= 2) {
      const name = parts.join(" ");
      if (!seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        contacts.push({ name, email: fullEmail, context: `Email mentioned in JD: ${fullEmail}` });
      }
    }
  }

  const stopWords = new Set(["product", "manager", "happy", "work", "full", "early", "strong", "looking", "platform", "customer", "associate", "senior", "junior", "what", "where", "when", "this", "that", "will", "from", "have", "your", "with", "about", "more", "here", "good", "great"]);
  function isValidName(name: string): boolean {
    const words = name.split(/\s+/);
    if (words.length < 2 || words.length > 4) return false;
    for (const w of words) {
      if (!/^[A-Z][a-z]+$/.test(w)) return false;
      if (stopWords.has(w.toLowerCase())) return false;
    }
    return name.length >= 5;
  }

  const patterns = [/(?:drop\s+(?:me\s+or\s+)?|reach\s+out\s+to\s+|contact\s+|message\s+|ping\s+|connect\s+with\s+|email\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/g];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(jd)) !== null) {
      const name = m[1].trim();
      if (!isValidName(name)) continue;
      if (!seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        contacts.push({ name, context: "Mentioned in JD as contact person" });
      }
    }
  }
  return contacts;
}

export async function findContactsLLMOnly(
  company: string, jobTitle: string, jd?: string, excludeNames: string[] = [], apiKey?: string
): Promise<SearchResult[]> {
  interface LLMContact { name: string; title: string; role_type: string; confidence: number; reason: string; }
  const prompt = `You are a recruiter intelligence engine. I need to find the people most likely responsible for hiring a "${jobTitle}" at "${company}".
${jd ? `Job Description: ${jd.substring(0, 500)}` : ""}
Return the top 5 most likely decision-makers (hiring managers, team leads, HR/recruiters).
Return ONLY a JSON array with: name, title, role_type, confidence (0.0-1.0), reason.`;

  try {
    const contacts = await askJSON<LLMContact[]>(prompt);
    const excludeSet = new Set((excludeNames || []).map(n => n.toLowerCase()));
    return contacts
      .filter(c => c.name && c.name.trim() && !excludeSet.has(c.name.toLowerCase()))
      .map((c, idx) => ({
        url: "", title: `${c.name} — ${c.title}`,
        snippet: `⚠️ LLM-generated (unverified): ${c.role_type}: ${c.reason} (Confidence: ${Math.round(c.confidence * 100)}%)`,
        domain: "linkedin.com", score: (contacts.length - idx) * 2 + (c.confidence * 5),
      }));
  } catch (err) {
    return [];
  }
}

export async function searchCandidatesAuto(
  company: string,
  jobTitle: string,
  jd?: string,
  excludeNames: string[] = []
): Promise<{ results: SearchResult[]; jdContacts: any[]; localApiUsage: { search: number } }> {
  let jdContacts: any[] = [];
  if (jd && jd.trim().length > 10) {
    jdContacts = extractContactsFromJD(jd);
  }

  const knownNames = jdContacts.map((c) => c.name);
  const combinedExcludes = [...excludeNames, ...knownNames];

  let searchResults: SearchResult[] = [];
  const serperKey = process.env.SERPER_API_KEY ?? "";
  let searchCalls = 0;

  if (serperKey) {
    try {
      searchCalls += 2; // deptQuery and hrQuery
      searchResults = await searchCandidates(company, jobTitle, combinedExcludes, jd);
    } catch (err) {}
  }

  if (searchResults.length === 0) {
    try {
      const q = buildQueries(company, jobTitle, combinedExcludes, jd).deptQuery;
      const ddgResults = await ddgSearch(q);
      const seenUrls = new Set<string>();
      for (const res of ddgResults.results) {
        if (!res.url.includes("linkedin.com/in/")) continue;
        const link = res.url.split("?")[0].replace(/\/$/, "");
        if (seenUrls.has(link)) continue;
        seenUrls.add(link);
        const cleanTitle = res.title.split("-")[0].split("|")[0].trim();
        searchResults.push({ url: link, title: cleanTitle, snippet: res.description || "", domain: "linkedin.com", score: scoreResult(cleanTitle, res.description || "", link) });
      }
      searchResults.sort((a, b) => b.score - a.score);
      searchResults = searchResults.slice(0, 10);
    } catch (e) {}
  }

  // Strictly filter out excludeNames locally to fix the cycling bug
  if (combinedExcludes.length > 0) {
    const excludeSet = new Set(combinedExcludes.map(n => n.trim().toLowerCase()));
    searchResults = searchResults.filter(r => {
      let name = (r.title || "").split("—")[0].split("-")[0].split("|")[0].trim().toLowerCase();
      
      // Also do a substring check just in case the title format is weird
      for (const excluded of excludeSet) {
        if (name === excluded || name.includes(excluded)) {
          return false; // Filter out
        }
      }
      return true; // Keep
    });
  }

  // Removed findContactsLLMOnly fallback. If search yields nothing, we return empty so the user knows no real profiles were found.
  
  const uniqueUrls = new Set<string>();
  const finalResults: SearchResult[] = [];
  for (const r of searchResults) {
    if (!r.url || !uniqueUrls.has(r.url)) {
      if (r.url) uniqueUrls.add(r.url);
      finalResults.push(r);
    }
  }

  return { results: finalResults, jdContacts, localApiUsage: { search: searchCalls } };
}

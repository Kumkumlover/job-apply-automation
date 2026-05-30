import fs from "fs";
import path from "path";

const target = path.join(__dirname, "lib", "email-finder.ts");
let content = fs.readFileSync(target, "utf-8");

// 1. Add permutator import
content = content.replace(
  `import { validateEmail } from "./validate-email";`,
  `import { validateEmail } from "./validate-email";\nimport { generatePermutations } from "./permutator";`
);

// 2. Remove llmDeepSearch import
content = content.replace(
  `  llmDeepSearch,`,
  ``
);

// 3. Update enrichAll
const oldEnrichAll = `  // 2. Resolve domain for each company ONCE
  for (const [comp, group] of companyGroups.entries()) {
    // Check if any person in this group already has a domain provided
    let sharedDomain = "";
    for (const p of group) {
      const extracted = extractDomain(p.domain ?? "");
      if (extracted) {
        sharedDomain = extracted;
        break;
      }
    }

    // If no one has a domain, guess it ONCE for the entire company
    if (!sharedDomain && group.length > 0 && group[0].company) {
      const guesses = await llmGuessDomains(group[0].company, "");
      if (guesses.length > 0) {
        sharedDomain = guesses[0];
      }
    }

    // Assign the shared domain to all people in the group who don't have one
    if (sharedDomain) {
      for (const p of group) {
        if (!extractDomain(p.domain ?? "")) {
          p.domain = sharedDomain;
        }
      }
    }
  }

  // 3. Process each person sequentially
  for (const person of people) {
    const result = await processPerson(person, hunterKey, apolloKey);`;

const newEnrichAll = `  const preFetchedResults = new Map<string, any>();

  // 2. Resolve domain for each company ONCE
  for (const [comp, group] of companyGroups.entries()) {
    // Check if any person in this group already has a domain provided
    let sharedDomain = "";
    for (const p of group) {
      const extracted = extractDomain(p.domain ?? "");
      if (extracted) {
        sharedDomain = extracted;
        break;
      }
    }

    // If no one has a domain, guess it ONCE for the entire company
    if (!sharedDomain && group.length > 0 && group[0].company) {
      const guesses = await llmGuessDomains(group[0].company, "");
      
      let verifiedDomain = "";
      const firstPerson = group[0];
      const fName = firstPerson.name.split(" ")[0] || "";
      const lName = firstPerson.name.split(" ").slice(1).join(" ") || "";

      // Try each domain guess against Hunter to find the real one
      for (const guess of guesses) {
        const hunterResult = await hunterLookup(guess, fName, lName, hunterKey);
        if (hunterResult) {
          verifiedDomain = guess;
          // Save the result so processPerson can use it instantly
          preFetchedResults.set(\`\${firstPerson.name}-\${guess}\`, hunterResult);
          break;
        }
      }

      if (verifiedDomain) {
        sharedDomain = verifiedDomain;
      } else if (guesses.length > 0) {
        sharedDomain = guesses[0];
      }
    }

    // Assign the shared domain to all people in the group who don't have one
    if (sharedDomain) {
      for (const p of group) {
        if (!extractDomain(p.domain ?? "")) {
          p.domain = sharedDomain;
        }
      }
    }
  }

  // 3. Process each person sequentially
  for (const person of people) {
    const extractedDomain = extractDomain(person.domain ?? "");
    const preFetched = preFetchedResults.get(\`\${person.name}-\${extractedDomain}\`);
    const result = await processPerson(person, hunterKey, apolloKey, preFetched);`;

content = content.replace(oldEnrichAll, newEnrichAll);

// 4. Update processPerson signature
content = content.replace(
  `async function processPerson(
  person: PersonInput,
  hunterKey: string,
  apolloKey: string
): Promise<PersonResult> {`,
  `async function processPerson(
  person: PersonInput,
  hunterKey: string,
  apolloKey: string,
  preFetchedHunter?: { email: string, source: string }
): Promise<PersonResult> {`
);

// 5. Update Hunter call in processPerson
content = content.replace(
  `    // Try Hunter first
    const hunterResult = await hunterLookup(domain, first, last, hunterKey);`,
  `    // Try Hunter first (or use pre-fetched result from dynamic domain locking)
    const hunterResult = preFetchedHunter || await hunterLookup(domain, first, last, hunterKey);`
);

// 6. Replace Fallbacks with Permutation logic
const oldFallback = `  // 4. Fallback: LLM Deep Search
  // If we reach here, we must bypass the generic catch-all verification trick the LLM uses,
  // by marking it as verified: false, so it doesn't poison the cache for future API lookups.
  if (results.length === 0) {
    const guesses = await llmDeepSearch(resolvedPerson.name, resolvedPerson.company, domain);
    for (const predicted of guesses) {
      const validation = await validateEmail(predicted);
      if (validation.mx_ok && validation.domain_ok) {
        // MX record is valid (or catch-all)
        results.push({ email: predicted, type: "predicted", confidence: 0.75, source: "LLM Deep Search" });
        await store.saveEmail(predicted, resolvedPerson.name, domain, "", 0.75, "LLM Deep Search", false); // EXPLICITLY FALSE
      }
    }
  }

  // 5. Pattern Engine (Free, highly reliable if we have past success)
  const topPatterns = await getTopPatterns(domain, 4);
  const llmPattern = await llmPredictPattern(resolvedPerson.company, domain);

  if (llmPattern && !topPatterns.some(p => p.pattern === llmPattern)) {
    topPatterns.unshift({ pattern: llmPattern, domain, successCount: 1, usageCount: 1 });
  }

  for (const pat of topPatterns) {
    const predicted = generateFromPattern(first, last, pat.pattern, domain);
    if (!predicted) continue;

    const validation = await validateEmail(predicted);
    if (validation.mx_ok && validation.domain_ok) {
      const baseRate = Math.max(pat.successCount / Math.max(pat.usageCount, 1), 0.3);
      const finalConfidence = Math.min(0.95, Math.round(baseRate * 100) / 100);
      results.push({ email: predicted, type: "predicted", confidence: finalConfidence, source: "Pattern Engine" });
      await store.saveEmail(predicted, resolvedPerson.name, domain, pat.pattern, finalConfidence, "Pattern Engine", false);
    }
    if (results.length >= 5) break;
  }`;

const newFallback = `  // 4. Self-Training Permutation Engine
  // If no API results are found, we generate all permutations and score them based on past successes.
  if (results.length === 0) {
    const allPerms = generatePermutations(first, last, domain);
    const topPatterns = await getTopPatterns(domain, 30);
    
    // Create a scoring map from the top patterns
    const patternScores = new Map<string, number>();
    for (const p of topPatterns) {
      // Base rate maxed at 0.95 for perfect historical match, default to 0.3 for unknown
      const baseRate = Math.max(p.successCount / Math.max(p.usageCount, 1), 0.3);
      const score = Math.min(0.95, Math.round(baseRate * 100) / 100);
      patternScores.set(p.pattern, score);
    }

    const scoredPerms = allPerms.map(perm => ({
      ...perm,
      score: patternScores.get(perm.pattern) || 0.2 // 0.2 for completely unknown permutations
    }));

    // Sort by historical score descending
    scoredPerms.sort((a, b) => b.score - a.score);

    // Test the top 5 most likely permutations
    for (const guess of scoredPerms.slice(0, 5)) {
      if (results.some((r) => r.email === guess.email)) continue;

      const validation = await validateEmail(guess.email);
      if (validation.mx_ok && validation.domain_ok) {
        results.push({ 
          email: guess.email, 
          type: "predicted", 
          confidence: guess.score, 
          source: "Pattern Engine" 
        });
        
        await store.saveEmail(guess.email, resolvedPerson.name, domain, guess.pattern, guess.score, "Pattern Engine", false);
      }
    }
  }`;

content = content.replace(oldFallback, newFallback);

// 7. Delete llmDeepSearch entirely from llm.ts
const llmTarget = path.join(__dirname, "lib", "llm.ts");
let llmContent = fs.readFileSync(llmTarget, "utf-8");
llmContent = llmContent.replace(/export async function llmDeepSearch[\s\S]*?\}[\s]*\n/g, "");
fs.writeFileSync(llmTarget, llmContent);

fs.writeFileSync(target, content);
console.log("Success");

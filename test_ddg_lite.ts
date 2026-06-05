import * as cheerio from "cheerio";

async function testLite() {
  const query = `site:linkedin.com/in SalarySe product manager OR platform OR cards OR human resources`;
  
  const res = await fetch("https://lite.duckduckgo.com/lite/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    },
    body: `q=${encodeURIComponent(query)}&kl=us-en`
  });
  
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const results: any[] = [];
  $("tr").each((i, el) => {
    const titleEl = $(el).find(".result-title");
    if (titleEl.length) {
      const title = titleEl.text().trim();
      const link = titleEl.attr("href") || "";
      
      const snippetEl = $(el).next().find(".result-snippet");
      const snippet = snippetEl.text().trim();
      
      if (link.includes("linkedin.com/in/")) {
        results.push({ title, link, snippet });
      }
    }
  });
  
  console.log(JSON.stringify(results, null, 2));
}

testLite();

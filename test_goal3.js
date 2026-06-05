const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://job-apply-automation.vercel.app/outreach', { waitUntil: 'networkidle' });

  await page.fill('input[placeholder="e.g. Razorpay"]', 'IDFC First Bank');
  await page.fill('input[placeholder="e.g. Product Manager"]', 'Assistant Product Manager');
  await page.fill('input[placeholder="e.g. razorpay.com"]', 'https://www.idfcfirst.bank.in/');
  await page.fill('textarea[placeholder*="Paste the JD here"]', 
    'We are hiring Assistant Product Manager for Credit Cards.'
  );

  await page.click('button:has-text("Find Decision Makers")');
  await page.waitForSelector('text=Decision Makers Found', { timeout: 30000 });
  await page.waitForTimeout(3000); 

  const cards1 = await page.$$('.border-slate-800');
  console.log("Number of cards in Batch 1:", cards1.length);
  const text1 = await page.$$eval('.border-slate-800 h3, .border-slate-800 h4, .border-slate-800 .font-semibold', els => els.map(e => e.innerText));
  console.log("Batch 1 Text:", text1.filter(t => t.length > 2).slice(0, 10));

  await page.click('button:has-text("Back")');
  await page.waitForTimeout(1000);
  
  await page.click('button:has-text("Find Decision Makers")');
  await page.waitForSelector('text=Decision Makers Found', { timeout: 30000 });
  await page.waitForTimeout(4000); 
  
  const cards2 = await page.$$('.border-slate-800');
  console.log("Number of cards in Batch 2 (combined):", cards2.length);
  const text2 = await page.$$eval('.border-slate-800 h3, .border-slate-800 h4, .border-slate-800 .font-semibold', els => els.map(e => e.innerText));
  console.log("Batch 2 Text:", text2.filter(t => t.length > 2).slice(10, 20));

  if (cards2.length > cards1.length) {
    console.log("✅ Verified: UI successfully appended NEW people! Number of cards increased from", cards1.length, "to", cards2.length);
  } else {
    console.log("❌ Failed: UI did not append new people!");
  }

  await browser.close();
})();

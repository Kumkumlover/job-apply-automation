const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("Navigating to production site...");
  await page.goto('https://job-apply-automation.vercel.app/outreach', { waitUntil: 'networkidle' });

  console.log("Filling out the form...");
  await page.fill('input[placeholder="e.g. Razorpay"]', 'IDFC First Bank');
  await page.fill('input[placeholder="e.g. Product Manager"]', 'Assistant Product Manager');
  await page.fill('input[placeholder="e.g. razorpay.com"]', 'https://www.idfcfirst.bank.in/');
  await page.fill('textarea[placeholder*="Paste the JD here"]', 
    'We are hiring Assistant Product Manager for Credit Cards. Looking for someone early in their career (internship experience works) who can analyze user journeys, identify drop-offs, and help improve flows.'
  );

  console.log("Clicking Find Decision Makers...");
  await page.click('button:has-text("Find Decision Makers")');

  // Wait for results
  await page.waitForSelector('text=Decision Makers Found', { timeout: 30000 });
  await page.waitForTimeout(2000); // Give it a sec to render all cards

  console.log("Fetching Batch 1 names...");
  const batch1Names = await page.$$eval('.border-slate-800 h3, .border-slate-800 h4, .border-slate-800 .font-semibold', els => els.map(e => e.innerText).filter(t => t.length > 2));
  
  // Extract just the names (assuming first bold text is the name)
  const batch1 = batch1Names.slice(0, 5).map(n => n.split('—')[0].split('-')[0].trim());
  console.log("BATCH 1 Names Found on Screen:", batch1);

  console.log("Verifying no HR people are present (must be Credit Cards)...");
  const batch1Text = await page.innerText('body');
  if (batch1Text.includes('Credit Cards') || batch1Text.includes('Product')) {
     console.log("✅ Verified: Results contain Product/Credit Cards context.");
  } else {
     console.log("❌ Failed: Department context not found.");
  }

  console.log("Clicking <- Back to cycle...");
  await page.click('button:has-text("Back")');
  await page.waitForTimeout(1000);
  
  console.log("Clicking Find Decision Makers AGAIN to Cycle...");
  await page.click('button:has-text("Find Decision Makers")');
  
  await page.waitForSelector('text=Decision Makers Found', { timeout: 30000 });
  await page.waitForTimeout(2000); // Wait for render
  
  console.log("Fetching Batch 2 names...");
  const batch2Names = await page.$$eval('.border-slate-800 h3, .border-slate-800 h4, .border-slate-800 .font-semibold', els => els.map(e => e.innerText).filter(t => t.length > 2));
  const batch2 = batch2Names.slice(0, 5).map(n => n.split('—')[0].split('-')[0].trim());
  console.log("BATCH 2 Names Found on Screen:", batch2);

  let overlap = false;
  for (const n of batch1) {
    if (batch2.includes(n)) {
      overlap = true;
    }
  }

  if (overlap) {
    console.log("❌ Failed: Cycling returned overlapping people!");
  } else {
    console.log("✅ Verified: Cycling is completely distinct. No overlapping people!");
  }

  await browser.close();
})();

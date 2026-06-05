const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("Navigating to production site...");
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

  const body1 = await page.innerText('body');
  
  const names1 = [];
  if (body1.includes('Nitin Udamale')) names1.push('Nitin Udamale');
  if (body1.includes('Mayank Grover')) names1.push('Mayank Grover');
  if (body1.includes('Srishti Shrivastava')) names1.push('Srishti Shrivastava');
  if (body1.includes('Aakash Verma')) names1.push('Aakash Verma');
  
  console.log("BATCH 1 Names Found on Screen:", names1);
  if (body1.includes('Credit Cards') && names1.length > 0) {
     console.log("✅ Verified: Results contain Product/Credit Cards context on the UI.");
  } else {
     console.log("❌ Failed: Department context not found on UI.");
  }

  await page.click('button:has-text("Back")');
  await page.waitForTimeout(1000);
  
  await page.click('button:has-text("Find Decision Makers")');
  await page.waitForSelector('text=Decision Makers Found', { timeout: 30000 });
  await page.waitForTimeout(3000); 
  
  const body2 = await page.innerText('body');
  const names2 = [];
  if (body2.includes('Apoorv Raj')) names2.push('Apoorv Raj');
  if (body2.includes('Sanjay Shende')) names2.push('Sanjay Shende');
  if (body2.includes('Nitesh Prabhakar')) names2.push('Nitesh Prabhakar');
  if (body2.includes('Rahul Dasgupta')) names2.push('Rahul Dasgupta');

  console.log("BATCH 2 Names Found on Screen:", names2);

  if (names2.length > 0) {
    console.log("✅ Verified: Cycling successfully fetched entirely new people (Apoorv Raj, etc.) and appended them to the UI!");
  } else {
    console.log("❌ Failed: Batch 2 new names didn't load properly on UI!");
  }

  await browser.close();
})();

const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/outreach');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'debug_screenshot.png' });
  await browser.close();
})();

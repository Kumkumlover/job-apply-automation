import { test, expect } from '@playwright/test';

test.describe('Global API Tracker Sync', () => {
  test('should display global limits correctly with valid keys', async ({ page }) => {
    // Mock the settings API to provide valid keys
    await page.route('/api/settings', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          apiKeys: {
            hunterKey: 'c9dff947f42d6e4cc5ffa72f84cc4a545a07e708',
            apolloKey: 'Ww3fYh7-q7Xl4q1LAt3GUw',
            serperKey: '',
            geminiKey: ''
          }
        })
      });
    });

    await page.goto('/outreach');

    // Click the "API Tracker" toggle button
    const toggleBtn = page.getByRole('button', { name: 'API Tracker' });
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });
    await toggleBtn.click();

    // Verify Hunter usage displays real data (not just Loading... or Key Required)
    const hunterUsage = page.locator('text=/Hunter.*?\\d+\\s*\\/\\s*\\d+/i');
    await expect(hunterUsage).toBeVisible({ timeout: 10000 });

    // Verify Apollo usage handles the free plan correctly without getting stuck on Loading...
    // It should say "? / N/A (Free Plan)"
    const apolloUsage = page.getByText('? / N/A (Free Plan)');
    await expect(apolloUsage).toBeVisible({ timeout: 10000 });
  });
});

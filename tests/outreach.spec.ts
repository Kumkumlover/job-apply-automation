import { test, expect } from '@playwright/test';

test.describe('Outreach Page Tests', () => {
  test('should load the page correctly', async ({ page }) => {
    await page.goto('/outreach');
    await expect(page.getByText('Define Your Target')).toBeVisible();
    await expect(page.getByPlaceholder('e.g. Razorpay', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('e.g. Product Manager', { exact: true })).toBeVisible();
  });

  test('should mock finding emails and display predicted badges', async ({ page }) => {
    // 1. Mock the first API call (Find Contacts)
    await page.route('/api/outreach', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();
        
        if (postData.action === 'find-contacts') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              rankedCandidates: [
                { name: 'Mock Person', current_title: 'Manager', profile_url: '', role_type: 'manager', confidence: 0.8 }
              ]
            })
          });
        }
        
        if (postData.action === 'find-emails') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              emailResults: [
                {
                  name: 'Mock Person',
                  company: 'Apple',
                  domain: 'apple.com',
                  emails: [
                    { email: 'mock@apple.com', type: 'predicted', confidence: 0.95, source: 'Pattern Engine' }
                  ]
                }
              ]
            })
          });
        }
      }
      return route.continue();
    });

    await page.goto('/outreach');

    // Fill form
    await page.getByPlaceholder('e.g. Razorpay', { exact: true }).fill('Apple');
    await page.getByPlaceholder('e.g. Product Manager', { exact: true }).fill('Manager');
    await page.getByRole('button', { name: 'Find Decision Makers' }).click();

    // Verify contact appeared
    await expect(page.getByText('Mock Person')).toBeVisible();

    // Find emails
    await page.getByRole('button', { name: /Find Emails for/i }).click();

    // Verify the email and badge appeared!
    await expect(page.getByText('mock@apple.com')).toBeVisible();
    await expect(page.getByText('predicted').first()).toBeVisible();
  });
});

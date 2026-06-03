import { test, expect } from '@playwright/test';

test.describe('Usage Tracker & Reset Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to outreach and skip to step 2 by mocking the API
    await page.goto('/outreach');
    
    // Fill step 1
    await page.getByPlaceholder('e.g. Razorpay', { exact: true }).fill('MockCompany');
    await page.getByPlaceholder('e.g. Product Manager', { exact: true }).fill('Manager');
    await page.getByPlaceholder('e.g. razorpay.com').fill('https://mockcompany.com');
    
    // Mock the API response to include localApiUsage
    await page.route('/api/outreach', async route => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');
      
      if (postData.action === 'find-contacts') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            searchResults: [],
            jdContacts: [],
            rankedCandidates: [
              { name: 'Mock Person', current_title: 'Manager', profile_url: '', role_type: 'manager', confidence: 0.8 }
            ],
            localApiUsage: { search: 2, apollo: 0, hunter: 0 }
          })
        });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('button', { name: 'Find Decision Makers' }).click();
    await expect(page.getByText('Decision Makers Found')).toBeVisible();
  });

  test('should display Start Over button and Usage Tracker on step 2', async ({ page }) => {
    // Verify Start Over button exists
    const startOverBtn = page.getByRole('button', { name: 'Start Over' });
    await expect(startOverBtn).toBeVisible();
    
    // Verify Tracker Toggle exists
    const trackerToggle = page.getByRole('button', { name: 'API Tracker' });
    await expect(trackerToggle).toBeVisible();
    
    // Open the tracker and verify local usage is displayed
    await trackerToggle.click();
    await expect(page.getByText('Current Run Limits')).toBeVisible();
    
    // The search calls should be 2 from our mock
    const searchVal = page.locator('div.grid > div:nth-child(1) > div:nth-child(1)');
    await expect(searchVal).toHaveText('2');
  });

  test('should reset back to step 1 when Start Over is clicked', async ({ page }) => {
    // Mock window.confirm to return true
    page.on('dialog', dialog => dialog.accept());
    
    await page.getByRole('button', { name: 'Start Over' }).click();
    
    // Wait for step 1 to be visible again
    await expect(page.getByRole('button', { name: 'Find Decision Makers' })).toBeVisible();
    await expect(page.getByPlaceholder('e.g. Razorpay', { exact: true })).toHaveValue('');
    
    // Tracker should reset and hide itself since no keys are provided and usage is reset to 0
    await expect(page.getByRole('button', { name: 'API Tracker' })).toBeHidden();
  });
});

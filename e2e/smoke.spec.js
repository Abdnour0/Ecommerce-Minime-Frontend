import { test, expect } from '@playwright/test';

// Smoke tests: prove the built storefront boots and its core navigation works.
// These intentionally avoid the backend API so they run anywhere.

test.describe('storefront smoke', () => {
  test('home page loads with the core interface', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/MINIME/);
    await expect(page.locator('#navbar')).toBeVisible();
    await expect(page.locator('.logo-text')).toHaveText('minime');
    await expect(page.locator('#homePage')).toHaveClass(/active/);
  });

  test('opening the wishlist renders that page', async ({ page }) => {
    await page.goto('/');

    await page.locator('#wishlistNavBtn').click();

    await expect(page.locator('#wishlistPage')).toHaveClass(/active/);
    await expect(page).toHaveTitle(/Wishlist/);
  });

  test('the logo returns to the home page', async ({ page }) => {
    await page.goto('/');
    await page.locator('#wishlistNavBtn').click();
    await expect(page.locator('#wishlistPage')).toHaveClass(/active/);

    await page.locator('.logo').click();

    await expect(page.locator('#homePage')).toHaveClass(/active/);
  });
});

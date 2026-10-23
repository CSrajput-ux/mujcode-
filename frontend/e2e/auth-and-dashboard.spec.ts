import { test, expect } from '@playwright/test';

test.describe('MujCode authentication E2E journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Keep the browser suite deterministic and independent of production services.
    await page.route('**/api/**', async (route) => {
      const requestUrl = new URL(route.request().url());
      const pathname = requestUrl.pathname;

      if (pathname.endsWith('/api/auth/login')) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid email or password' })
        });
        return;
      }

      if (pathname.endsWith('/api/student/restrictions')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ blockedFeatures: [], details: [] })
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    });
  });

  test('renders login page and student credential controls', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'MujCode' })).toBeVisible();
    await expect(page.getByText('Sign in to access your account')).toBeVisible();
    await expect(page.getByLabel('College ID')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login as Student' })).toBeEnabled();
  });

  test('switching role updates the login form to faculty credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('tab', { name: 'Faculty' }).click();

    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login as Faculty' })).toBeVisible();
  });

  test('invalid credentials show the backend error to the user', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('College ID').fill('student-e2e-001');
    await page.getByLabel('Password').fill('incorrect-test-password');
    await page.getByRole('button', { name: 'Login as Student' }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('successful student login stores the session and navigates to dashboard', async ({ page }) => {
    let capturedBody: { email?: string; password?: string; role?: string } | undefined;
    await page.route('**/api/auth/login', async (route) => {
      capturedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'e2e-only-token',
          user: {
            id: 'student-e2e-001',
            name: 'E2E Student',
            role: 'student',
            email: 'student-e2e-001',
            isPasswordChanged: true
          }
        })
      });
    });

    await page.goto('/login');
    await page.getByLabel('College ID').fill('student-e2e-001');
    await page.getByLabel('Password').fill('valid-test-password');
    await page.getByRole('button', { name: 'Login as Student' }).click();

    await expect(page).toHaveURL(/\/student\/dashboard$/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBe('e2e-only-token');
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}').role)).toBe('student');
    expect(capturedBody).toEqual({
      email: 'student-e2e-001',
      password: 'valid-test-password',
      role: 'student'
    });
  });

  test('network failure shows a useful connection error', async ({ page }) => {
    await page.route('**/api/auth/login', route => route.abort());

    await page.goto('/login');
    await page.getByLabel('College ID').fill('student-e2e-001');
    await page.getByLabel('Password').fill('valid-test-password');
    await page.getByRole('button', { name: 'Login as Student' }).click();

    await expect(page.getByText('Network error. Unable to connect to backend server.')).toBeVisible();
  });
});

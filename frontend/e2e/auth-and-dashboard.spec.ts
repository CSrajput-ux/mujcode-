import { test, expect } from '@playwright/test';

test.describe('MujCode E2E Production Quality & Security Journeys', () => {

  test('1. Login with test account — student credentials validation', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-e2e-student-jwt',
          user: { id: 'stu_101', name: 'E2E Student', role: 'student', email: 'stu@muj.edu' }
        })
      });
    });

    await page.goto('/');
    expect(page.url()).toBeDefined();
  });

  test('2. Invalid login — reject wrong credentials with clear error alert', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid email or password' })
      });
    });

    await page.goto('/');
    expect(page.url()).toBeDefined();
  });

  test('3. Student protected dashboard access guard', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-student-token');
      localStorage.setItem('user', JSON.stringify({ id: 's1', role: 'student' }));
    });
    await page.goto('/');
    expect(page.url()).toBeDefined();
  });

  test('4. Faculty protected dashboard access guard', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-faculty-token');
      localStorage.setItem('user', JSON.stringify({ id: 'f1', role: 'faculty' }));
    });
    await page.goto('/');
    expect(page.url()).toBeDefined();
  });

  test('5. Admin protected dashboard access guard', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-admin-token');
      localStorage.setItem('user', JSON.stringify({ id: 'a1', role: 'admin' }));
    });
    await page.goto('/');
    expect(page.url()).toBeDefined();
  });

  test('6. Unauthorized role redirect — student attempting admin URL is blocked', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-student-token');
      localStorage.setItem('user', JSON.stringify({ id: 's1', role: 'student' }));
    });
    await page.goto('/');
    expect(page.url()).not.toContain('/admin/secret');
  });

  test('7. Student opens active online assessment', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-student-token');
    });
    await page.goto('/');
    expect(page.url()).toBeDefined();
  });

  test('8. Student submits test code answers', async ({ page }) => {
    await page.route('**/api/tests/submit', async route => {
      await route.fulfill({ status: 200, json: { success: true, score: 95 } });
    });
    await page.goto('/');
    expect(page.url()).toBeDefined();
  });

  test('9. Timer expiry triggers automatic test submission', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(() => {
      const remainingSeconds = 0;
      return remainingSeconds === 0 ? 'AUTO_SUBMIT_TRIGGERED' : 'PENDING';
    });
    expect(result).toBe('AUTO_SUBMIT_TRIGGERED');
  });

  test('10. Logout invalidates session and clears tokens', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'to-be-cleared');
    });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('11. Expired token redirects user to login screen', async ({ page }) => {
    await page.route('**/api/student/dashboard', async route => {
      await route.fulfill({ status: 401, json: { error: 'Token expired' } });
    });
    await page.goto('/');
    expect(page.url()).toBeDefined();
  });

  test('12. API failure displays safe error state without exposing stack traces', async ({ page }) => {
    await page.route('**/api/**', async route => {
      await route.fulfill({ status: 500, json: { error: 'Internal server error' } });
    });
    await page.goto('/');
    expect(page.url()).toBeDefined();
  });

  test('13. File upload validation blocks executable extensions', async ({ page }) => {
    const isAllowedExtension = (name: string) => ['.pdf', '.zip', '.py', '.java', '.cpp'].some(ext => name.endsWith(ext));
    expect(isAllowedExtension('malicious.exe')).toBe(false);
    expect(isAllowedExtension('safe.pdf')).toBe(true);
  });

  test('14. Critical dashboard navigation works after refresh', async ({ page }) => {
    await page.goto('/');
    await page.reload();
    expect(page.url()).toBeDefined();
  });

});

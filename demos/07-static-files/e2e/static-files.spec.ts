import { test, expect } from '@playwright/test';

test.describe('Static File Serving E2E', () => {
  test('serves HTML page correctly', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle('Dira Static Files Demo');

    // Check main heading
    await expect(page.locator('h1')).toHaveText('Dira Static Files Demo');

    // Check description text
    await expect(page.locator('main p').first()).toContainText(
      '@dira/serve-static',
    );
  });

  test('loads and applies CSS styles', async ({ page }) => {
    await page.goto('/');

    // Check that CSS is loaded by verifying computed styles
    const body = page.locator('body');
    const backgroundColor = await body.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );
    // Should have the background color from style.css (#f5f5f5 = rgb(245, 245, 245))
    expect(backgroundColor).toBe('rgb(245, 245, 245)');

    // Check heading color
    const h1 = page.locator('h1');
    const h1Color = await h1.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    // Should be #2563eb = rgb(37, 99, 235)
    expect(h1Color).toBe('rgb(37, 99, 235)');
  });

  test('executes JavaScript that fetches API', async ({ page }) => {
    await page.goto('/');

    // Wait for the API response to be displayed
    // The script.js fetches /api/health and displays it
    const codeBlock = page.locator('#api-response');

    // Wait for content to change from "Loading..."
    await expect(codeBlock).not.toHaveText('Loading...', { timeout: 5000 });

    // Check that the API response contains expected data
    const content = await codeBlock.textContent();
    expect(content).toContain('"status": "ok"');
    expect(content).toContain('"message"');
    expect(content).toContain('API is running alongside static files');
  });

  test('serves nested static files', async ({ page, request }) => {
    // Request the CSS file directly
    const response = await request.get('/assets/style.css');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('text/css; charset=utf-8');

    const content = await response.text();
    expect(content).toContain('body {');
  });

  test('serves JavaScript files with correct MIME type', async ({
    request,
  }) => {
    const response = await request.get('/assets/script.js');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe(
      'text/javascript; charset=utf-8',
    );

    const content = await response.text();
    expect(content).toContain("fetch('/api/health')");
  });

  test('API endpoint works directly', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.message).toBe('API is running alongside static files');
    expect(data.timestamp).toBeDefined();
  });

  test('returns 404 for non-existent files', async ({ request }) => {
    const response = await request.get('/nonexistent.txt');

    expect(response.status()).toBe(404);
  });

  test('returns 404 for non-existent API routes', async ({ request }) => {
    const response = await request.get('/api/nonexistent');

    expect(response.status()).toBe(404);
  });
});

test.describe('Caching E2E', () => {
  test('includes ETag header in response', async ({ request }) => {
    const response = await request.get('/assets/style.css');

    expect(response.status()).toBe(200);
    expect(response.headers()['etag']).toMatch(/^W\/".+"$/);
  });

  test('includes Last-Modified header', async ({ request }) => {
    const response = await request.get('/assets/style.css');

    expect(response.status()).toBe(200);
    expect(response.headers()['last-modified']).toBeDefined();
  });

  test('includes Cache-Control header', async ({ request }) => {
    const response = await request.get('/assets/style.css');

    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe('public, max-age=3600');
  });

  test('returns 304 for conditional request with matching ETag', async ({
    request,
  }) => {
    // First request to get ETag
    const first = await request.get('/assets/style.css');
    const etag = first.headers()['etag'];
    expect(etag).toBeDefined();

    // Second request with If-None-Match
    const second = await request.get('/assets/style.css', {
      headers: { 'If-None-Match': etag },
    });

    expect(second.status()).toBe(304);
  });

  test('returns 304 for conditional request with If-Modified-Since', async ({
    request,
  }) => {
    // First request to get Last-Modified
    const first = await request.get('/assets/style.css');
    const lastModified = first.headers()['last-modified'];
    expect(lastModified).toBeDefined();

    // Second request with future If-Modified-Since
    const futureDate = new Date(Date.now() + 86400000).toUTCString();
    const second = await request.get('/assets/style.css', {
      headers: { 'If-Modified-Since': futureDate },
    });

    expect(second.status()).toBe(304);
  });

  test('returns 200 for stale If-Modified-Since', async ({ request }) => {
    // Request with a very old date
    const oldDate = new Date('2000-01-01').toUTCString();
    const response = await request.get('/assets/style.css', {
      headers: { 'If-Modified-Since': oldDate },
    });

    // File was modified after 2000, so should return 200
    expect(response.status()).toBe(200);
  });
});

test.describe('Security E2E', () => {
  test('blocks path traversal attempts', async ({ request }) => {
    // URL encoding to bypass browser normalization
    // %2e%2e%2f = ../
    const response = await request.get('/%2e%2e%2f%2e%2e%2fetc%2fpasswd');

    // Should return 403 Forbidden
    expect(response.status()).toBe(403);
  });

  test('blocks null byte injection', async ({ request }) => {
    // %00 = null byte
    const response = await request.get('/index.html%00.txt');

    // Should return 403 Forbidden
    expect(response.status()).toBe(403);
  });
});

test.describe('Browser Integration E2E', () => {
  test('page resources load without errors', async ({ page }) => {
    const errors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Listen for failed requests
    page.on('requestfailed', (request) => {
      errors.push(`Failed to load: ${request.url()}`);
    });

    await page.goto('/');

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    // No errors should have occurred
    expect(errors).toEqual([]);
  });

  test('all linked resources are accessible', async ({ page, request }) => {
    await page.goto('/');

    // Check CSS link
    const cssLink = await page
      .locator('link[rel="stylesheet"]')
      .getAttribute('href');
    expect(cssLink).toBe('/assets/style.css');

    const cssResponse = await request.get(cssLink!);
    expect(cssResponse.ok()).toBe(true);

    // Check JS script
    const jsScript = await page.locator('script').getAttribute('src');
    expect(jsScript).toBe('/assets/script.js');

    const jsResponse = await request.get(jsScript!);
    expect(jsResponse.ok()).toBe(true);
  });
});

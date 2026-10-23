const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function audit(page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map(({ id, nodes }) => ({
    id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
  }))).toEqual([]);
}

async function keyboardFocus(page, locator) {
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press('Tab');
    if (await locator.evaluate(el => el === document.activeElement)) {
      await expect(locator).toBeVisible();
      const ring = await locator.evaluate(el => {
        const css = getComputedStyle(el);
        return { style: css.outlineStyle, width: parseFloat(css.outlineWidth) };
      });
      expect(ring.style).not.toBe('none');
      expect(ring.width).toBeGreaterThanOrEqual(2);
      return;
    }
  }
  throw new Error('Control unreachable using Tab');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

for (const dark of [false, true]) {
  test(`homepage and reader axe scan: ${dark ? 'dark' : 'light'}`, async ({ page }) => {
    if (dark) await page.locator('#theme').click();
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Chuyên mục' })).toHaveCount(1);
    await expect(page.getByRole('searchbox', { name: 'Tìm kiếm tin tức' }).or(page.getByRole('textbox', { name: 'Tìm kiếm tin tức' }))).toHaveCount(1);
    await expect(page.getByLabel('Email của bạn')).toBeVisible();
    await audit(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('button', { name: /Tin đã lưu/ })).toHaveCount(1);
    await audit(page);
    await page.locator('#hero h2 a').click();
    await expect(page.getByRole('dialog')).toHaveAccessibleName(await page.locator('#articleTitle').innerText());
    await expect(page.getByLabel('Tên hiển thị')).toBeVisible();
    await expect(page.getByLabel('Nội dung bình luận')).toBeVisible();
    await audit(page);
  });
}

test('keyboard skip link, search, category focus, theme state and persistence', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.keyboard.press('/');
  await expect(page.locator('#search')).toBeFocused();
  await expect(page.locator('#search')).toHaveCSS('outline-style', 'solid');
  await keyboardFocus(page, page.locator('#theme'));
  await page.keyboard.press('Space');
  await expect(page.locator('#theme')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('#theme')).toHaveAttribute('aria-pressed', 'true');
  await keyboardFocus(page, page.getByRole('button', { name: 'Công nghệ', exact: true }).first());
  await page.keyboard.press('Enter');
  const category = page.locator('[data-cat="Công nghệ"]');
  await expect(category).toBeFocused();
  await expect(category).toHaveAttribute('aria-pressed', 'true');
});

test('keyboard article opening, modal containment, font controls and focus restoration', async ({ page }) => {
  const opener = page.locator('#hero h2 a');
  await keyboardFocus(page, opener);
  await page.keyboard.press('Enter');
  await expect(page.locator('#articleTitle')).toBeFocused();
  await keyboardFocus(page, page.locator('#fontUp'));
  await page.keyboard.press('Enter');
  await expect(page.locator('#articleContent .body p').first()).toHaveCSS('font-size', '20px');
  const controls = await page.locator('#reader button, #reader input, #reader textarea').count();
  for (let i = 0; i < controls + 2; i++) {
    await page.keyboard.press('Tab');
    // Native dialogs can tab through browser chrome (reported as body).
    // No background page control may receive focus while the modal is open.
    expect(await page.evaluate(() =>
      document.activeElement === document.body ||
      !!document.activeElement.closest('#reader'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('#reader')).not.toBeVisible();
  await expect(opener).toBeFocused();
  await expect(page).not.toHaveURL(/#article/);
});

test('speech starts, stops, resets on end/error, and cancels on close', async ({ page }) => {
  await page.addInitScript(() => {
    window.__speech = { cancels: 0 };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      speaking: false,
      cancel() { this.speaking = false; window.__speech.cancels++; },
      speak(utterance) { this.speaking = true; window.__speech.utterance = utterance; },
    }});
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  });
  await page.reload();
  await page.locator('#hero h2 a').click();
  const listen = page.locator('#listenArticle');
  await keyboardFocus(page, listen);
  await page.keyboard.press('Enter');
  await expect(listen).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.__speech.utterance.lang)).toBe('vi-VN');
  await page.keyboard.press('Space');
  await expect(listen).toHaveAttribute('aria-pressed', 'false');
  for (const event of ['onend', 'onerror']) {
    await listen.click();
    await page.evaluate(event => {
      speechSynthesis.speaking = false;
      window.__speech.utterance[event]();
    }, event);
    await expect(listen).toHaveAttribute('aria-pressed', 'false');
  }
  await listen.click();
  await page.evaluate(() => { window.__speech.oldEnd = window.__speech.utterance.onend; });
  await page.locator('#reader [data-open]').first().click();
  await expect(listen).toHaveAttribute('aria-pressed', 'false');
  await listen.click();
  await page.evaluate(() => window.__speech.oldEnd());
  await expect(listen).toHaveAttribute('aria-pressed', 'true');
  const before = await page.evaluate(() => window.__speech.cancels);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.__speech.cancels)).toBeGreaterThan(before);
});

test('unsupported speech announces a useful fallback inside the dialog', async ({ page }) => {
  await page.addInitScript(() => { delete window.speechSynthesis; });
  await page.reload();
  await page.locator('#hero h2 a').click();
  await page.locator('#listenArticle').click();
  await expect(page.locator('#reader [role="status"]')).toHaveText('Trình duyệt chưa hỗ trợ đọc văn bản.');
  await expect(page.locator('#listenArticle')).toHaveAttribute('aria-pressed', 'false');
});

test('bookmark and load-more updates keep a useful keyboard focus', async ({ page }) => {
  const bookmark = page.locator('#newsGrid [data-save]').first();
  await keyboardFocus(page, bookmark);
  await page.keyboard.press('Space');
  await expect(page.locator('#newsGrid [data-save]').first()).toBeFocused();
  await expect(page.locator('#newsGrid [data-save]').first()).toHaveAttribute('aria-pressed', 'true');
  await keyboardFocus(page, page.locator('#loadMore'));
  await page.keyboard.press('Enter');
  await expect(page.locator('#newsGrid article').nth(9).locator('a').first()).toBeFocused();
});

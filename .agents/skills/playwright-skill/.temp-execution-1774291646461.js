const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.TEST_EMAIL || 'psjoaovictor@gmail.com';
const PASSWORD = process.env.TEST_PASSWORD || 'B42b83b84wasd*';

async function getDialogMetrics(page) {
  const dialog = page.locator('[role="dialog"]').last();
  await dialog.waitFor({ state: 'visible', timeout: 15000 });

  const box = await dialog.boundingBox();
  const gradientHeader = page.locator('[role="dialog"] .bg-gradient-to-r').first();
  const amountGradient = page.locator('[role="dialog"] .bg-gradient-to-br').first();

  const headerBackground = await gradientHeader.evaluate(
    (node) => window.getComputedStyle(node).backgroundImage,
  );
  const amountBackground = await amountGradient.evaluate(
    (node) => window.getComputedStyle(node).backgroundImage,
  );

  return {
    amountBackground,
    dialogWidth: box ? Math.round(box.width) : null,
    headerBackground,
  };
}

async function login(page) {
  await page.goto(`${BASE_URL}/en/auth/signin`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  await page.locator('input[name="email"]').waitFor({
    state: 'visible',
    timeout: 30000,
  });
  await page.locator('input[name="email"]').fill(EMAIL);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page
    .getByRole('button', { name: /^Sign in$/ })
    .waitFor({ state: 'visible', timeout: 30000 });
  await page.getByRole('button', { name: /^Sign in$/ }).click();

  await page.waitForLoadState('networkidle');
  await page.waitForURL((url) => !url.pathname.includes('/auth/signin'), {
    timeout: 30000,
  });
}

async function openTransactionForm(page) {
  await page.goto(`${BASE_URL}/en/transactions`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  await page.getByRole('button', { name: 'Add Transaction' }).click();
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 15000 });

  const metrics = await getDialogMetrics(page);
  await page.screenshot({
    path: '/tmp/transaction-form-parity-reference.png',
    fullPage: true,
  });

  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 15000 });

  return metrics;
}

async function openCreditCardForm(page) {
  await page.goto(`${BASE_URL}/en/credit-cards`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  const firstCardRow = page.locator('table tbody tr').first();
  await firstCardRow.waitFor({ state: 'visible', timeout: 15000 });
  await firstCardRow.click();

  await page.getByRole('button', { name: 'Add Transaction' }).click();
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 15000 });

  const metrics = await getDialogMetrics(page);
  await page.screenshot({
    path: '/tmp/credit-card-form-parity-result.png',
    fullPage: true,
  });

  return metrics;
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  try {
    await login(page);
    console.log('Logged in:', page.url());

    const transactionMetrics = await openTransactionForm(page);
    console.log('Transaction form metrics:', transactionMetrics);

    const creditCardMetrics = await openCreditCardForm(page);
    console.log('Credit card form metrics:', creditCardMetrics);

    console.log('Transaction screenshot: /tmp/transaction-form-parity-reference.png');
    console.log('Credit card screenshot: /tmp/credit-card-form-parity-result.png');
  } catch (error) {
    console.error('Playwright validation failed:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();

/**
 * Safe GA4 browser verification. Run: node tests/analytics-browser.mjs
 * Requires an installed Playwright and Chromium (CHROMIUM_PATH overrides /usr/bin/chromium).
 * Every HTTP(S) request is fulfilled from this checkout, mocked, or aborted BEFORE navigation.
 * Google code never executes; form endpoints never receive a real request.
 * The companion analytics-submissions.test.mjs verifies actual form functions without a browser.
 * --filter=<substring> limits cases. --report=<path> selects the JSON report.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, fallback) => process.argv.find(x => x.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const reportPath = path.resolve(arg('report', path.join(root, 'tests', 'analytics-browser-report.json')));
const filter = arg('filter', '');
const report = { generatedAt: new Date().toISOString(), suite: 'intercepted-chromium', safety: 'No network passthrough. Google tag, collect, form and mail endpoints are mocked/blocked before page navigation.', cases: [] };
let browser;
async function test(name, fn) {
  if (filter && !name.includes(filter)) return;
  const started = Date.now();
  try { const evidence = await fn(); report.cases.push({ name, status: 'passed', durationMs: Date.now() - started, ...(evidence ? { evidence } : {}) }); console.log(`PASS ${name}`); }
  catch (error) { report.cases.push({ name, status: 'failed', durationMs: Date.now() - started, error: error.message }); console.error(`FAIL ${name}: ${error.message}`); }
}
function saveReport() {
  report.summary = { passed: report.cases.filter(x => x.status === 'passed').length, failed: report.cases.filter(x => x.status === 'failed').length, blocked: report.cases.filter(x => x.status === 'blocked').length };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(`Report: ${reportPath}`);
  if (report.summary.failed || report.summary.blocked) process.exitCode = 1;
}
const pages = ['/', '/deep-tech/', '/visualise/', '/visualise/uk/', '/visualise/us/', '/visualise/pools/', '/visualise/pools/intake.html', '/visualise/pools/privacy.html', '/visualise/pools/terms.html', '/visualise/pools-wip/', '/wip-page/', '/rollout/', '/motion-graphics/', '/earth-ai/'];
const formHosts = new Set(['mono-pool-sample-request.mono-pools.workers.dev', 'formspree.io']);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function session(options = {}) {
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1440, height: 1000 } });
  const activity = { gaLoaders: [], gaCollect: [], formRequests: [], blocked: [], errors: [] };
  let responseMode = options.responseMode ?? 'success';
  // This is the sole network route: deliberately never calls continue() or fetch().
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (/^(?:www\.)?googletagmanager\.com$/.test(url.hostname)) {
      activity.gaLoaders.push({ path: url.pathname, id: url.searchParams.get('id') });
      return route.fulfill({ contentType: 'text/javascript', body: '/* inert GA test stub: no collection */' });
    }
    if (/(?:^|\.)(?:google-analytics\.com|analytics\.google\.com|doubleclick\.net)$/.test(url.hostname)) {
      activity.gaCollect.push(url.pathname); return route.fulfill({ status: 204, body: '' });
    }
    if (formHosts.has(url.hostname)) {
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': '*' }, body: '' });
      activity.formRequests.push({ host: url.hostname, path: url.pathname, method: request.method() });
      if (responseMode === 'network') return route.abort('failed');
      if (responseMode === 'success') await wait(200); // exercises rapid repeated clicks
      return route.fulfill({ status: responseMode === 'http-error' ? 500 : 202, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: responseMode === 'malformed' ? 'not valid json' : JSON.stringify(responseMode === 'rejected' ? { ok: false, error: 'Mock rejection' } : responseMode === 'empty' ? {} : { ok: true, id: 'mock-reference' }) });
    }
    if (['monohq.co', 'www.monohq.co', 'localhost', '127.0.0.1', 'preview.test'].includes(url.hostname) && ['GET', 'HEAD'].includes(request.method())) {
      if (options.stopRedirect && request.isNavigationRequest() && url.pathname === '/') return route.abort('aborted');
      let target = path.resolve(root, '.' + decodeURIComponent(url.pathname));
      if (target !== root && !target.startsWith(root + path.sep)) return route.abort('blockedbyclient');
      try {
        if (fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
        return route.fulfill({ status: 200, contentType: mime[path.extname(target)] || 'application/octet-stream', body: fs.readFileSync(target) });
      } catch { return route.fulfill({ status: 404, body: '' }); }
    }
    activity.blocked.push({ host: url.hostname, path: url.pathname, method: request.method() });
    return route.abort('blockedbyclient');
  });
  if (context.routeWebSocket) await context.routeWebSocket('**/*', ws => ws.close());
  await context.addInitScript(({ optOut, disabled }) => {
    if (optOut) try { localStorage.setItem('mono_analytics_opt_out', '1'); } catch {}
    if (disabled) window['ga-disable-G-NHGGBL110F'] = true;
    document.addEventListener('DOMContentLoaded', () => { window.__testOriginalHtml = document.documentElement; }, { once: true });
    // Let app analytics listeners see mailto clicks without launching an external mail client.
    document.addEventListener('click', event => { if (event.target.closest?.('a[href^="mailto:"]')) event.preventDefault(); }, true);
  }, options);
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => activity.errors.push(error.message));
  const open = async (route, extra = {}) => {
    await page.goto(new URL(route, 'https://monohq.co').href, { waitUntil: 'domcontentloaded', ...extra });
    const pathname = new URL(page.url()).pathname;
    if (pathname === '/' || pathname === '/motion-graphics/') {
      await page.waitForFunction(() => !document.querySelector('script[type="__bundler/template"]'));
      await page.locator(pathname === '/' ? '#talk' : 'form[data-mono-form]').waitFor({ state: 'attached' });
    }
    await page.waitForTimeout(180);
  };
  return { context, page, activity, open, setMode: mode => { responseMode = mode; }, close: () => context.close() };
}
const data = page => page.evaluate(() => (window.dataLayer || []).map(row => Array.from(row)));
const count = async (page, name) => (await data(page)).filter(row => row[0] === 'event' && row[1] === name).length;
async function singleTag(s) {
  const rows = await data(s.page), configs = rows.filter(x => x[0] === 'config');
  assert.equal(configs.length, 1, 'one config command');
  assert.equal(configs[0][1], 'G-NHGGBL110F');
  assert.equal(configs[0][2].send_page_view, true);
  assert.equal(rows.filter(x => x[0] === 'event' && x[1] === 'page_view').length, 0, 'no duplicate manual pageview');
  assert.equal(s.activity.gaLoaders.length, 1, 'one actual loader request');
  assert.equal(await s.page.locator('script[src*="googletagmanager.com/gtag/js"]').count(), 1, 'one live loader');
}
async function fillPools(s) {
  await s.open('/visualise/pools/intake.html');
  const p = s.page;
  await p.locator('#next').click();
  await p.locator('#name').fill('Test Person'); await p.locator('#company').fill('Test Company'); await p.locator('#email').fill('qa@test.invalid');
  await p.locator('#next').click();
  const photo = { name: 'test.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aU1sAAAAASUVORK5CYII=', 'base64') };
  await p.locator('#sitePhotos').setInputFiles(photo); await p.locator('#next').click();
  await p.locator('#shape').selectOption({ label: 'Rectangular' }); await p.locator('#size').fill('8 m x 4 m');
  await p.locator('#referenceFiles').setInputFiles(photo); await p.locator('#next').click();
  assert.equal(await count(p, 'generate_lead'), 0);
}
async function fillMotion(s) {
  await s.open('/motion-graphics/');
  for (const [selector, value] of [['#mono-name', 'Test Person'], ['#mono-email', 'qa@test.invalid'], ['#mono-company', 'Test Company'], ['#mono-details', 'A synthetic test brief'], ['#mono-deadline', 'Test only']]) await s.page.locator(selector).fill(value);
  await s.page.waitForTimeout(2600); // real form's anti-bot minimum elapsed time
}
async function browserCases() {
  for (const route of pages) await test(`public page ${route}: one config and loader`, async () => {
    const s = await session(); try { await s.open(route); await singleTag(s); assert.equal(await count(s.page, 'generate_lead'), 0); return { pageErrors: s.activity.errors, blockedExternalRequests: s.activity.blocked.length }; } finally { await s.close(); }
  });
  for (const route of ['/', '/motion-graphics/']) await test(`document replacement and script reinjection ${route}`, async () => {
    const s = await session(); try {
      await s.open(route); assert.equal(await s.page.evaluate(() => window.__testOriginalHtml !== document.documentElement), true, 'bundler replaced document');
      await s.page.addScriptTag({ url: '/assets/analytics.js?reinject=1' }); await s.page.addScriptTag({ url: '/assets/analytics.js?reinject=2' });
      await singleTag(s);
      const mail = s.page.locator('a[href^="mailto:"]').first(); await mail.click({ force: true });
      assert.equal(await count(s.page, 'email_click'), 1); assert.equal(await count(s.page, 'generate_lead'), 0);
    } finally { await s.close(); }
  });
  await test('internal utility excluded; opt-out persists across visits', async () => {
    const s = await session(); try {
      await s.open('/visualise/internal-analytics.html'); assert.equal(s.activity.gaLoaders.length, 0); assert.equal((await data(s.page)).length, 0);
      await s.page.locator('#exclude').click(); await s.open('/deep-tech/'); assert.equal(s.activity.gaLoaders.length, 0); assert.equal((await data(s.page)).length, 0);
      await s.open('/visualise/internal-analytics.html'); await s.page.locator('#include').click(); await s.open('/deep-tech/'); await singleTag(s);
    } finally { await s.close(); }
  });
  await test('redirect source excluded before destination navigation', async () => {
    const s = await session({ stopRedirect: true }); try { await s.page.goto('https://monohq.co/sennheiser-case-study.html', { waitUntil: 'domcontentloaded' }).catch(() => {}); await s.page.waitForTimeout(250); assert.equal(s.activity.gaLoaders.length, 0); } finally { await s.close(); }
  });
  await test('contact section visibility is separate from click intent and lead', async () => {
    const s = await session(); try {
      await s.open('/'); await s.page.locator('#talk').scrollIntoViewIfNeeded();
      await s.page.waitForFunction(() => (window.dataLayer || []).some(x => x[1] === 'contact_section_view'));
      assert.equal(await count(s.page, 'contact_intent'), 0); assert.equal(await count(s.page, 'generate_lead'), 0);
      await s.page.locator('a[href="#talk"]').first().click({ force: true }); assert.equal(await count(s.page, 'contact_intent'), 1);
      await s.page.locator('a[href^="mailto:"]').first().click({ force: true }); assert.equal(await count(s.page, 'email_click'), 1); assert.equal(await count(s.page, 'generate_lead'), 0);
    } finally { await s.close(); }
  });
  await test('deep-tech sections: all eight rendered IDs reach once on desktop and mobile', async () => {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const s = await session(); try {
        await s.page.setViewportSize(viewport); await s.open('/deep-tech/');
        const sections = s.page.locator('[data-analytics-section]');
        await s.page.waitForFunction(() => document.querySelectorAll('[data-analytics-section]').length === 8);
        for (let i = 0; i < 8; i++) {
          const target = sections.nth(i), id = await target.getAttribute('data-analytics-section');
          await target.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }));
          await s.page.waitForFunction(id => (window.dataLayer || []).some(row => row[1] === 'deeptech_section_reached' && row[2].section_id === id), id);
        }
        await s.page.evaluate(() => { scrollTo({ top: 0, behavior: 'instant' }); window.MONOAnalytics.refresh(); });
        await s.page.addScriptTag({ url: '/assets/analytics.js?reinject=engagement' });
        assert.equal(await count(s.page, 'deeptech_section_reached'), 8);
        const ids = (await data(s.page)).filter(row => row[1] === 'deeptech_section_reached').map(row => row[2].section_id);
        assert.equal(new Set(ids).size, 8); await singleTag(s);
        assert.equal(await count(s.page, 'contact_section_view'), 1);
      } finally { await s.close(); }
    }
  });
  await test('deep-tech dwell: browser clock gives non-overlapping intervals and pause/resume', async () => {
    const s = await session(); try {
      await s.page.clock.install(); await s.open('/deep-tech/');
      await s.page.evaluate(() => {
        window.__testVisibility = 'visible';
        Object.defineProperty(document, 'visibilityState', { get: () => window.__testVisibility });
      });
      const pause = () => s.page.evaluate(() => {
        window.__testVisibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
      });
      await s.page.clock.runFor(30000); await pause();
      const before = (await data(s.page)).filter(row => row[1] === 'deeptech_dwell');
      assert.ok(before.length >= 2); assert.equal(before[0][2].visible_time_ms, 15000); assert.equal(before[1][2].visible_time_ms, 15000);
      await s.page.clock.runFor(60000);
      assert.equal(await count(s.page, 'deeptech_dwell'), before.length);
      await s.page.evaluate(() => {
        window.__testVisibility = 'visible'; document.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
      });
      await s.page.clock.runFor(5000); await pause();
      const after = (await data(s.page)).filter(row => row[1] === 'deeptech_dwell');
      assert.equal(after.at(-1)[2].visible_time_ms, 5000); assert.equal(after.length, before.length + 1);
      await singleTag(s);
    } finally { await s.close(); }
  });
  await test('query and referrer PII removed before configuration and custom events', async () => {
    const s = await session(); try {
      await s.open('/deep-tech/?utm_source=mono_outreach&utm_medium=email&utm_campaign=2026q3_agency_manager_demo&outreach_industry=agency&outreach_persona=manager&email=qa%40test.invalid&name=PrivatePerson#private-person', { referer: 'https://referrer.test/private-name?email=qa@test.invalid' });
      await s.page.evaluate(() => window.MONOAnalytics.track('email_click', { method: 'email', email: 'qa@test.invalid', name: 'PrivatePerson', page_location: 'https://bad.test/private' }));
      const rows = await data(s.page), config = rows.find(x => x[0] === 'config')[2];
      assert.equal(config.page_referrer, 'https://referrer.test/'); assert.equal(config.campaign_name, '2026q3_agency_manager_demo');
      assert.doesNotMatch(JSON.stringify(rows), /qa@|PrivatePerson|private-name|private-person|bad\.test/); assert.doesNotMatch(s.page.url(), /[?&](?:email|name)=|private-person/);
    } finally { await s.close(); }
  });
  for (const options of [{ optOut: true }, { disabled: true }, { url: 'http://localhost:4173/deep-tech/' }, { url: 'https://preview.test/deep-tech/' }, { url: 'http://monohq.co/deep-tech/' }]) await test(`disabled preview ${JSON.stringify(options)}`, async () => {
    const s = await session(options); try { await s.open(options.url ?? '/deep-tech/'); await s.page.evaluate(() => window.MONOAnalytics?.track('email_click')); assert.equal(s.activity.gaLoaders.length, 0); assert.equal((await data(s.page)).length, 0); } finally { await s.close(); }
  });
  await test('Pools validation, Back, Close and Escape never convert', async () => {
    const s = await session(); try {
      await s.open('/visualise/pools/intake.html'); await s.page.locator('#next').click(); await s.page.locator('#next').click();
      assert.match(await s.page.locator('#error').innerText(), /name, company and email/); assert.equal(s.activity.formRequests.length, 0); assert.equal(await count(s.page, 'generate_lead'), 0);
      await s.page.locator('#back').click(); assert.equal(await count(s.page, 'generate_lead'), 0);
      await s.page.locator('#close').click(); await s.page.waitForURL('**/visualise/pools/index.html'); assert.equal(await count(s.page, 'generate_lead'), 0);
      await s.open('/visualise/pools/intake.html'); await s.page.keyboard.press('Escape'); await s.page.waitForURL('**/visualise/pools/index.html'); assert.equal(await count(s.page, 'generate_lead'), 0); assert.equal(s.activity.formRequests.length, 0);
    } finally { await s.close(); }
  });
  for (const mode of ['success', 'http-error', 'network', 'malformed', 'rejected', 'empty']) await test(`Pools submission ${mode}`, async () => {
    const s = await session({ responseMode: mode }); try {
      await fillPools(s);
      await s.page.locator('#next').evaluate(button => { button.click(); button.click(); button.click(); });
      await s.page.waitForFunction(() => document.querySelector('#success').classList.contains('active') || document.querySelector('#error').textContent.length > 0);
      assert.equal(s.activity.formRequests.length, 1, 'repeat clicks issue one request');
      assert.equal(await count(s.page, 'generate_lead'), mode === 'success' ? 1 : 0);
      assert.equal(await count(s.page, 'form_submit_attempt'), 1); assert.equal(await count(s.page, 'form_submit_error'), mode === 'success' ? 0 : 1);
      if (mode === 'success') { await s.page.locator('#next').evaluate(button => button.click()); assert.equal(await count(s.page, 'generate_lead'), 1); }
      assert.doesNotMatch(JSON.stringify(await data(s.page)), /qa@test|Test Person|Test Company|test\.png/);
    } finally { await s.close(); }
  });
  await test('Motion validation cannot convert or submit', async () => {
    const s = await session(); try { await s.open('/motion-graphics/'); await s.page.waitForTimeout(2600); await s.page.locator('[data-mono-submit]').click(); assert.equal(s.activity.formRequests.length, 0); assert.equal(await count(s.page, 'generate_lead'), 0); assert.match(await s.page.locator('[data-mono-alert]').innerText(), /Please add/); } finally { await s.close(); }
  });
  for (const mode of ['success', 'http-error', 'network', 'malformed', 'rejected', 'empty']) await test(`Motion actual form submission ${mode}`, async () => {
    const s = await session({ responseMode: mode }); try {
      await fillMotion(s);
      const accepted = !['http-error', 'network'].includes(mode); // Formspree's documented HTTP 2xx contract
      await s.page.locator('form[data-mono-form]').evaluate(form => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
      await s.page.waitForFunction(() => document.body.textContent.includes('Enquiry received.') || (document.querySelector('[data-mono-alert]')?.textContent || '').includes('Something went wrong'));
      assert.equal(s.activity.formRequests.length, 1); assert.equal(await count(s.page, 'generate_lead'), accepted ? 1 : 0);
      assert.equal(await count(s.page, 'form_submit_error'), accepted ? 0 : 1);
      assert.doesNotMatch(JSON.stringify(await data(s.page)), /qa@test|Test Person|Test Company|synthetic test brief|mock-reference/);
    } finally { await s.close(); }
  });
}

try {
  const { chromium } = require(require.resolve('playwright'));
  try { browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-background-networking', '--disable-dev-shm-usage'] }); }
  catch (error) { report.cases.push({ name: 'Chromium launch', status: 'blocked', error: error.message.split('\n').slice(0, 18).join('\n') }); console.error('BLOCKED Chromium could not launch. Browser cases were not executed. Run node --test tests/analytics-submissions.test.mjs for explicitly limited form-function verification.'); }
  if (browser) await browserCases();
} finally { if (browser) await browser.close(); saveReport(); }

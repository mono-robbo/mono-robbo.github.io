/** Actual Pools and Motion form scripts, executed unchanged with synthetic DOM/network adapters.
 * These verify submission logic only; they do not claim browser/bundle/render coverage.
 * Every fetch is an in-process mock. No emails, form records, or GA hits are sent.
 * Run: node --test tests/analytics-submissions.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
// A fallback for environments where Chromium cannot create its OS socket.
// It executes the source functions unchanged, with synthetic DOM/network adapters.
// It is NOT a substitute for browser rendering, bundled document replacement, or network-level verification.
function element() { const classes = new Set(), handlers = {}; return { handlers, value: '', files: [], style: {}, hidden: false, disabled: false, textContent: '', innerHTML: '', classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x), toggle: (x, yes) => yes ? classes.add(x) : classes.delete(x) }, addEventListener(name, handler) { handlers[name] = handler; }, showModal() {}, scrollTo() {}, focus() {}, setAttribute() {}, removeAttribute() {}, append() {}, checkValidity() { return /^.+@.+\..+$/.test(this.value); } }; }
function formHarness(kind, mode) {
  const nodes = new Map(), node = s => { if (!nodes.has(s)) nodes.set(s, element()); return nodes.get(s); };
  const events = [], requests = [];
  const panels = Array.from({ length: 5 }, element);
  const document = { querySelector: node, querySelectorAll: s => s === '.panel' ? panels : [], body: { style: {} }, createElement: element, referrer: '' };
  const storage = new Map();
  const context = { console, document, URL, URLSearchParams, Date, Uint8Array, JSON, Promise, String, Error, btoa: x => Buffer.from(x, 'binary').toString('base64'), location: { href: 'https://monohq.co/motion-graphics/', search: '', pathname: '/motion-graphics/' }, sessionStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) }, MONOAnalytics: { track: (name, props) => events.push({ name, props }), lead: id => events.push({ name: 'generate_lead', props: { form_id: id } }) }, MONO_FORM_CONFIG: { endpoint: 'https://form.test.invalid' }, fetch: async (...args) => { requests.push(args[0]); await wait(10); if (mode === 'network') throw Error('Mock network failure'); return { ok: mode !== 'http-error', status: mode === 'http-error' ? 500 : 202, json: async () => { if (mode === 'malformed') throw Error('Mock malformed response'); return mode === 'empty' ? {} : mode === 'rejected' ? { ok: false, error: 'Mock rejection' } : { ok: true, id: 'mock-reference' }; } }; }, FormData: class { constructor() {} delete() {} append() {} }, DCLogic: class { setState(next) { this.state = { ...this.state, ...next }; } } };
  context.window = context; vm.createContext(context);
  if (kind === 'Pools') {
    const script = [...read('visualise/pools/intake.html').matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
    vm.runInContext(script, context);
    for (const [s, v] of [['#name', 'Test Person'], ['#company', 'Test Company'], ['#email', 'qa@test.invalid'], ['#shape', 'Rectangular'], ['#size', '8 x 4']]) node(s).value = v;
    const upload = { name: 'test.png', type: 'image/png', size: 3, arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer };
    node('#referenceFiles').files = [upload]; context.__testUpload = upload;
    vm.runInContext('step = 4; siteFiles = [__testUpload];', context);
    return { events, requests, nodes, context, run: code => vm.runInContext(code, context), setMode: next => { mode = next; }, submit: () => vm.runInContext('submitProject()', context), validateEmpty: () => { node('#name').value = ''; vm.runInContext('step = 1;', context); node('#next').onclick(); }, success: () => node('#success').classList.contains('active') };
  }
  const source = read('motion-graphics/index.html');
  const template = JSON.parse(source.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/)[1]);
  const component = template.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
  vm.runInContext(component + '\nglobalThis.TestComponent = Component;', context);
  const instance = new context.TestComponent(); instance._mountedAt = Date.now() - 5000;
  const fields = Object.fromEntries(['name', 'email', 'company', 'project_details', 'deadline', 'website_hp'].map(k => [k, element()]));
  for (const k of Object.keys(fields)) fields[k].value = k === 'website_hp' ? '' : k === 'email' ? 'qa@test.invalid' : 'Test value';
  const event = { preventDefault() {}, currentTarget: { elements: fields, querySelector: () => null } };
  return { events, requests, nodes, context, instance, fields, setMode: next => { mode = next; }, submit: () => instance.submit(event), validateEmpty: () => { fields.name.value = ''; return instance.submit(event); }, success: () => instance.state.status === 'success' };
}

for (const kind of ['Pools', 'Motion']) {
  test(`${kind} actual script: invalid input never submits`, async () => {
    const h = formHarness(kind, 'success'); await h.validateEmpty();
    assert.equal(h.requests.length, 0); assert.equal(h.events.filter(x => x.name === 'generate_lead').length, 0);
  });
  for (const mode of ['success', 'http-error', 'network', 'malformed', 'rejected', 'empty']) test(`${kind} actual script: ${mode} and repeat guard`, async () => {
    // Formspree documents response.ok (HTTP 2xx) as accepted. Pools' own worker additionally requires {ok:true}.
    const accepted = kind === 'Motion' ? !['http-error', 'network'].includes(mode) : mode === 'success';
    const h = formHarness(kind, mode); await Promise.all([h.submit(), h.submit(), h.submit()]);
    assert.equal(h.requests.length, 1, 'concurrent clicks must send once'); assert.equal(h.success(), accepted);
    assert.equal(h.events.filter(x => x.name === 'generate_lead').length, accepted ? 1 : 0);
    assert.equal(h.events.filter(x => x.name === 'form_submit_attempt').length, 1);
    assert.equal(h.events.filter(x => x.name === 'form_submit_error').length, accepted ? 0 : 1);
    if (accepted) { await h.submit(); assert.equal(h.requests.length, 1); assert.equal(h.events.filter(x => x.name === 'generate_lead').length, 1); }
    assert.doesNotMatch(JSON.stringify(h.events), /qa@test|Test value|Test Person|test\.png|mock-reference/);
  });
  for (const mode of ['http-error', 'network', ...(kind === 'Pools' ? ['malformed', 'rejected', 'empty'] : [])]) test(`${kind} actual script: ${mode} can retry successfully once`, async () => {
    const h = formHarness(kind, mode); await h.submit(); assert.equal(h.success(), false);
    h.setMode('success'); await Promise.all([h.submit(), h.submit()]); assert.equal(h.success(), true);
    assert.equal(h.requests.length, 2); assert.equal(h.events.filter(x => x.name === 'generate_lead').length, 1);
    assert.equal(h.events.filter(x => x.name === 'form_submit_attempt').length, 2);
    assert.equal(h.events.filter(x => x.name === 'form_submit_error').length, 1);
    await h.submit(); assert.equal(h.requests.length, 2);
  });
}

for (const [label, setup, expected] of [
  ['invalid email', h => { h.nodes.get('#email').value = 'invalid'; h.run('step = 1'); }, /valid email/],
  ['no site photos', h => h.run('step = 2; siteFiles = []'), /site photos/],
  ['no shape', h => { h.nodes.get('#shape').value = ''; h.run('step = 3'); }, /pool shape/],
  ['no reference', h => { h.nodes.get('#referenceFiles').files = []; h.run('step = 3'); }, /reference image/],
  ['unsupported upload type', h => h.run("siteFiles[0].type = 'text/plain'"), /Use JPG/],
  ['oversize uploads', h => h.run('siteFiles[0].size = 13 * 1024 * 1024'), /12 MB/]
]) test(`Pools actual wizard validation: ${label}`, async () => {
  const h = formHarness('Pools', 'success'); setup(h); h.nodes.get('#next').onclick();
  assert.equal(h.requests.length, 0); assert.match(h.nodes.get('#error').textContent, expected);
  assert.equal(h.events.filter(x => x.name === 'generate_lead').length, 0);
});
for (const action of ['back', 'close', 'escape']) test(`Pools actual wizard ${action} cannot convert`, () => {
  const h = formHarness('Pools', 'success');
  if (action === 'back') { h.nodes.get('#back').onclick(); assert.equal(h.run('step'), 3); }
  if (action === 'close') { h.nodes.get('#close').onclick(); assert.equal(h.context.location.href, './index.html'); }
  if (action === 'escape') { let prevented = false; h.nodes.get('#intake').handlers.cancel({ preventDefault() { prevented = true; } }); assert.equal(prevented, true); assert.equal(h.context.location.href, './index.html'); }
  assert.equal(h.requests.length, 0); assert.equal(h.events.filter(x => x.name === 'generate_lead').length, 0);
});
for (const reason of ['honeypot', 'minimum elapsed time', 'missing endpoint']) test(`Motion actual form guard: ${reason}`, async () => {
  const h = formHarness('Motion', 'success');
  if (reason === 'honeypot') h.fields.website_hp.value = 'synthetic spam';
  if (reason === 'minimum elapsed time') h.instance._mountedAt = Date.now();
  if (reason === 'missing endpoint') h.context.MONO_FORM_CONFIG.endpoint = '';
  await h.submit(); assert.equal(h.requests.length, 0); assert.equal(h.events.filter(x => x.name === 'generate_lead').length, 0);
});

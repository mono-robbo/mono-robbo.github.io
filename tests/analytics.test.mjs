import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { stages } from '../deep-tech/offers.js';
const root = resolve(import.meta.dirname, '..');
const code = readFileSync(resolve(root, 'assets/analytics.js'), 'utf8');
function harness({ url = 'https://monohq.co/deep-tech/', optOut = false, disabled = false, storageBlocked = false, historyBlocked = false, referrer = '', visibility = 'visible', sections = [] } = {}) {
  const handlers = {}, storage = new Map(optOut ? [['mono_analytics_opt_out', '1']] : []), scripts = [];
  let now = 0, nextTimer = 0;
  const timers = new Map(), observers = [];
  const document = { referrer, title: 'MONO', visibilityState: visibility,
    querySelectorAll: selector => selector === '[data-analytics-section]' ? sections : sections.filter(s => s.getAttribute('data-analytics-contact')),
    addEventListener: (name, callback) => { handlers[name] = callback; },
    createElement: () => ({ isConnected: false }),
    head: { appendChild: element => { element.isConnected = true; if (!scripts.includes(element)) scripts.push(element); } } };
  class IntersectionObserver { constructor(fn) { this.callback = fn; observers.push(this); } observe() {} unobserve() {} }
  const win = { document, location: new URL(url), URL, URLSearchParams, Set, WeakSet, Date, Object, Number,
    localStorage: { getItem: key => { if (storageBlocked) throw Error(); return storage.get(key); } },
    history: { state: { keep: true }, replaceState: (_state, _title, href) => { if (historyBlocked) throw Error(); win.location = new URL(href); } },
    MutationObserver: class { observe() {} }, IntersectionObserver, requestAnimationFrame: fn => fn(),
    addEventListener: (name, callback) => { handlers[name] = callback; },
    'ga-disable-G-NHGGBL110F': disabled, innerWidth: 1200, innerHeight: 800,
    performance: { now: () => now },
    setInterval: (fn, every) => { const id = ++nextTimer; timers.set(id, { fn, every, due: now + every }); return id; },
    clearInterval: id => timers.delete(id) };
  win.window = win;
  vm.createContext(win); vm.runInContext(code, win);
  const advance = ms => {
    const end = now + ms;
    while (true) {
      const next = [...timers.values()].filter(t => t.due <= end).sort((a, b) => a.due - b.due)[0];
      if (!next) break;
      now = next.due; next.due += next.every; next.fn();
    }
    now = end;
  };
  return { win, scripts, handlers, storage, timers, observers, sections, advance,
    elapse: ms => { now += ms; },
    visibility: state => { document.visibilityState = state; handlers.visibilitychange?.(); },
    run: () => vm.runInContext(code, win),
    events: () => Array.from(win.dataLayer || []).filter(row => row[0] === 'event'),
    configs: () => Array.from(win.dataLayer || []).filter(row => row[0] === 'config') };
}
test('one loader and config on repeat boot; one configured pageview, no manual duplicate', () => {
  const h=harness(); h.run(); h.win.MONOAnalytics.refresh();
  assert.equal(h.scripts.length, 1); assert.equal(h.configs().length, 1);
  assert.equal(h.configs()[0][2].send_page_view, true);
  assert.equal(h.events().filter(e => e[1] === 'page_view').length, 0);
});
test('unknown query/hash and referrer paths never reach config or custom events', () => {
  const h=harness({ url:'https://monohq.co/deep-tech/?email=person%40test.invalid&q=Private+Brief#private-person', referrer:'https://example.test/person?email=person@test.invalid' });
  assert.equal(h.win.location.href, 'https://monohq.co/deep-tech/');
  const cfg=h.configs()[0][2]; assert.equal(cfg.page_referrer, 'https://example.test/');
  h.win.MONOAnalytics.track('email_click', {method:'email', email:'person@test.invalid', name:'Private Person', page_location:'https://bad.test/?private=1', enquiry_reference:'secret', current_src:'private-project.jpg'});
  const serialized=JSON.stringify(h.win.dataLayer);
  assert.doesNotMatch(serialized, /person@test|Private|secret|bad\.test|private-project/);
  assert.equal(h.events()[0][2].method, 'email');
});
test('controlled pool attribution survives and duplicate query values are rejected', () => {
  const h=harness({ url:'https://monohq.co/visualise/pools/?utm_source=mono_outreach&utm_medium=email&utm_campaign=2026q3_pool99_batch02&outreach_variant=control&email=person%40test.invalid#package' });
  assert.equal(h.configs()[0][2].campaign_name, '2026q3_pool99_batch02');
  assert.equal(h.win.location.hash, '#package'); assert.equal(h.events()[0][1], 'outreach_landing');
  const bad=harness({ url:'https://monohq.co/?utm_source=mono_outreach&utm_source=other&utm_medium=email&utm_campaign=2026q3_pool99_batch02' });
  assert.equal(bad.win.location.search, ''); assert.equal(bad.events().length, 0);
});
test('local, preview, file, unknown and opted-out pages never initialize Google', () => {
  for (const options of [{optOut:true},{disabled:true},{url:'http://localhost:4173/deep-tech/'},{url:'http://127.0.0.1:4173/'},{url:'http://[::1]/'},{url:'file:///deep-tech/index.html'},{url:'https://preview.test/deep-tech/'},{url:'https://monohq.co/private-person/'}]) {
    const h=harness(options); h.win.MONOAnalytics.track('email_click',{method:'email'}); assert.equal(h.scripts.length,0); assert.equal(h.configs().length,0); assert.equal(h.events().length,0);
  }
});
test('blocked storage stays usable; failed URL sanitization fails closed', () => {
  assert.equal(harness({storageBlocked:true}).configs().length,1);
  const h=harness({url:'https://monohq.co/?email=private@test.invalid',historyBlocked:true});
  assert.equal(h.configs().length,0); assert.equal(h.scripts.length,0);
});
test('same-tab and cross-tab opt-out stop future custom events', () => {
  const h=harness(); h.storage.set('mono_analytics_opt_out','1'); h.win.MONOAnalytics.track('email_click'); assert.equal(h.events().length,0); assert.equal(h.win['ga-disable-G-NHGGBL110F'],true);
  const other=harness(); other.handlers.storage({key:'mono_analytics_opt_out',newValue:'1'}); other.win.MONOAnalytics.track('email_click'); assert.equal(other.events().length,0);
  const immediate=harness(); immediate.win.MONOAnalytics.disable(); immediate.win.MONOAnalytics.track('email_click'); assert.equal(immediate.events().length,0);
});
test('mailto and contact navigation are intent, never completed leads', () => {
  const h=harness();
  for (const href of ['mailto:private@test.invalid?body=Private+brief','#talk']) h.handlers.click({target:{closest:()=>({getAttribute:()=>href})}});
  assert.deepEqual(Array.from(h.events(),e=>e[1]), ['email_click','contact_intent']);
  assert.doesNotMatch(JSON.stringify(h.events()), /private|Private|generate_lead/);
});
test('lead and first interaction dedupe; unknown form cannot become lead', () => {
  const h=harness(); for(let i=0;i<3;i++){h.win.MONOAnalytics.lead('pool-project-intake');h.win.MONOAnalytics.start('pool-project-intake');h.win.MONOAnalytics.lead('unknown-form');}
  assert.deepEqual(Array.from(h.events(),e=>e[1]), ['generate_lead','enquiry_start']);
});
test('reattaches the same tag after document replacement without reconfiguration', () => {
  const h=harness(); h.scripts[0].isConnected=false; h.win.MONOAnalytics.refresh();
  assert.equal(h.scripts.length,1); assert.equal(h.configs().length,1); assert.equal(h.scripts[0].isConnected,true);
});
function files(dir) { return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name.startsWith('.')?[]:e.isDirectory()?files(resolve(dir,e.name)):[resolve(dir,e.name)]); }
test('every public HTML entry includes exactly one shared tracker; utility and redirect excluded', () => {
  const html=files(root).filter(f=>f.endsWith('.html')); assert.equal(html.length,16);
  for(const file of html){const source=readFileSync(file,'utf8');const excluded=/(?:internal-analytics|sennheiser-case-study)\.html$/.test(file);
    assert.equal((source.match(/src="\/assets\/analytics\.js\?/g)||[]).length,excluded?0:1,file);
    assert.doesNotMatch(source,/googletagmanager\.com|G-NHGGBL110F/,file);
  }
});
test('syntax-check executable scripts, including the decoded Motion Graphics template', () => {
  for(const file of files(root).filter(f=>f.endsWith('.html'))){
    const source=readFileSync(file,'utf8');
    const embedded=source.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
    for(const html of [source, ...(embedded?[JSON.parse(embedded[1])]:[])]) {
      for(const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
        if(/type=/.test(match[1])||/src=/.test(match[1]))continue;
        new vm.Script(match[2],{filename:file});
      }
    }
  }
});
test('trade cohorts remain all-or-nothing and homepage labels remain consistent', () => {
  const invalid = harness({url:'https://monohq.co/visualise/?utm_source=mono_outreach&utm_medium=email&utm_campaign=2026q3_pool99_batch02'});
  assert.equal(invalid.events().length,0); assert.equal(invalid.win.location.search,'');
  const qs=new URLSearchParams({utm_source:'mono_outreach',utm_medium:'email',utm_campaign:'2026q3_trade_visualisation',utm_id:'mo_2026q3_002',utm_content:'d0_initial_offer_control',outreach_country:'au',outreach_industry:'builder',outreach_persona:'owner',outreach_cadence_step:'d0_initial',outreach_test_variable:'offer',outreach_variant:'control',outreach_batch_id:'mo_2026w38_01'});
  const valid=harness({url:'https://monohq.co/visualise/?'+qs}); assert.equal(valid.events()[0][1],'outreach_landing');
  qs.delete('outreach_persona'); assert.equal(harness({url:'https://monohq.co/visualise/?'+qs}).events().length,0);
  const home=harness({url:'https://monohq.co/?utm_source=mono_outreach&utm_medium=email&utm_campaign=2026q3_agency_manager_demo&outreach_industry=telco&outreach_persona=director&utm_content=d0_initial_none_a&outreach_cadence_step=d0_initial&outreach_test_variable=none&outreach_variant=control'});
  assert.equal(home.win.MONOAnalytics.context.utm_campaign,undefined); assert.equal(home.win.MONOAnalytics.context.utm_content,undefined);
});
test('bounded opaque Google click IDs survive without accepting freeform identifiers', () => {
  const token='EAIaIQobChMI1234567890_ab-CD';
  for(const key of ['gclid','gbraid','wbraid']) {
    const h=harness({url:'https://monohq.co/?'+key+'='+token+'&email=private%40test.invalid'});
    assert.equal(new URL(h.configs()[0][2].page_location).searchParams.get(key),token);
    assert.equal(h.win.MONOAnalytics.context[key],undefined);
    assert.equal(h.win.location.searchParams.get('email'),null);
    for(const invalid of ['private@test.invalid','Private Person','short','a'.repeat(257)]) {
      const bad=harness({url:'https://monohq.co/?'+key+'='+encodeURIComponent(invalid)});
      assert.equal(bad.win.location.search,'');
    }
    const duplicate=harness({url:'https://monohq.co/?'+key+'='+token+'&'+key+'='+token});
    assert.equal(duplicate.win.location.search,'');
  }
});
test('retired Water Water page and assets are absent', () => {
  for (const file of ['index.html','app.js','motion.css','styles.css','assets/hero.jpg']) {
    assert.throws(() => readFileSync(resolve(root,'water-water',file)));
  }
  assert.equal(harness({url:'https://monohq.co/water-water/'}).configs().length,0);
});
test('both bundle replay loops skip the already-live shared Google loader', () => {
  const h=harness(); assert.equal(h.scripts[0].id,'mono-ga4-loader');
  for(const file of ['index.html','motion-graphics/index.html']) {
    const source=readFileSync(resolve(root,file),'utf8');
    assert.match(source,/for \(const old of dead\) \{\s*\/\/[^\n]*\n\s*if \(old\.id === 'mono-ga4-loader'\) continue;/);
  }
});

function section(id, rect = { top: 100, bottom: 400, left: 0, right: 1000 }, contact = false) {
  return { id: '', rect, getBoundingClientRect() { return this.rect; },
    getAttribute: key => key === 'data-analytics-section' ? id : key === 'data-analytics-contact' && contact ? id : null };
}
const reaches = h => h.events().filter(e => e[1] === 'deeptech_section_reached');
const dwell = h => h.events().filter(e => e[1] === 'deeptech_dwell');
const totalDwell = h => dwell(h).reduce((total, row) => total + row[2].visible_time_ms, 0);
test('deep-tech marks all eight meaningful sections, including both rendered foundations', () => {
  const html = readFileSync(resolve(root, 'deep-tech/index.html'), 'utf8');
  const client = readFileSync(resolve(root, 'deep-tech/deep-tech.js'), 'utf8');
  assert.deepEqual([...html.matchAll(/data-analytics-section="([a-z-]+)"/g)].map(m => m[1]),
    ['deep-tech-hero', 'deep-tech-present', 'deep-tech-support', 'deep-tech-credentials', 'deep-tech-keep-building', 'deep-tech-contact']);
  assert.deepEqual(stages.map(s => s.id), ['who', 'how']);
  assert.match(client, /data-analytics-section="deep-tech-\$\{stage.id\}"/);
  assert.equal((html.match(/<section\b/g) || []).length, 6);
});
test('section reaches deduplicate repeated scroll, refresh, reinjection and replacement by stable ID', () => {
  const h = harness({ sections: [section('deep-tech-hero')] });
  for (let i = 0; i < 3; i++) { h.handlers.scroll(); h.handlers.resize(); h.win.MONOAnalytics.refresh(); h.run(); }
  h.sections[0].rect.top = 900; h.handlers.scroll();
  h.sections[0].rect.top = 100; h.handlers.scroll();
  h.sections[0] = section('deep-tech-hero'); h.win.MONOAnalytics.refresh();
  h.sections.push(section('deep-tech-who'), section('deep-tech-how'), section('unapproved-person'));
  h.win.MONOAnalytics.refresh();
  assert.deepEqual(reaches(h).map(e => e[2].section_id), ['deep-tech-hero', 'deep-tech-who', 'deep-tech-how']);
  assert.equal(h.timers.size, 1); assert.equal(h.configs().length, 1);
});
test('section reach requires one CSS pixel in both axes and supports very tall sections', () => {
  const target = section('deep-tech-who', { top: 800, bottom: 50000, left: 0, right: 1000 });
  const h = harness({ sections: [target] }); assert.equal(reaches(h).length, 0);
  target.rect.top = 799.5; h.handlers.scroll(); assert.equal(reaches(h).length, 0);
  target.rect.top = 799; h.handlers.scroll(); assert.equal(reaches(h).length, 1);
  const side = section('deep-tech-how', { top: 0, bottom: 50000, left: 1200, right: 2000 });
  h.sections.push(side); h.win.MONOAnalytics.refresh(); assert.equal(reaches(h).length, 1);
  side.rect.left = 1199; h.handlers.resize(); assert.equal(reaches(h).length, 2);
});
test('section reaching while hidden or cached is ignored and visible resumption checks current geometry', () => {
  const target = section('deep-tech-hero'); const h = harness({ visibility: 'hidden', sections: [target] });
  h.handlers.scroll(); assert.equal(reaches(h).length, 0);
  target.rect.top = 900; h.visibility('visible'); assert.equal(reaches(h).length, 0);
  target.rect.top = 100; h.handlers.scroll(); assert.equal(reaches(h).length, 1);
  h.handlers.pagehide({ persisted: true }); h.sections.push(section('deep-tech-who'));
  h.handlers.scroll(); h.visibility('visible'); assert.equal(reaches(h).length, 1);
  h.handlers.pageshow({ persisted: true }); assert.equal(reaches(h).length, 2);
  h.handlers.pageshow({ persisted: true }); assert.equal(reaches(h).length, 2);
});
test('contact has one new reach and one existing contact event with its original stable ID', () => {
  const target = section('deep-tech-contact', undefined, true);
  const h = harness({ sections: [target] });
  for (let i = 0; i < 3; i++) { h.observers[0].callback([{ target, isIntersecting: true }]); h.handlers.scroll(); }
  assert.deepEqual(h.events().map(e => [e[1], e[2].section_id]),
    [['deeptech_section_reached', 'deep-tech-contact'], ['contact_section_view', 'deep-tech-contact']]);
  assert.equal(h.events().filter(e => e[1] === 'generate_lead').length, 0);
});
test('visible dwell is additive, flushed every 15s and on pagehide without reserved GA fields', () => {
  const h = harness(); h.advance(14999); assert.equal(dwell(h).length, 0);
  h.advance(1); h.advance(15000); h.advance(5000); h.handlers.pagehide({ persisted: false });
  assert.deepEqual(dwell(h).map(e => [e[2].visible_time_ms, e[2].dwell_reason]), [[15000, 'interval'], [15000, 'interval'], [5000, 'pagehide']]);
  assert.equal(totalDwell(h), 35000); assert.equal(h.timers.size, 0);
  assert.doesNotMatch(JSON.stringify(h.events()), /engagement_time_msec|user_engagement/);
});
test('hidden time is excluded; repeated lifecycle events do not duplicate elapsed time', () => {
  const h = harness(); h.advance(5000); h.visibility('hidden'); h.visibility('hidden'); h.handlers.pagehide({ persisted: true });
  assert.equal(h.timers.size, 0); h.advance(120000); assert.equal(totalDwell(h), 5000);
  h.handlers.pageshow({ persisted: true }); assert.equal(h.timers.size, 0);
  h.visibility('visible'); h.visibility('visible'); h.handlers.pageshow({ persisted: true });
  assert.equal(h.timers.size, 1); h.advance(3000); h.visibility('hidden');
  assert.deepEqual(dwell(h).map(e => e[2].visible_time_ms), [5000, 3000]);
});
test('pagehide pauses even if visibility still says visible; bfcache restore resumes without pageview', () => {
  const h = harness(); h.advance(4000); h.handlers.pagehide({ persisted: true });
  h.elapse(600000); h.visibility('visible'); h.handlers.scroll(); assert.equal(h.timers.size, 0);
  h.handlers.pagehide({ persisted: true }); assert.equal(totalDwell(h), 4000);
  h.handlers.pageshow({ persisted: true }); h.advance(6000); h.handlers.pagehide({ persisted: true });
  assert.equal(totalDwell(h), 10000); assert.equal(h.configs().length, 1);
});
test('initial hidden page and repeated initial pageshow do not invent dwell or reset the clock', () => {
  const h = harness({ visibility: 'hidden' }); h.advance(60000); h.handlers.pageshow({ persisted: false });
  assert.equal(h.timers.size, 0); assert.equal(dwell(h).length, 0);
  h.visibility('visible'); h.advance(5000); h.handlers.pageshow({ persisted: false });
  h.advance(10000); assert.equal(totalDwell(h), 15000); assert.equal(h.timers.size, 1);
});
test('sub-millisecond remainder survives repeated pause/resume; zero-length events never send', () => {
  const h = harness(); h.handlers.pageshow({ persisted: false }); h.visibility('hidden'); assert.equal(dwell(h).length, 0);
  for (let i = 0; i < 4; i++) { h.visibility('visible'); h.advance(0.75); h.visibility('hidden'); }
  assert.equal(totalDwell(h), 3); assert.equal(dwell(h).length, 3);
});
test('dwell uses elapsed monotonic time rather than assuming timers fired on time; quiet reading counts', () => {
  const h = harness(); h.elapse(45000); [...h.timers.values()][0].fn();
  h.handlers.pagehide({ persisted: false }); assert.equal(totalDwell(h), 45000);
  assert.deepEqual(dwell(h).map(e => e[2].visible_time_ms), [45000]);
});
test('opt-out discards unsent dwell and stops its timer across direct, storage and local choices', () => {
  for (const mode of ['direct', 'storage', 'local']) {
    const h = harness(); h.advance(10000);
    if (mode === 'direct') h.win.MONOAnalytics.disable();
    if (mode === 'storage') h.handlers.storage({ key: 'mono_analytics_opt_out', newValue: '1' });
    if (mode === 'local') h.storage.set('mono_analytics_opt_out', '1');
    h.advance(5000); h.visibility('hidden'); h.handlers.pagehide({ persisted: true });
    h.visibility('visible'); h.handlers.pageshow({ persisted: true });
    h.sections.push(section('deep-tech-who')); h.win.MONOAnalytics.refresh();
    assert.equal(totalDwell(h), 0); assert.equal(reaches(h).length, 0); assert.equal(h.timers.size, 0);
  }
});
test('new measurement stays deep-tech-only and respects preview and initial opt-out gates', () => {
  for (const options of [{ url: 'https://monohq.co/' }, { url: 'https://monohq.co/rollout/' },
    { url: 'http://localhost:4173/deep-tech/' }, { optOut: true }, { disabled: true }]) {
    const h = harness({ ...options, sections: [section('deep-tech-hero')] }); h.advance(30000);
    h.handlers.pagehide?.({ persisted: false }); assert.equal(dwell(h).length, 0); assert.equal(reaches(h).length, 0); assert.equal(h.timers.size, 0);
  }
});
test('new event parameters retain URL sanitization and reject arbitrary strings or reserved metrics', () => {
  const h = harness({ url: 'https://monohq.co/deep-tech/?email=private%40test.invalid#secret', sections: [section('deep-tech-hero')] });
  h.win.MONOAnalytics.track('deeptech_dwell', { visible_time_ms: -1, dwell_reason: 'private@test.invalid', engagement_time_msec: 50, page_location: 'private' });
  h.advance(20000); h.visibility('hidden');
  assert.equal(dwell(h)[0][2].visible_time_ms, undefined); assert.equal(dwell(h)[0][2].dwell_reason, undefined);
  assert.doesNotMatch(JSON.stringify(h.win.dataLayer), /private|secret|engagement_time_msec/);
  for (const row of h.events()) assert.equal(row[2].page_location, 'https://monohq.co/deep-tech/');
});

test('discovering same-tab opt-out through an API call immediately clears pending timer', () => {
  const h = harness(); h.advance(10000); h.storage.set('mono_analytics_opt_out', '1');
  h.win.MONOAnalytics.track('email_click'); assert.equal(h.timers.size, 0);
  h.advance(10000); assert.equal(totalDwell(h), 0);
});

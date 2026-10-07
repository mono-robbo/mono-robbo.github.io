/* Shared MONO GA4. Keep form values, contact identifiers and arbitrary URLs out. */
(function (window, document) {
  'use strict';
  if (window.MONOAnalytics) { window.MONOAnalytics.refresh(); return; }
  const measurementId = 'G-NHGGBL110F';
  const production = /^(?:www\.)?monohq\.co$/.test(location.hostname) && location.protocol === 'https:';
  const knownPaths = new Set(['/', '/deep-tech/', '/visualise/', '/visualise/uk/', '/visualise/us/',
    '/visualise/pools/', '/visualise/pools/intake.html', '/visualise/pools/privacy.html',
    '/visualise/pools/terms.html', '/visualise/pools-wip/', '/wip-page/', '/rollout/',
    '/motion-graphics/', '/earth-ai/']);
  const path = location.pathname.replace(/\/index\.html$/, '/');
  const eligible = production && knownPaths.has(path);
  const params = new URLSearchParams(location.search);
  const one = key => params.getAll(key).length === 1 ? params.get(key) : '';
  // Preserve each existing landing-page campaign contract. A regex match alone
  // does not prove that persona, campaign and content belong to the same cohort.
  const context = {};
  const isOutreach = one('utm_source') === 'mono_outreach' && one('utm_medium') === 'email';
  const trade = /^\/visualise\/(?:uk\/|us\/)?$/.test(path);
  const pool = /^\/visualise\/pools(?:-wip)?\//.test(path) || path === '/wip-page/';
  const take = (rules, target = context) => {
    for (const [key, pattern] of Object.entries(rules)) {
      const value = one(key);
      if (value && value.length <= 96 && pattern.test(value)) target[key] = value;
    }
  };
  if (pool) {
    take({
      utm_source: /^mono_outreach$/, utm_medium: /^email$/,
      utm_campaign: /^(?:2026q3_pool_99|2026q3_pool99_batch02)$/,
      utm_id: /^mo_pool99_(?:01|\d{3})$/, utm_content: /^(?:control|challenger|challenge)$/,
      outreach_country: /^au$/, outreach_industry: /^(?:pool_installer|pool_builder)$/,
      outreach_variant: /^(?:control|challenger|challenge)$/,
      outreach_batch_id: /^mo_2026w[0-9]{2}_[0-9]{2}$/
    });
  } else if (trade) {
    const fixed = { utm_source: 'mono_outreach', utm_medium: 'email',
      utm_campaign: '2026q3_trade_visualisation', utm_id: 'mo_2026q3_002' };
    const rules = {
      outreach_country: /^(?:au|nz|uk|us)$/, outreach_industry: /^(?:builder|landscaper|pool_installer)$/,
      outreach_persona: /^owner$/, outreach_cadence_step: /^(?:d0_initial|d2_followup_1|d4_followup_2|d6_followup_3)$/,
      outreach_test_variable: /^(?:offer|subject|cta|none)$/, outreach_variant: /^(?:control|a|b)$/,
      outreach_batch_id: /^mo_2026w38_(?:0[1-9]|[1-9][0-9])$/
    };
    const cohort = {}; take(rules, cohort);
    const content = [cohort.outreach_cadence_step, cohort.outreach_test_variable, cohort.outreach_variant].join('_');
    if (Object.entries(fixed).every(([key, value]) => one(key) === value) &&
      Object.keys(rules).every(key => cohort[key]) && one('utm_content') === content) {
      Object.assign(context, fixed, cohort, { utm_content: content });
    }
  } else if (isOutreach) {
    take({
      outreach_persona: /^(?:manager|director|executive)$/,
      outreach_industry: /^(?:consumer_electronics|telco|fmcg|retailer|agency)$/,
      outreach_cadence_step: /^(?:d0_initial|d2_followup_1|d4_followup_2|d6_followup_3)$/,
      outreach_test_variable: /^(?:none|subject|cta|priority_stack)$/, outreach_variant: /^(?:control|a|b)$/,
      outreach_batch_id: /^mo_20\d{2}w(?:0[1-9]|[1-4]\d|5[0-3])_(?:0[1-9]|[1-9]\d)$/
    });
    context.utm_source = 'mono_outreach'; context.utm_medium = 'email';
    const campaign = one('utm_campaign');
    const match = /^(20\d{2}q[1-4])_(consumer_electronics|telco|fmcg|retailer|agency)_(manager|director|executive)_[a-z][a-z0-9]{0,19}(?:_[a-z0-9]{1,20}){0,2}$/.exec(campaign);
    if (campaign.length <= 96 && match && match[2] === context.outreach_industry && match[3] === context.outreach_persona) {
      context.utm_campaign = campaign;
      const id = one('utm_id'); const idMatch = /^mo_(20\d{2}q[1-4])_\d{3}$/.exec(id);
      if (idMatch && idMatch[1] === match[1]) context.utm_id = id;
    }
    const content = [context.outreach_cadence_step, context.outreach_test_variable, context.outreach_variant];
    if (content.every(Boolean) && one('utm_content') === content.join('_')) context.utm_content = content.join('_');
  }
  window.__monoOutreachContext = Object.freeze({ ...context });
  const safeLocation = new URL(path, production ? location.origin : 'https://monohq.co');
  for (const [key, value] of Object.entries(context)) safeLocation.searchParams.set(key, value);
  // Google Ads auto-tagging uses opaque click IDs, not free-form campaign text.
  // Keep them in the sanitized landing URL only, not as custom event dimensions.
  for (const key of ['gclid', 'gbraid', 'wbraid']) {
    const token = one(key);
    if (token && /^[A-Za-z0-9_-]{20,256}$/.test(token)) safeLocation.searchParams.set(key, token);
  }
  let referrer = '';
  try { const ref = new URL(document.referrer); if (/^https?:$/.test(ref.protocol)) referrer = ref.origin + '/'; } catch (_) {}
  const page = { page_location: safeLocation.href, page_referrer: referrer, page_path: path };
  let configured = false;
  let tag;
  let observer;
  let refreshPending = false;
  let refreshDeepTech = () => {};
  let stopDeepTech = () => {};
  const seenSections = new Set();
  const seenForms = new Set();
  const completedForms = new Set();
  const observedSections = new WeakSet();
  const formIds = new Set(['pool-project-intake', 'pool-sample-request', 'motion-graphics-enquiry']);
  function optedOut() {
    let disabled = !eligible || window['ga-disable-' + measurementId] === true || window.__monoAnalyticsDisabled === true;
    try { disabled ||= localStorage.getItem('mono_analytics_opt_out') === '1'; } catch (_) {}
    if (disabled) { window['ga-disable-' + measurementId] = true; stopDeepTech(); }
    return disabled;
  }
  function disable() {
    window['ga-disable-' + measurementId] = true;
    window.__monoAnalyticsDisabled = true;
    stopDeepTech();
  }
  // Only these developer-controlled fields can leave through the shared API.
  const stringFields = new Set(['offer_id', 'page_version', 'method', 'form_id', 'section_id', 'section',
    'placement', 'cta', 'destination', 'film_id', 'media_type', 'media_id', 'action', 'document_type',
    'faq_id', 'finish_id', 'content_type', 'content_id', 'connection_type', 'error_type', 'dwell_reason']);
  const numberFields = new Set(['seconds', 'percent', 'percent_scrolled', 'startup_ms', 'position_seconds',
    'duration_seconds', 'from_seconds', 'buffer_ms', 'playback_rate', 'media_error_code', 'network_state', 'ready_state', 'step', 'visible_time_ms']);
  const events = new Set(['earthai_video_summary', 'earthai_cta_click', 'earthai_dwell', 'earthai_page_loaded', 'earthai_scroll_depth', 'earthai_section_view', 'earthai_video_buffer', 'earthai_video_close', 'earthai_video_complete', 'earthai_video_error', 'earthai_video_fallback', 'earthai_video_fullscreen', 'earthai_video_open', 'earthai_video_pause', 'earthai_video_play_blocked', 'earthai_video_progress', 'earthai_video_rate', 'earthai_video_request', 'earthai_video_resume', 'earthai_video_seek', 'earthai_video_start', 'earthai_video_volume', 'deeptech_section_reached', 'deeptech_dwell', 'outreach_landing', 'contact_intent', 'contact_section_view', 'email_click',
    'enquiry_start', 'form_step_view', 'form_submit_attempt', 'form_submit_error', 'generate_lead', 'view_more_work', 'select_content',
    'pool_page_loaded', 'pool_time_on_page', 'pool_video_request', 'pool_hero_video_play', 'pool_package_media_view',
    'pool_package_video_play', 'pool_package_video_pause', 'pool_package_video_seek', 'pool_package_video_progress',
    'pool_package_video_complete', 'pool_video_error', 'pool_video_open', 'pool_video_play', 'pool_video_progress',
    'pool_video_complete', 'pool_sample_form_open', 'pool_sample_request_sent', 'pool_sample_request_error',
    'pool_offer_navigation', 'pool_email_click', 'pool_faq_open', 'pool_legal_open', 'pool_section_view', 'pool_scroll_depth',
    'pool_hero_control', 'pool_video_pause', 'pool_video_seek', 'pool_video_close', 'pool_faq_close', 'pool_finish_compare',
    'pool_finish_option', 'rollout_page_loaded', 'rollout_time_on_page', 'rollout_cta_click', 'rollout_section_view', 'rollout_proof_animation_view']);
  function track(name, props = {}) {
    if (!configured || optedOut() || !events.has(name)) return;
    const clean = {};
    for (const [key, value] of Object.entries(props)) {
      if (stringFields.has(key) && typeof value === 'string' && /^[a-z0-9_-]{1,80}$/i.test(value)) clean[key] = value;
      if (numberFields.has(key) && Number.isFinite(value) && value >= 0 && value < 1e9) clean[key] = value;
      if (['save_data', 'autoplay', 'non_interaction'].includes(key) && typeof value === 'boolean') clean[key] = value;
      if (key === 'landing_hash' && /^(?:none|#(?:package|examples|process|questions|intro))$/.test(value)) clean[key] = value;
    }
    window.gtag('event', name, { ...context, ...clean, ...page });
  }
  function lead(formId) {
    if (!formIds.has(formId) || completedForms.has(formId)) return;
    completedForms.add(formId);
    track('generate_lead', { form_id: formId, method: 'form' });
  }
  function start(formId) {
    if (!formIds.has(formId) || seenForms.has(formId)) return;
    seenForms.add(formId);
    track('enquiry_start', { form_id: formId });
  }
  const sectionSelector = '#talk, #start, #enquiry, #quote, [data-analytics-contact]';
  function refresh() {
    if (!configured || optedOut()) return;
    // The homepage and Motion Graphics replace <html>; preserve the single loader.
    if (tag && !tag.isConnected && document.head) document.head.appendChild(tag);
    refreshDeepTech();
    if (!observer) return;
    document.querySelectorAll(sectionSelector).forEach(section => {
      if (!observedSections.has(section)) { observedSections.add(section); observer.observe(section); }
    });
  }
  function initializeDeepTech() {
    if (path !== '/deep-tech/') return;
    const sectionIds = new Set(['deep-tech-hero', 'deep-tech-who', 'deep-tech-how', 'deep-tech-present',
      'deep-tech-support', 'deep-tech-credentials', 'deep-tech-keep-building', 'deep-tech-contact']);
    const reached = new Set();
    let paused = false;
    let visibleSince = null;
    let pendingMs = 0;
    let timer = null;
    let checkPending = false;
    const visible = () => !paused && document.visibilityState === 'visible';
    // Count reaching a section, not reading it. Pixel overlap works for sections
    // taller than a mobile viewport; a fraction of the whole section would not.
    refreshDeepTech = () => {
      if (!visible() || optedOut()) return;
      document.querySelectorAll('[data-analytics-section]').forEach(section => {
        const id = section.getAttribute('data-analytics-section');
        if (!sectionIds.has(id) || reached.has(id)) return;
        const rect = section.getBoundingClientRect();
        const height = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        const width = Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0);
        if (height >= 1 && width >= 1) {
          reached.add(id);
          track('deeptech_section_reached', { section_id: id });
        }
      });
    };
    const checkSections = () => {
      if (checkPending) return;
      checkPending = true;
      requestAnimationFrame(() => { checkPending = false; refreshDeepTech(); });
    };
    const clearTimer = () => { if (timer !== null) window.clearInterval(timer); timer = null; };
    stopDeepTech = () => { clearTimer(); visibleSince = null; pendingMs = 0; };
    const flush = reason => {
      if (optedOut()) { stopDeepTech(); return; }
      const now = window.performance.now();
      if (visibleSince !== null) {
        pendingMs += Math.max(0, now - visibleSince);
        visibleSince = now;
      }
      // These are non-overlapping deltas, never cumulative totals. Preserve any
      // sub-millisecond remainder across flushes. GA owns engagement_time_msec.
      const delta = Math.floor(pendingMs);
      if (delta > 0) {
        pendingMs -= delta;
        track('deeptech_dwell', { visible_time_ms: delta, dwell_reason: reason });
      }
    };
    const pause = reason => { flush(reason); visibleSince = null; clearTimer(); };
    const resume = () => {
      if (!visible() || optedOut()) return;
      if (visibleSince === null) visibleSince = window.performance.now();
      if (timer === null) timer = window.setInterval(() => {
        if (visible()) flush('interval'); else pause('hidden');
      }, 15000);
      refreshDeepTech();
    };
    document.addEventListener('visibilitychange', () => {
      if (visible()) resume(); else pause('hidden');
    });
    window.addEventListener('pagehide', () => { paused = true; pause('pagehide'); });
    window.addEventListener('pageshow', () => { paused = false; resume(); });
    window.addEventListener('scroll', checkSections, { passive: true });
    window.addEventListener('resize', checkSections, { passive: true });
    // No idle timeout: quiet reading counts while visible. This is visible-page
    // dwell, not proof of attention, and is separate from GA's engagement metric.
    resume();
  }
  window.MONOAnalytics = Object.freeze({ track, lead, start, refresh, disable, context: window.__monoOutreachContext });
  if (optedOut()) return;
  // Strip unapproved query strings and non-page anchors before Google can read
  // location independently. Preserve normal in-page navigation and history state.
  const browserLocation = new URL(safeLocation.href);
  if (/^#(?:deep-tech|main-sequence|storytelling|working-together|about|containers|enquiry|films|films-title|film-garden|film-pool|film-kitchen|how|main|offers|package|presentation-support|privacy|process|produce|quote|range|start|talk|top|trade|what|who|work|examples|questions|intro|offer)$/.test(location.hash)) browserLocation.hash = location.hash;
  if (browserLocation.href !== location.href) {
    try { history.replaceState(history.state, '', browserLocation.href); }
    catch (_) { disable(); return; }
  }
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    ...context, ...page, send_page_view: true,
    allow_google_signals: false, allow_ad_personalization_signals: false,
    ...(context.utm_source ? { campaign_source: context.utm_source, campaign_medium: context.utm_medium,
      campaign_name: context.utm_campaign, campaign_id: context.utm_id, campaign_content: context.utm_content } : {})
  });
  configured = true;
  tag = document.createElement('script');
  tag.id = 'mono-ga4-loader';
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(tag);
  if (context.utm_source) track('outreach_landing', { non_interaction: true });
  document.addEventListener('click', event => {
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (/^mailto:/i.test(href)) track('email_click', { method: 'email' });
    else if (/^#(?:talk|start|enquiry|quote|contact)$/.test(href)) track('contact_intent', { method: 'contact_section' });
  });
  document.addEventListener('input', event => {
    const form = event.target.closest && event.target.closest('form, #intake');
    if (!form) return;
    const id = form.id === 'intake' ? 'pool-project-intake' : form.hasAttribute('data-mono-form') ? 'motion-graphics-enquiry' : form.dataset.analyticsForm;
    start(id);
  });
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      const id = entry.target.id || entry.target.getAttribute('data-analytics-contact');
      if (entry.isIntersecting && !seenSections.has(id)) {
        seenSections.add(id); track('contact_section_view', { section_id: id }); observer.unobserve(entry.target);
      }
    }), { threshold: 0.15 });
  }
  new MutationObserver(() => {
    if (refreshPending) return;
    refreshPending = true;
    requestAnimationFrame(() => { refreshPending = false; refresh(); });
  }).observe(document, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', refresh);
  window.addEventListener('storage', event => { if (event.key === 'mono_analytics_opt_out' && event.newValue === '1') disable(); });
  initializeDeepTech();
  refresh();
})(window, document);

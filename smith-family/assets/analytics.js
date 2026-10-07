/* Route-owned GA4: no shared files or other MONO routes are changed. */
(() => {
  'use strict';
  if (window.SmithAnalytics) return;
  const id = 'G-NHGGBL110F';
  const local = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
  const production = /^(www\.)?monohq\.co$/.test(location.hostname) && location.protocol === 'https:' && /^\/smith-family\/(index\.html)?$/.test(location.pathname);
  const events = new Set(['page_view','smithfamily_page_loaded','smithfamily_section_view','smithfamily_section_dwell','smithfamily_dwell','smithfamily_cta_click','smithfamily_video_request','smithfamily_video_open','smithfamily_video_start','smithfamily_video_resume','smithfamily_video_progress','smithfamily_video_pause','smithfamily_video_seek','smithfamily_video_complete','smithfamily_video_buffering','smithfamily_video_error','smithfamily_video_close','smithfamily_video_play_blocked','smithfamily_image_open','smithfamily_image_close','smithfamily_video_summary','smithfamily_media_switch']);
  const textKeys = new Set(['section_id','film_id','content_id','placement','cta','action','dwell_reason','media_type']);
  const numericKeys = new Set(['visible_time_ms','position_seconds','duration_seconds','watched_seconds','percent','from_seconds','to_seconds','buffer_ms','startup_ms','media_error_code']);
  const fixedValues = new Set(['intro','note','interviews','films','motion','rollout','working-together','contact','bmrg','main-sequence-interview','advanced-navigation','newera','main-sequence-motion','sennheiser-1','sennheiser-2','sennheiser-3','sennheiser-4','hero','header','footer','lightbox','page','email_contact','phone_contact','contact_section','explore_work','mono_home','project_source','back_to_top','section_navigation','close_button','escape','backdrop','back','switch','pagehide','hidden','interval','started','ended','play','pause','retry','next','previous','film','image','blocked','disabled']);
  let disabled = window['ga-disable-' + id] === true || window.__monoAnalyticsDisabled === true;
  try { disabled ||= localStorage.getItem('mono_analytics_opt_out') === '1'; } catch (_) {}
  const logs = [];
  let logNode;
  if (local) {
    logNode = document.createElement('script'); logNode.id = 'smithfamily-debug-events'; logNode.type = 'application/json'; logNode.textContent = '[]'; document.body.append(logNode);
  }
  // Never retain arbitrary query strings, fragments, referrers or titles in GA.
  const page = { page_location:'https://monohq.co/smith-family/', page_path:'/smith-family/', page_title:'MONO | Selected production work', page_referrer:'' };
  if (production && location.search) history.replaceState(history.state, '', location.pathname + location.hash);
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function() { window.dataLayer.push(arguments); };
  let live = production && !disabled;
  // An existing shared MONO tag means GA is already configured. This route does
  // not reconfigure it; all event payloads override location and referrer.
  if (live && !window.MONOAnalytics && !window.__monoSmithGAConfigured) {
    window.__monoSmithGAConfigured = true;
    window.gtag('js', new Date());
    window.gtag('config', id, { ...page, send_page_view:false, allow_google_signals:false, allow_ad_personalization_signals:false });
    if (!document.querySelector('#mono-ga4-loader')) {
      const tag = document.createElement('script'); tag.id = 'mono-ga4-loader'; tag.async = true; tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + id; document.head.append(tag);
    }
  }
  function track(name, props = {}) {
    if (disabled || !events.has(name)) return;
    const clean = { ...page, page_context:'smith-family', page_version:'smith-preview-v1' };
    for (const [key,value] of Object.entries(props)) {
      if (textKeys.has(key) && fixedValues.has(value)) clean[key] = value;
      if (numericKeys.has(key) && Number.isFinite(value) && value >= 0 && value < 1e9) clean[key] = Math.round(value * 100) / 100;
    }
    if (local) {
      logs.push({name,...clean}); if (logs.length > 500) logs.shift(); logNode.textContent = JSON.stringify(logs);
    }
    // Local dispatch exercises the real queue shape but loads no Google code.
    if (live || local) window.gtag('event',name,{...clean,send_to:id,transport_type:'beacon'});
  }
  function disable() { disabled = true; live = false; window['ga-disable-' + id] = true; }
  window.SmithAnalytics = Object.freeze({track,disable});
  addEventListener('storage',e => { if (e.key === 'mono_analytics_opt_out' && e.newValue === '1') disable(); });
  track('page_view');
  track('smithfamily_page_loaded');
})();

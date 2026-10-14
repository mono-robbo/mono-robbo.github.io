/* Portfolio measurement through MONO's existing, opt-out-aware GA4 dispatch. */
(function (window, document) {
  'use strict';
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const debug = local ? document.createElement('script') : null;
  if (debug) { debug.id = 'portfolio-debug-events'; debug.type = 'application/json'; debug.textContent = '[]'; document.body.appendChild(debug); }
  const debugEvents = [];
  function track(name, props = {}) {
    const data = { offer_id: 'selected-work', page_version: 'social-editor-20261014', ...props };
    if (debug) {
      debugEvents.push({ name, ...data });
      if (debugEvents.length > 500) debugEvents.shift();
      debug.textContent = JSON.stringify(debugEvents);
    }
    window.MONOAnalytics?.track(name, data);
  }
  function watchVideo(video, button) {
    const requested = performance.now();
    const film = button.dataset.slug;
    let started = false, disposed = false, wasPaused = false, bufferSince = null, priorPosition = 0;
    const milestones = new Set(), listeners = [];
    const on = (target, name, callback) => { target.addEventListener(name, callback); listeners.push([target, name, callback]); };
    const watched = () => {
      let seconds = 0;
      for (let i = 0; i < video.played.length; i++) seconds += video.played.end(i) - video.played.start(i);
      return Math.round(seconds * 10) / 10;
    };
    const emit = (name, props = {}) => {
      if (disposed) return;
      track(name, { film_id: film, placement: 'lightbox', position_seconds: Math.round(video.currentTime || 0),
        duration_seconds: Number.isFinite(video.duration) ? Math.round(video.duration) : 0, seconds: watched(), ...props });
    };
    const flushBuffer = () => {
      if (bufferSince !== null) { emit('portfolio_video_buffer', { buffer_ms: Math.round(performance.now() - bufferSince) }); bufferSince = null; }
    };
    on(video, 'play', () => {
      if (started && wasPaused) emit('portfolio_video_resume');
      wasPaused = false;
    });
    on(video, 'playing', () => {
      if (!started) { started = true; emit('portfolio_video_start', { startup_ms: Math.round(performance.now() - requested) }); }
      flushBuffer();
    });
    on(video, 'pause', () => {
      flushBuffer();
      if (started && !video.ended) { wasPaused = true; emit('portfolio_video_pause'); }
    });
    on(video, 'timeupdate', () => {
      if (started && Number.isFinite(video.duration) && video.duration > 0) {
        const percent = 100 * watched() / video.duration;
        for (const mark of [10, 25, 50, 75, 90]) {
          if (percent >= mark && !milestones.has(mark)) { milestones.add(mark); emit('portfolio_video_progress', { percent: mark }); }
        }
      }
      if (!video.seeking) priorPosition = video.currentTime;
    });
    on(video, 'seeking', () => emit('portfolio_video_seek', { from_seconds: Math.round(priorPosition) }));
    on(video, 'waiting', () => {
      if (started && !video.paused && !video.seeking && bufferSince === null) bufferSince = performance.now();
    });
    on(video, 'ended', () => {
      flushBuffer();
      emit('portfolio_video_complete');
      if (video.duration > 0 && watched() >= video.duration - .15) emit('portfolio_video_progress', { percent: 100 });
    });
    on(video, 'ratechange', () => emit('portfolio_video_rate', { playback_rate: video.playbackRate }));
    on(video, 'volumechange', () => emit('portfolio_video_volume', { percent: Math.round(video.volume * 100), action: video.muted ? 'muted' : 'unmuted' }));
    on(video, 'error', () => emit('portfolio_video_error', { media_error_code: video.error?.code || 0 }));
    on(video, 'webkitbeginfullscreen', () => emit('portfolio_video_fullscreen', { action: 'enter' }));
    on(video, 'webkitendfullscreen', () => emit('portfolio_video_fullscreen', { action: 'exit' }));
    let full = false;
    on(document, 'fullscreenchange', () => {
      if (document.fullscreenElement === video) { full = true; emit('portfolio_video_fullscreen', { action: 'enter' }); }
      else if (full) { full = false; emit('portfolio_video_fullscreen', { action: 'exit' }); }
    });
    let lastSummary = '';
    const summarize = action => {
      if (!started) return;
      const key = video.currentTime.toFixed(1) + ':' + watched();
      if (lastSummary !== key) { lastSummary = key; emit('portfolio_video_summary', { action }); }
    };
    on(document, 'visibilitychange', () => { if (document.visibilityState === 'hidden') summarize('hidden'); });
    on(window, 'pagehide', () => summarize('pagehide'));
    return { emit, close(reason) {
      flushBuffer(); summarize('close'); emit('portfolio_video_close', { action: reason }); disposed = true;
      listeners.forEach(([target, name, callback]) => target.removeEventListener(name, callback));
    } };
  }
  window.MONOPortfolioTracking = Object.freeze({ track, watchVideo });
  track('portfolio_page_loaded');
  const dialog = document.querySelector('.film-dialog');
  const sectionsSeen = new Set(), filmsSeen = new Set(), scrollSeen = new Set();
  const sectionIds = new Set(['intro', 'social', 'cases', 'contact']);
  const check = () => {
    if (document.visibilityState !== 'visible' || dialog.open) return;
    const reached = element => {
      const r = element.getBoundingClientRect();
      return Math.min(r.bottom, innerHeight) - Math.max(r.top, 0) >= Math.min(80, r.height * .25) && r.right > 0 && r.left < innerWidth;
    };
    document.querySelectorAll('section[id]').forEach(section => {
      if (sectionIds.has(section.id) && !sectionsSeen.has(section.id) && reached(section)) {
        sectionsSeen.add(section.id); track('portfolio_section_view', { section_id: section.id });
      }
    });
    document.querySelectorAll('.video-trigger').forEach(button => {
      const film = button.dataset.slug;
      if (!filmsSeen.has(film) && reached(button)) { filmsSeen.add(film); track('portfolio_work_view', { film_id: film }); }
    });
    const distance = document.documentElement.scrollHeight - innerHeight;
    const percent = distance > 0 ? 100 * scrollY / distance : 100;
    for (const mark of [25, 50, 75, 90, 100]) {
      if (percent >= mark - .1 && !scrollSeen.has(mark)) { scrollSeen.add(mark); track('portfolio_scroll_depth', { percent_scrolled: mark }); }
    }
  };
  let pending = false;
  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; check(); }); } };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  dialog.addEventListener('close', schedule);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    const cta = href.startsWith('mailto:') ? 'email_robin' : href === '#cases' ? 'case_studies' : href === '#social' ? 'social_work' : href === '#main' ? 'back_to_top' : href === 'https://monohq.co/' ? 'mono_home' : null;
    if (cta) track('portfolio_cta_click', { cta, placement: link.closest('header') ? 'header' : link.closest('footer') ? 'footer' : 'contact' });
  });
  let paused = false, since = document.visibilityState === 'visible' ? performance.now() : null;
  const flush = reason => {
    if (since === null) return;
    const now = performance.now(), elapsed = Math.round(now - since);
    since = !paused && document.visibilityState === 'visible' ? now : null;
    if (elapsed > 0) track('portfolio_dwell', { visible_time_ms: elapsed, dwell_reason: reason });
  };
  window.setInterval(() => flush('interval'), 15000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { flush('hidden'); since = null; }
    else if (!paused) { since ??= performance.now(); schedule(); }
  });
  window.addEventListener('pagehide', () => { paused = true; flush('pagehide'); since = null; });
  window.addEventListener('pageshow', () => { paused = false; if (document.visibilityState === 'visible') since ??= performance.now(); schedule(); });
  check();
})(window, document);

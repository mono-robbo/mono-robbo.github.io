(() => {
  'use strict';
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  const debug = local ? document.createElement('script') : null;
  if (debug) { debug.id = 'earthai-debug-events'; debug.type = 'application/json'; debug.textContent = '[]'; document.body.appendChild(debug); }
  const debugEvents = [];
  const track = (name, props = {}) => {
    const data = { offer_id: 'earth-ai', page_version: 'robin-lightbox-v1', ...props };
    if (local) {
      debugEvents.push({ name, ...data });
      if (debugEvents.length > 300) debugEvents.shift();
      debug.textContent = JSON.stringify(debugEvents);
    }
    window.MONOAnalytics?.track(name, data);
  };
  const dialog = document.querySelector('#film-lightbox');
  const slot = dialog.querySelector('.lightbox-media');
  const title = dialog.querySelector('#lightbox-title');
  const close = dialog.querySelector('.lightbox-close');
  let active = null;
  let opener = null;
  let closeReason = 'close_button';

  function makePlayer(button, mode) {
    const card = button.closest('[data-film]');
    const film = card.dataset.film;
    const video = document.createElement('video');
    video.className = 'film-player';
    video.controls = true;
    video.playsInline = true;
    video.preload = 'none';
    video.tabIndex = 0;
    video.setAttribute('aria-label', button.getAttribute('aria-label').replace(/^Watch /, ''));
    video.poster = button.querySelector('img').src;
    const requested = performance.now();
    let started = false, disposed = false, wasPaused = false, bufferSince = null, seekingFrom = 0;
    const milestones = new Set();
    const watched = () => {
      let seconds = 0;
      for (let i = 0; i < video.played.length; i++) seconds += video.played.end(i) - video.played.start(i);
      return Math.round(seconds * 10) / 10;
    };
    const emit = (name, extra = {}) => {
      if (!disposed) track(name, { film_id: film, placement: mode,
        position_seconds: Math.round(video.currentTime || 0),
        duration_seconds: Number.isFinite(video.duration) ? Math.round(video.duration) : 0,
        seconds: watched(), ...extra });
    };
    const flushBuffer = () => {
      if (bufferSince !== null) {
        emit('earthai_video_buffer', { buffer_ms: Math.round(performance.now() - bufferSince) });
        bufferSince = null;
      }
    };
    video.addEventListener('play', () => {
      document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
      if (started && wasPaused) emit('earthai_video_resume');
      wasPaused = false;
    });
    video.addEventListener('playing', () => {
      if (!started) {
        started = true;
        emit('earthai_video_start', { startup_ms: Math.round(performance.now() - requested) });
      }
      flushBuffer();
    });
    video.addEventListener('pause', () => {
      flushBuffer();
      if (started && !video.ended) { wasPaused = true; emit('earthai_video_pause'); }
    });
    video.addEventListener('timeupdate', () => {
      if (!started || !Number.isFinite(video.duration) || !video.duration) return;
      const percent = 100 * watched() / video.duration;
      // Use actually played ranges: seeking forward does not count as watching.
      for (const mark of [10, 25, 50, 75, 90]) {
        if (percent >= mark && !milestones.has(mark)) {
          milestones.add(mark); emit('earthai_video_progress', { percent: mark });
        }
      }
    });
    video.addEventListener('seeking', () => {
      emit('earthai_video_seek', { from_seconds: seekingFrom });
    });
    video.addEventListener('timeupdate', () => { if (!video.seeking) seekingFrom = video.currentTime; });
    video.addEventListener('waiting', () => {
      if (started && !video.paused && !video.seeking && bufferSince === null) bufferSince = performance.now();
    });
    video.addEventListener('ended', () => { flushBuffer(); emit('earthai_video_complete'); });
    video.addEventListener('ratechange', () => emit('earthai_video_rate', { playback_rate: video.playbackRate }));
    video.addEventListener('volumechange', () => emit('earthai_video_volume', {
      percent: Math.round(video.volume * 100), action: video.muted ? 'muted' : 'unmuted'
    }));
    video.addEventListener('webkitbeginfullscreen', () => emit('earthai_video_fullscreen', { action: 'enter' }));
    video.addEventListener('webkitendfullscreen', () => emit('earthai_video_fullscreen', { action: 'exit' }));
    const fullscreen = () => {
      const full = document.fullscreenElement;
      if (full === video || (!full && video.dataset.fullscreen === 'yes')) {
        video.dataset.fullscreen = full === video ? 'yes' : 'no';
        emit('earthai_video_fullscreen', { action: full === video ? 'enter' : 'exit' });
      }
    };
    document.addEventListener('fullscreenchange', fullscreen);
    let lastSummary = '';
    const summarize = action => {
      if (!started) return;
      const key = video.currentTime.toFixed(1) + ':' + watched();
      if (lastSummary === key) return;
      lastSummary = key;
      emit('earthai_video_summary', { action });
    };
    const hidden = () => { if (document.visibilityState === 'hidden') summarize('hidden'); };
    const leaving = () => summarize('pagehide');
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', leaving);
    video.addEventListener('error', () => {
      if (disposed) return;
      emit('earthai_video_error', { media_error_code: video.error?.code || 0 });
      if (video.parentElement.querySelector('.film-error')) return;
      const message = document.createElement('p');
      message.className = 'film-error';
      message.append('The film couldn’t load. ');
      const retry = document.createElement('a');
      retry.href = button.dataset.video;
      retry.textContent = 'Open the film directly';
      retry.addEventListener('click', () => emit('earthai_video_fallback'));
      message.append(retry); video.after(message);
    });
    // Assign a URL only as the result of a deliberate play-button click.
    video.src = button.dataset.video;
    emit('earthai_video_request');
    return { video, emit, destroy(reason) {
      flushBuffer(); emit('earthai_video_close', { action: reason });
      disposed = true;
      document.removeEventListener('fullscreenchange', fullscreen);
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', leaving);
      video.pause(); video.removeAttribute('src'); video.load(); video.remove();
    } };
  }

  document.querySelectorAll('button[data-video]').forEach(button => {
    const inline = button.closest('[data-film]').dataset.film === 'bmrg';
    if (!inline) { button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', dialog.id); }
    button.addEventListener('click', () => {
      const player = makePlayer(button, inline ? 'inline' : 'lightbox');
      if (inline) {
        button.replaceWith(player.video);
        player.video.focus({ preventScroll: true });
      } else {
        opener = button; active = player; closeReason = 'close_button';
        title.textContent = player.video.getAttribute('aria-label');
        slot.replaceChildren(player.video);
        dialog.showModal();
        document.documentElement.classList.add('lightbox-open');
        close.focus({ preventScroll: true });
        player.emit('earthai_video_open');
      }
      player.video.play().catch(error => {
        if (error.name === 'NotAllowedError') player.emit('earthai_video_play_blocked');
      });
    });
  });
  close.addEventListener('click', () => { closeReason = 'close_button'; dialog.close(); });
  dialog.addEventListener('cancel', () => { closeReason = 'escape'; });
  let backdropDown = false;
  const outside = e => { const r = dialog.getBoundingClientRect(); return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom; };
  dialog.addEventListener('pointerdown', e => { backdropDown = e.target === dialog && outside(e); });
  dialog.addEventListener('click', e => {
    if (backdropDown && e.target === dialog && outside(e)) { closeReason = 'backdrop'; dialog.close(); }
    backdropDown = false;
  });
  dialog.addEventListener('close', () => {
    active?.destroy(closeReason); active = null; slot.replaceChildren();
    document.documentElement.classList.remove('lightbox-open');
    opener?.focus({ preventScroll: true });
  });

  track('earthai_page_loaded');
  const sectionIds = new Set(['intro', 'work', 'deep-tech', 'main-sequence', 'storytelling', 'working-together', 'talk']);
  const sectionsSeen = new Set(), scrollSeen = new Set();
  const checkPage = () => {
    if (document.visibilityState !== 'visible' || dialog.open) return;
    document.querySelectorAll('section[id]').forEach(section => {
      if (!sectionIds.has(section.id) || sectionsSeen.has(section.id)) return;
      const r = section.getBoundingClientRect();
      if (Math.min(r.bottom, innerHeight) - Math.max(r.top, 0) >= Math.min(180, r.height * .25)) {
        sectionsSeen.add(section.id); track('earthai_section_view', { section_id: section.id });
      }
    });
    const available = document.documentElement.scrollHeight - innerHeight;
    const percent = available > 0 ? 100 * scrollY / available : 100;
    for (const mark of [25, 50, 75, 90, 100]) {
      if (percent >= mark - .1 && !scrollSeen.has(mark)) {
        scrollSeen.add(mark); track('earthai_scroll_depth', { percent_scrolled: mark });
      }
    }
  };
  let pending = false;
  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; checkPage(); }); } };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  document.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link || link.closest('.film-error')) return;
    const href = link.getAttribute('href');
    const placement = link.closest('header') ? 'header' : link.closest('footer') ? 'footer' : link.closest('section')?.id || 'page';
    const cta = href?.startsWith('mailto:') ? 'email_robin' : href === '#talk' ? 'chat_with_robin' : href === '#work' ? 'explore_work' : href === 'https://monohq.co/' ? 'mono_home' : null;
    if (cta) track('earthai_cta_click', { placement, cta });
  });
  let visibleSince = document.visibilityState === 'visible' ? performance.now() : null;
  const flushDwell = reason => {
    if (visibleSince === null) return;
    const now = performance.now();
    const elapsed = Math.round(now - visibleSince);
    visibleSince = document.visibilityState === 'visible' ? now : null;
    if (elapsed > 0) track('earthai_dwell', { visible_time_ms: elapsed, dwell_reason: reason });
  };
  setInterval(() => flushDwell('interval'), 15000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { flushDwell('hidden'); visibleSince = null; }
    else { visibleSince = performance.now(); schedule(); }
  });
  addEventListener('pagehide', () => { flushDwell('pagehide'); visibleSince = null; });
  addEventListener('pageshow', () => { if (document.visibilityState === 'visible') visibleSince = performance.now(); schedule(); });
  checkPage();
})();

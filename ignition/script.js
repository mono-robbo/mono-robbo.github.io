(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.getElementById('motion-toggle');
  let paused = reduce.matches;
  function updateMotion() {
    document.documentElement.classList.toggle('motion-off', paused);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.innerHTML = paused ? '<span aria-hidden="true">▷</span> Motion paused' : '<span aria-hidden="true">Ⅱ</span> Pause motion';
  }
  updateMotion();
  toggle.addEventListener('click', () => { paused = !paused; updateMotion(); });
  reduce.addEventListener('change', event => { paused = event.matches; updateMotion(); });

  // Keep decorative movement quiet when its section is off-screen.
  const graphics = document.querySelectorAll('.graphic-motion');
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('motion-ready');
    const graphicObserver = new IntersectionObserver(entries => {
      for (const entry of entries) entry.target.classList.toggle('is-in-view', entry.isIntersecting);
    }, { rootMargin: '80px 0px', threshold: 0 });
    graphics.forEach(graphic => graphicObserver.observe(graphic));
  }
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('page-hidden', document.hidden);
  });
  if ('IntersectionObserver' in window && !reduce.matches) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('is-visible'); observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(element => { element.classList.add('will-reveal'); observer.observe(element); });
  }
})();

// Lightweight, keyboard-accessible players. No video bytes until Play is chosen.
(() => {
  const icons = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 4 14 8-14 8Z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16M17 4v16" stroke="currentColor" stroke-width="4"/></svg>',
    volume: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3Zm13-2c4 3 4 7 0 10m2-13c6 4 6 12 0 16" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3Zm13-1 6 8m0-8-6 8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    fullscreen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>'
  };
  const formatTime = seconds => {
    if (!Number.isFinite(seconds)) return '0:00';
    const n = Math.max(0, Math.floor(seconds));
    return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
  };
  let activePlayer = null;
  document.querySelectorAll('.film-player').forEach(player => {
    const video = player.querySelector('video');
    if (!video) return;
    const title = video.getAttribute('aria-label') || 'Film';
    let initialized = false, scrubbing = false, loadingTimer, startupAt = null, stalls = 0;
    let loadPromise = null, objectUrl = null, pendingSeek = null;
    const start = document.createElement('button');
    start.className = 'film-start'; start.type = 'button'; start.setAttribute('aria-label', `Play ${title}`);
    start.innerHTML = `<span class="film-start-circle">${icons.play}</span><span class="film-start-label">Play film</span>`;
    const status = document.createElement('div'); status.className = 'player-status'; status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
    const controls = document.createElement('div'); controls.className = 'player-controls'; controls.setAttribute('aria-label',`${title} controls`);
    controls.innerHTML = `<button class="player-button player-toggle" type="button" aria-label="Play ${title}">${icons.play}</button><input class="player-seek" type="range" min="0" max="1" value="0" step="0.1" aria-label="Seek ${title}" disabled><span class="player-time"><span class="player-current">0:00</span><span class="player-duration"> / 0:00</span></span><button class="player-button player-mute" type="button" aria-label="Mute ${title}" aria-pressed="false">${icons.volume}</button><button class="player-button player-fullscreen" type="button" aria-label="Full screen ${title}">${icons.fullscreen}</button>`;
    player.append(start, status, controls);
    const toggle = controls.querySelector('.player-toggle'), seek = controls.querySelector('.player-seek'), current = controls.querySelector('.player-current'), duration = controls.querySelector('.player-duration'), mute = controls.querySelector('.player-mute'), fullscreen = controls.querySelector('.player-fullscreen');
    player.classList.add('enhanced-player'); player.setAttribute('role','group'); player.setAttribute('aria-label',`${title} video player`); video.controls = false;
    function showLoading() {
      clearTimeout(loadingTimer);
      loadingTimer = setTimeout(() => { if (!video.paused) { player.classList.add('is-loading'); status.textContent = 'Loading film…'; } }, 350);
    }
    function clearLoading() { clearTimeout(loadingTimer); player.classList.remove('is-loading'); if (!player.classList.contains('has-error')) status.textContent = ''; }
    async function ensureSource() {
      if (initialized) return;
      if (loadPromise) return loadPromise;
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const limited = connection && (connection.saveData || /(^|-)2g$|3g/.test(connection.effectiveType || ''));
      const mobile = window.matchMedia('(max-width: 700px)').matches || limited;
      const url = mobile ? video.dataset.srcSmall : video.dataset.srcLarge;
      player.dataset.chosenQuality = mobile ? (video.dataset.qualitySmall || '480p') : (video.dataset.qualityLarge || '720p');
      player.dataset.deliveryMode = 'buffering';
      player.classList.add('is-loading'); player.setAttribute('aria-busy','true');
      status.textContent = 'Preparing film…'; seek.disabled = true; toggle.disabled = true;
      // The private host returns full 200 responses even for Range requests.
      // Buffer once after Play, then use a Blob URL so every seek is local.
      // Never attach the remote source to the enhanced player.
      loadPromise = (async () => {
        const response = await fetch(url, {credentials:'same-origin'});
        if (!response.ok || !/video\/mp4|application\/octet-stream/i.test(response.headers.get('content-type') || '')) throw new Error('Invalid video response');
        const total = Number(response.headers.get('content-length')) || 0;
        let blob;
        if (response.body && response.body.getReader) {
          const reader = response.body.getReader(), chunks = []; let received = 0, announced = -1;
          while (true) {
            const {done,value} = await reader.read(); if (done) break;
            chunks.push(value); received += value.byteLength;
            const percent = total > 0 ? Math.min(100,Math.floor(received / total * 100)) : 0;
            player.dataset.downloadPercent = String(percent);
            // Limit live-region updates while keeping useful progress visible.
            if (Math.floor(percent / 10) !== announced) {
              announced = Math.floor(percent / 10);
              status.textContent = total > 0 ? `Preparing film… ${percent}%` : `Preparing film… ${(received / 1000000).toFixed(1)} MB`;
            }
          }
          if (!received || (total && received !== total)) throw new Error('Incomplete video');
          blob = new Blob(chunks, {type:'video/mp4'});
        } else blob = await response.blob();
        if (!blob.size) throw new Error('Empty video');
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(blob);
        video.src = objectUrl; video.preload = 'auto'; initialized = true;
        player.dataset.deliveryMode = 'local-buffer'; player.dataset.downloadBytes = String(blob.size);
        video.load();
      })();
      try { await loadPromise; }
      finally { loadPromise = null; toggle.disabled = false; player.removeAttribute('aria-busy'); }
    }
    function failure() {
      initialized = false;
      clearLoading(); player.classList.add('has-error'); player.classList.remove('is-started');
      status.textContent = 'Couldn’t load this film. Try again or use Open video.';
      start.setAttribute('aria-label',`Retry ${title}`); start.querySelector('.film-start-label').textContent = 'Try again';
      toggle.innerHTML = icons.play; toggle.setAttribute('aria-label',`Play ${title}`);
    }
    async function play() {
      player.classList.remove('has-error'); status.textContent = '';
      activePlayer = player;
      document.querySelectorAll('.film-player video').forEach(other => { if (other !== video && !other.paused) other.pause(); });
      player.classList.add('is-started'); startupAt = performance.now();
      try {
        await ensureSource();
        if (activePlayer !== player || document.hidden) { clearLoading(); return; }
        if (video.ended) video.currentTime = 0;
        showLoading(); await video.play();
      } catch (error) {
        if (error.name === 'NotAllowedError' && initialized) {
          // Some mobile browsers require a fresh tap after asynchronous loading.
          clearLoading(); player.classList.remove('is-started'); startupAt=null;
          start.querySelector('.film-start-label').textContent='Ready. Play film';
          start.setAttribute('aria-label',`Play ${title}`);
        } else if (error.name !== 'AbortError') failure();
      }
    }
    function togglePlayback() { if (video.paused || video.ended) play(); else video.pause(); }
    start.addEventListener('click', play); toggle.addEventListener('click',togglePlayback);
    video.addEventListener('click',togglePlayback);
    video.addEventListener('play',() => {
      document.querySelectorAll('.film-player video').forEach(other => { if (other !== video && !other.paused) other.pause(); });
      player.classList.add('is-started'); toggle.innerHTML=icons.pause; toggle.setAttribute('aria-label',`Pause ${title}`);
    });
    video.addEventListener('playing',() => {
      clearLoading(); player.classList.remove('has-error');
      if (startupAt !== null) {
        const stamp = startupAt; startupAt = null;
        const record = () => { player.dataset.startupMs = String(Math.round(performance.now() - stamp)); };
        if ('requestVideoFrameCallback' in video) video.requestVideoFrameCallback(record); else record();
      }
    });
    video.addEventListener('pause',() => { clearLoading(); toggle.innerHTML=icons.play; toggle.setAttribute('aria-label',`Play ${title}`); });
    video.addEventListener('waiting',() => { if (video.currentTime > 0) { stalls++; player.dataset.playbackStalls=String(stalls); } showLoading(); });
    video.addEventListener('error',failure);
    video.addEventListener('loadedmetadata',() => { seek.max=String(video.duration); seek.disabled=false; duration.textContent=` / ${formatTime(video.duration)}`; });
    video.addEventListener('timeupdate',() => { if (!scrubbing) { seek.value=String(video.currentTime); current.textContent=formatTime(video.currentTime); seek.setAttribute('aria-valuetext',`${formatTime(video.currentTime)} of ${formatTime(video.duration)}`); } });
    video.addEventListener('ended',() => { player.classList.remove('is-started'); start.querySelector('.film-start-label').textContent='Play again'; start.setAttribute('aria-label',`Replay ${title}`); });
    seek.addEventListener('pointerdown',() => { scrubbing=true; pendingSeek=null; });
    seek.addEventListener('input',() => { scrubbing=true; pendingSeek=Number(seek.value); current.textContent=formatTime(pendingSeek); });
    seek.addEventListener('change',() => {
      const target=pendingSeek === null ? Number(seek.value) : pendingSeek;
      if (initialized && Number.isFinite(video.duration) && Number.isFinite(target)) {
        player.dataset.lastSeekTarget=String(target);
        video.currentTime=Math.max(0,Math.min(target,video.duration));
      }
      pendingSeek=null; scrubbing=false;
    });
    seek.addEventListener('pointercancel',() => { pendingSeek=null; scrubbing=false; seek.value=String(video.currentTime); });
    mute.addEventListener('click',() => { video.muted=!video.muted; });
    video.addEventListener('volumechange',() => { mute.innerHTML=video.muted?icons.muted:icons.volume; mute.setAttribute('aria-label',`${video.muted?'Unmute':'Mute'} ${title}`); mute.setAttribute('aria-pressed',String(video.muted)); });
    fullscreen.addEventListener('click',async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (player.requestFullscreen) await player.requestFullscreen();
        else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
        else { video.controls=true; fullscreen.hidden=true; }
      } catch { video.controls=true; }
    });
    document.addEventListener('fullscreenchange',() => { fullscreen.setAttribute('aria-label', `${document.fullscreenElement === player ? 'Exit full screen' : 'Full screen'} ${title}`); });
    document.addEventListener('visibilitychange',() => { if (document.hidden && !video.paused) video.pause(); });
  });
})();

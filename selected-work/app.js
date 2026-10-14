// Responsive masonry; video bytes are requested only after a click.
(() => {
  const grid = document.querySelector('.work-grid');
  if (!grid || !('ResizeObserver' in window)) return;
  const cards = [...grid.querySelectorAll('.work-card')];
  let frame;
  function layout() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      grid.classList.add('masonry');
      // Clear previous positions before measuring the new responsive widths.
      cards.forEach(card => {
        card.style.gridRow = '';
        card.style.gridColumn = card.classList.contains('panorama') ? 'span 2' : 'span 1';
      });
      const count = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      const bottoms = Array(count).fill(0);
      cards.forEach(card => {
        const span = Math.min(count, card.classList.contains('panorama') ? 2 : 1);
        let column = 0;
        let row = Infinity;
        for (let start = 0; start <= count - span; start++) {
          const candidate = Math.max(...bottoms.slice(start, start + span));
          if (candidate < row) { column = start; row = candidate; }
        }
        const rows = Math.ceil(card.querySelector('.card-body').getBoundingClientRect().height / 4);
        card.style.gridColumn = `${column + 1} / span ${span}`;
        card.style.gridRow = `${row + 1} / span ${rows}`;
        for (let i = column; i < column + span; i++) bottoms[i] = row + rows;
      });
    });
  }
  const observer = new ResizeObserver(layout);
  cards.forEach(card => observer.observe(card.querySelector('.card-body')));
  document.fonts.ready.then(layout);
  window.addEventListener('resize', layout);
  layout();
})();

(() => {
  const dialog = document.querySelector('.film-dialog');
  const video = dialog.querySelector('video');
  const error = dialog.querySelector('.playback-error');
  let trigger;
  let session;
  let closeReason = 'close_button';
  document.querySelectorAll('.video-trigger').forEach(button => {
    button.addEventListener('click', () => {
      trigger = button;
      document.querySelector('#film-title').textContent = button.dataset.title;
      video.setAttribute('aria-label', button.dataset.title);
      video.poster = button.dataset.poster;
      dialog.style.setProperty('--film-ratio', button.dataset.ratio);
      error.hidden = true;
      session = window.MONOPortfolioTracking?.watchVideo(video, button);
      video.src = button.dataset.video;
      session?.emit('portfolio_video_request');
      dialog.showModal();
      closeReason = 'close_button';
      session?.emit('portfolio_video_open');
      document.body.classList.add('film-open');
      const current = session;
      video.play().catch(error => {
        if (session === current && error.name === 'NotAllowedError') current?.emit('portfolio_video_play_blocked');
      });
    });
  });
  const close = () => dialog.close();
  dialog.querySelector('.film-close').addEventListener('click', close);
  dialog.addEventListener('cancel', () => { closeReason = 'escape'; });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) { closeReason = 'backdrop'; close(); }
  });
  dialog.addEventListener('close', () => {
    session?.close(closeReason);
    session = null;
    video.pause();
    video.removeAttribute('src');
    video.load();
    document.body.classList.remove('film-open');
    trigger?.focus();
  });
  video.addEventListener('error', () => { error.hidden = false; });
})();

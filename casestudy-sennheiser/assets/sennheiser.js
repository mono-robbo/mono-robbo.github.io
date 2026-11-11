(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  try {
    root.classList.add('motion-enabled');
    const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

    // Headings rise line by line out of a mask.
    $$('h1, h2').forEach(h => {
      const parts = h.innerHTML.split(/<br\s*\/?>/i);
      h.innerHTML = parts.map((p, i) => `<span class="line"><span class="line-in" style="--i:${i}">${p}</span></span>`).join('');
      h.classList.add('split');
    });

    // What reveals, and how.
    const up = '.eyebrow, .section-heading > p, .intro-note p, .cs-hero-copy, .work-bottom, .working-intro, .steps article, .contact p:not(.eyebrow), .contact-actions, .contact-signoff, .stats > div, .nav > *';
    $$(up).forEach(el => el.classList.add('rv', 'rv-up'));
    $$('.work-item, .cs-hero-kv').forEach(el => el.classList.add('rv', 'rv-wipe'));
    $$('.flow li').forEach(el => el.classList.add('rv', 'rv-step'));
    $$('.split').forEach(el => el.classList.add('rv'));

    // Stagger siblings that arrive together.
    const groups = '.work-row, .stats, .flow, .steps, .intro-note, .nav, .contact .wrap';
    $$(groups).forEach(g => [...g.children].filter(c => c.classList.contains('rv')).forEach((c, i) => c.style.setProperty('--d', i * 110 + 'ms')));

    // Numbers count up when the stats row arrives.
    const countUp = el => {
      const m = el.textContent.match(/^(\D*)(\d+)(\D*)$/);
      if (!m) return;
      const [, pre, num, post] = m, end = +num, t0 = performance.now(), dur = 1400;
      const tick = now => {
        const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(2, -10 * t);
        el.textContent = pre + Math.round(end * (t === 1 ? 1 : e)) + post;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const media = el.classList.contains('rv-wipe') && el.querySelector('img');
      if (media) media.loading = 'eager';
      if (media && !media.complete) {
        const show = () => el.classList.add('in');
        media.addEventListener('load', show, { once: true });
        media.addEventListener('error', show, { once: true });
      } else el.classList.add('in');
      const stat = el.matches('.stats > div') && el.querySelector('strong');
      if (stat) setTimeout(() => countUp(stat), parseInt(el.style.getPropertyValue('--d')) || 0);
      io.unobserve(el);
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.rv').forEach(el => io.observe(el));

    // A fully clipped image never counts as visible, so the browser's own lazy loading
    // would not fetch it. Start the fetch ourselves a screen ahead of the reveal.
    const pre = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const img = en.target.querySelector('img');
      if (img) img.loading = 'eager';
      pre.unobserve(en.target);
    }), { rootMargin: '900px 0px' });
    $$('.rv-wipe').forEach(el => pre.observe(el));

    // The format row plays itself, muted, while it is on screen.
    const saveData = navigator.connection && navigator.connection.saveData;
    if (!saveData) {
      const vio = new IntersectionObserver(entries => entries.forEach(en => {
        const v = en.target;
        if (en.isIntersecting) { v.muted = true; v.loop = true; const p = v.play(); if (p) p.catch(() => {}); }
        else v.pause();
      }), { threshold: 0.55 });
      $$('.work-row.formats video').forEach(v => vio.observe(v));
    }

    // Marquee: double the track so it loops without a seam.
    $$('.marquee-track').forEach(t => { t.innerHTML += t.innerHTML; });

    // Scroll progress, hero drift and the contact rings follow the scroll.
    const bar = document.createElement('div'); bar.className = 'scroll-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
    const kv = document.querySelector('.cs-hero-kv img'), contact = document.querySelector('.contact');
    let ticking = false;
    const onScroll = () => {
      ticking = false;
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (kv) kv.style.setProperty('--drift', Math.min(60, y * 0.06) + 'px');
      if (contact) {
        const r = contact.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (innerHeight - r.top) / (innerHeight + r.height)));
        contact.style.setProperty('--ring', (0.7 + p * 0.6).toFixed(3));
      }
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    addEventListener('resize', onScroll); onScroll();

    // Buttons lean toward the pointer.
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      $$('.pill').forEach(b => {
        b.addEventListener('pointermove', e => {
          const r = b.getBoundingClientRect();
          b.style.transform = `translate(${((e.clientX - r.left) / r.width - 0.5) * 10}px, ${((e.clientY - r.top) / r.height - 0.5) * 8}px)`;
        });
        b.addEventListener('pointerleave', () => { b.style.transform = ''; });
      });
    }
  } catch (err) {
    root.classList.remove('motion-enabled');
  }
})();

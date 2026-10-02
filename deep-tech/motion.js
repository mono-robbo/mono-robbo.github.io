import { initHeroLight } from './hero-light.js?v=20261002-ambient-v2';

// Progressive enhancement: content stays visible if motion is unavailable.
export function initMotion() {
  initHeroLight();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const animations = new Set();
  const animating = new WeakMap();
  const seen = new WeakSet();
  const targets = new Map();
  const compact = window.innerWidth <= 600;

  const group = (selector, step = 70, distance = 24) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      targets.set(element, { delay: compact ? 0 : Math.min(index * step, 240), distance });
    });
  };
  group('.site-header > *', 50, 12);
  group('.hero-copy > *', 100, 32);
  group('.hero-index > *', 70, 20);
  document.querySelectorAll('.section-heading, .source-board, .item-list, .workspace-list').forEach(parent => {
    [...parent.children].forEach((element, index) => {
      targets.set(element, { delay: compact ? 0 : index * 70, distance: 24 });
    });
  });
  const columns = window.innerWidth <= 600 ? 1 : window.innerWidth <= 1000 ? 2 : 4;
  document.querySelectorAll('.container-card').forEach((element, index) => {
    targets.set(element, { delay: (index % columns) * 75, distance: 24 });
  });
  group('.package-card, .input-note, .source-caption, .element-heading, .containers-intro, .container-note', 0, 18);
  group('.credentials-intro > div:first-child, .growing-section > div:first-child', 0, 28);
  group('.credentials-copy > p', 55, 18);
  group('.credentials-clients', 0, 16);
  group('.closing > *', 80, 28);
  group('.site-footer > *', 50, 12);

  const reveal = element => {
    if (seen.has(element)) return;
    seen.add(element);
    if (reduced.matches || element.contains(document.activeElement) || !element.animate) return;
    const { delay, distance } = targets.get(element);
    const animation = element.animate([
      { opacity: 0, transform: `translate3d(0, ${distance}px, 0)` },
      { opacity: 1, transform: 'translate3d(0, 0, 0)' }
    ], { duration: 900, delay, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
    animations.add(animation);
    animating.set(element, animation);
    const clear = () => { animations.delete(animation); animating.delete(element); };
    animation.addEventListener('finish', clear, { once: true });
    animation.addEventListener('cancel', clear, { once: true });
  };

  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -16px 0px' });
    targets.forEach((_, element) => observer.observe(element));
    // Keyboard navigation always exposes a focused control immediately.
    document.addEventListener('focusin', event => {
      // Pointer focus must not move a control between press and release.
      if (!event.target.matches(':focus-visible')) return;
      for (let element = event.target; element; element = element.parentElement) {
        animating.get(element)?.cancel();
        if (targets.has(element)) { seen.add(element); observer.unobserve(element); }
      }
    });
    reduced.addEventListener('change', () => {
      if (reduced.matches) {
        observer.disconnect();
        [...animations].forEach(animation => animation.cancel());
      }
    });
  }

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  let scrollFrame = 0;
  const updateProgress = () => {
    scrollFrame = 0;
    const range = document.documentElement.scrollHeight - window.innerHeight;
    const fraction = range > 0 ? Math.max(0, Math.min(1, window.scrollY / range)) : 0;
    progress.style.transform = `scaleX(${fraction})`;
  };
  const scheduleProgress = () => {
    if (!scrollFrame && !reduced.matches) scrollFrame = requestAnimationFrame(updateProgress);
  };
  window.addEventListener('scroll', scheduleProgress, { passive: true });
  window.addEventListener('resize', scheduleProgress, { passive: true });
  updateProgress();

  // Small pointer offsets are separate from the entry and hover transforms.
  document.querySelectorAll('.button').forEach(button => {
    let pointerFrame = 0;
    const reset = () => {
      cancelAnimationFrame(pointerFrame);
      button.style.removeProperty('--magnet-x');
      button.style.removeProperty('--magnet-y');
    };
    button.addEventListener('pointermove', event => {
      if (reduced.matches || !finePointer.matches || event.pointerType === 'touch') return;
      const bounds = button.getBoundingClientRect();
      const x = Math.max(-6, Math.min(6, (event.clientX - bounds.left - bounds.width / 2) * 0.08));
      const y = Math.max(-4, Math.min(4, (event.clientY - bounds.top - bounds.height / 2) * 0.08));
      cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        button.style.setProperty('--magnet-x', `${x}px`);
        button.style.setProperty('--magnet-y', `${y}px`);
      });
    }, { passive: true });
    button.addEventListener('pointerleave', reset);
    button.addEventListener('blur', reset);
    reduced.addEventListener('change', reset);
    finePointer.addEventListener('change', reset);
  });

  // Keep the existing logo animation idle outside the viewport or in a hidden tab.
  const ticker = document.querySelector('.client-ticker');
  if (ticker && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      ticker.classList.toggle('ticker-offscreen', !entries[0].isIntersecting);
    }).observe(ticker);
  }
  const syncVisibility = () => document.documentElement.classList.toggle('page-idle', document.hidden);
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();
}

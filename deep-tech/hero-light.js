// CSS provides the idle drift. Pointer light and its wake settle independently.
export function initHeroLight() {
  const hero = document.querySelector('.hero');
  const atmosphere = hero?.querySelector('.hero-atmosphere');
  const field = atmosphere?.querySelector('.hero-light-field');
  const core = atmosphere?.querySelector('.hero-pointer-core');
  const trail = atmosphere?.querySelector('.hero-pointer-trail');
  if (!field || !core || !trail) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  let inView = true;
  let frame = 0;
  let lastTime = 0;
  let tracking = false;
  const head = { x: 0, y: 0 };
  const wake = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  const drift = { x: 0, y: 0 };
  const driftTarget = { x: 0, y: 0 };
  const active = () => inView && !document.hidden && !reduced.matches;
  const move = (point, destination, amount) => {
    point.x += (destination.x - point.x) * amount;
    point.y += (destination.y - point.y) * amount;
    return Math.abs(destination.x - point.x) + Math.abs(destination.y - point.y);
  };
  const paint = (element, point) => {
    element.style.transform = `translate3d(${point.x.toFixed(2)}px, ${point.y.toFixed(2)}px, 0)`;
  };
  const settle = time => {
    frame = 0;
    if (!active() || !pointer.matches) return;
    const elapsed = lastTime ? Math.min(time - lastTime, 64) : 16;
    lastTime = time;
    const error = move(head, target, 1 - Math.exp(-elapsed / 100))
      + move(wake, target, 1 - Math.exp(-elapsed / 480))
      + move(drift, driftTarget, 1 - Math.exp(-elapsed / 350));
    paint(core, head);
    paint(trail, wake);
    paint(field, drift);
    if (error > .1) frame = requestAnimationFrame(settle);
    else lastTime = 0;
  };
  const schedule = () => {
    if (!frame && active() && pointer.matches) frame = requestAnimationFrame(settle);
  };
  const leave = () => {
    tracking = false;
    atmosphere.classList.remove('is-interacting');
    driftTarget.x = driftTarget.y = 0;
    schedule();
  };
  const sync = () => {
    atmosphere.classList.toggle('is-still', !active());
    if (!active() || !pointer.matches) {
      tracking = false;
      atmosphere.classList.remove('is-interacting');
      cancelAnimationFrame(frame);
      frame = lastTime = 0;
      drift.x = drift.y = driftTarget.x = driftTarget.y = 0;
      field.style.removeProperty('transform');
    }
  };
  hero.addEventListener('pointermove', event => {
    if (!active() || !pointer.matches || event.pointerType === 'touch') return;
    const bounds = atmosphere.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    target.x = event.clientX - bounds.left;
    target.y = event.clientY - bounds.top;
    if (!tracking) {
      head.x = wake.x = target.x;
      head.y = wake.y = target.y;
      paint(core, head);
      paint(trail, wake);
      tracking = true;
      atmosphere.classList.add('is-interacting');
    }
    driftTarget.x = (target.x / bounds.width * 2 - 1) * 85;
    driftTarget.y = (target.y / bounds.height * 2 - 1) * 55;
    schedule();
  }, { passive: true });
  hero.addEventListener('pointerleave', leave);
  window.addEventListener('blur', leave);
  window.addEventListener('scroll', leave, { passive: true });
  reduced.addEventListener('change', sync);
  pointer.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      sync();
    }).observe(hero);
  }
  sync();
}

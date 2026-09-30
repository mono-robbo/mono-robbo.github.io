import { stages, containers, itemById, terms, packageQuote, fictionalCompany } from './offers.js';
import { stageVisual, generatedVisual } from './visuals.js';

const money = value => new Intl.NumberFormat('en-AU', { style: 'currency', currency: terms.currency, maximumFractionDigits: value % 100 === 0 ? 0 : 2 }).format(value / 100);
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const price = (value, prefix = '', fallback = 'Price to be confirmed') => Number.isInteger(value) && value >= 0 ? `${prefix ? `${prefix} ` : ''}${money(value)}` : fallback;
const itemPrice = item => price(item.priceCents, item.pricePrefix, item.priceLabel);
const priceNote = item => item.priceNote ? `<span class="price-note">${escape(item.priceNote)}</span>` : '';
const itemDialog = document.querySelector('#item-dialog');
let returnFocus = null;

function itemCard(item, index) {
  return `<article class="item-card" id="item-${item.id}"><span class="item-number">${String(index + 1).padStart(2, '0')}</span><div><div class="item-format">${escape(item.format)}</div><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p><button class="details-button" data-detail="${item.id}" aria-label="See what is included in ${escape(item.title)}">What’s included <span aria-hidden="true">↗</span></button></div><div class="item-buy"><div class="price-slot"><small>Item price</small><strong>${escape(itemPrice(item))}</strong>${priceNote(item)}</div></div></article>`;
}
function panelVisual(panel) {
  if (panel.visual === 'profile') return `<div class="profile-sample" aria-label="Fictional green hydrogen company profile example"><span>FICTIONAL / ${escape(fictionalCompany.sector)}</span><h4>${escape(fictionalCompany.name)}</h4><p>${escape(fictionalCompany.card)}</p><span>SHORT → LONG PROFILE</span></div>`;
  if (panel.visual === 'motion') return `<div class="vr-demo" aria-label="Interactive 3D visualisation study"><div class="vr-viewport"><span class="vr-orbit" aria-hidden="true"></span><div class="vr-object" aria-hidden="true"><i class="vr-face front"></i><i class="vr-face back"></i><i class="vr-face right"></i><i class="vr-face left"></i><i class="vr-face top"></i><i class="vr-face bottom"></i><i class="vr-core"></i></div></div><div class="vr-controls"><span>ROTATE</span><input type="range" min="0" max="360" value="32" aria-label="Rotate the 3D object"><span>360°</span></div></div>`;
  const generated = panel.visual === 'staticVisual' ? '' : `<img src="${generatedVisual(panel.visual)}" alt="" loading="lazy" decoding="async" data-generated-image>`;
  const play = panel.visual === 'explainer' ? '<span class="preview-play" aria-hidden="true">▶</span>' : '';
  return `<div class="source-art art-media">${stageVisual(panel.visual)}${generated}${play}</div>`;
}
function previewBoard(stage) {
  return `<div class="source-board" aria-label="${escape(stage.short)} content examples">${stage.preview.map(panel => `<div class="source-panel source-panel--${escape(panel.visual)}"><span class="source-panel-top"><b>${panel.number}</b><span>${escape(panel.label)}</span></span><strong>${escape(panel.headline)}</strong>${panelVisual(panel)}<small>${escape(panel.detail)}</small></div>`).join('')}</div><p class="source-caption">Illustrative studies showing possible creative directions.</p>`;
}
function packageCard(stage) {
  const quote = packageQuote(stage);
  const discountNote = quote ? `${Math.round(terms.discount * 100)}% off the three individual prices. Photography includes two people; +$150 each additional before discount.` : 'Scope and price are agreed for the detailed work.';
  return `<aside class="package-card" aria-label="${escape(stage.packageName)}"><p class="eyebrow">The foundation pack</p><h3>${escape(stage.packageName)}</h3><p>Reusable elements developed through a series of working sessions as your company evolves.</p><ul>${stage.coreIds.map(id => `<li>${escape(itemById[id].title)}</li>`).join('')}</ul><div class="package-price"><div class="total"><span>Pack price</span><strong>${escape(price(quote?.total, stage.packagePricePrefix, stage.packagePriceLabel || 'Custom quote'))}</strong></div><small>${escape(discountNote)}</small></div><div class="usage"><span class="usage-icon" aria-hidden="true">◷</span><div><b>Build the pack assets within 90 days.</b>Scope and scheduling are agreed before work begins.</div></div></aside>`;
}
function section(stage, index) {
  return `<section class="offer-section ${index === 1 ? 'technical' : ''}" id="${stage.id}" aria-labelledby="${stage.id}-title"><div class="wrap"><div class="section-heading"><div><p class="eyebrow"><span class="stage-number">${stage.number}</span> ${index === 0 ? 'Company foundation' : 'Technical foundation'}</p><h2 id="${stage.id}-title">${escape(stage.title)}</h2></div><p>${escape(stage.description)}</p></div>${previewBoard(stage)}<div class="stage-layout"><div><p class="element-heading">The core elements</p><div class="item-list">${stage.coreIds.map((id, itemIndex) => itemCard(itemById[id], itemIndex)).join('')}</div>${stage.extensionIds.length ? `<div class="extension-block"><p class="element-heading">Extend it when you need to</p><div class="item-list">${stage.extensionIds.map((id, itemIndex) => itemCard(itemById[id], stage.coreIds.length + itemIndex)).join('')}</div></div>` : ''}<div class="input-note"><span class="eyebrow">Bring what you know so far</span><p>Working hypotheses are welcome. We will separate approved facts from questions still being tested.</p><ul>${stage.inputs.map(input => `<li>${escape(input)}</li>`).join('')}</ul></div></div>${packageCard(stage)}</div></div></section>`;
}
document.querySelector('#stage-sections').innerHTML = stages.map(section).join('');
document.querySelector('#container-grid').innerHTML = containers.map((container, index) => `<article class="container-card"><span class="container-number">${String(index + 1).padStart(2, '0')} / ${escape(container.moment)}</span><h3>${escape(container.title)}</h3><p>${escape(container.description)}</p><button class="details-button" data-detail="${container.id}" aria-label="See what is included in ${escape(container.title)}">What’s included <span aria-hidden="true">↗</span></button><div class="container-price"><small>Container price</small><strong>${price(container.priceCents)}</strong></div></article>`).join('');
document.querySelectorAll('[data-generated-image]').forEach(image => image.addEventListener('error', () => { image.hidden = true; }));
document.querySelectorAll('.vr-controls input').forEach(input => {
  const updateRotation = () => input.closest('.vr-demo').style.setProperty('--rotation', `${input.value}deg`);
  input.addEventListener('input', updateRotation);
  updateRotation();
});
function safeUrl(value) {
  try { const url = new URL(value, location.href); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
function exampleContent(example, label) {
  if (example?.type === 'copy') return `<div class="detail-example-copy"><p class="eyebrow">Fictional example / ${escape(example.sector)}</p><h3>${escape(example.name)}</h3><h4>Short profile</h4><p>${escape(example.short)}</p><h4>Long profile</h4><p>${escape(example.long)}</p></div>`;
  const url = example && safeUrl(example.src);
  if (!url) return '';
  if (example.type === 'video') return `<video controls playsinline preload="none" ${example.poster && safeUrl(example.poster) ? `poster="${escape(safeUrl(example.poster))}"` : ''} aria-label="${escape(example.alt || label)}"><source src="${escape(url)}">Your browser cannot play this video.</video>`;
  if (example.type === 'link') return `<a class="button button-quiet" href="${escape(url)}" target="_blank" rel="noopener">${escape(example.alt || 'Open interactive example')} ↗</a>`;
  return `<img src="${escape(url)}" alt="${escape(example.alt || label)}" loading="lazy" decoding="async">`;
}
function openItem(id, opener) {
  const item = itemById[id];
  document.querySelector('#item-dialog-content').innerHTML = `<div class="dialog-header"><p class="eyebrow">${escape(item.format || item.moment)}</p><h2 id="item-dialog-title">${escape(item.title)}</h2><button class="close-button" data-close aria-label="Close item details">×</button><p>${escape(item.description)}</p></div><div class="dialog-body"><div class="detail-block"><h3>Useful when</h3><p>${escape(item.useful)}</p></div><div class="detail-block"><h3>You receive</h3><ul>${item.deliverables.map(line => `<li>${escape(line)}</li>`).join('')}</ul></div><div class="detail-block"><h3>We need from you</h3><p>${escape(item.input)}</p></div><div class="detail-block"><h3>How it works</h3><p>${escape(item.process)}</p></div><div class="detail-block"><h3>Keep building</h3><p>${escape(item.handoff)}</p></div><div class="detail-block"><h3>Timing & scope</h3><p>We confirm quantities, feedback rounds and delivery timing before booking.</p></div>${exampleContent(item.example, item.title)}</div><div class="dialog-footer"><div class="price-slot"><small>${item.moment ? 'Container price' : 'Item price'}</small><strong>${escape(itemPrice(item))}</strong>${priceNote(item)}</div></div>`;
  returnFocus = opener;
  document.body.classList.add('modal-open');
  itemDialog.showModal();
  itemDialog.scrollTop = 0;
  itemDialog.querySelector('[data-close]').focus();
}
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.matches('[data-detail]')) openItem(button.dataset.detail, button);
  else if (button.matches('[data-close]')) button.closest('dialog').close();
});
itemDialog.addEventListener('click', event => {
  if (event.target === itemDialog) {
    const rect = itemDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) itemDialog.close();
  }
});
itemDialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  returnFocus?.focus();
});

const tickerToggle = document.querySelector('#client-ticker-toggle');
tickerToggle?.addEventListener('click', () => {
  const paused = tickerToggle.closest('.credentials-clients').classList.toggle('is-paused');
  tickerToggle.setAttribute('aria-pressed', String(paused));
  tickerToggle.setAttribute('aria-label', paused ? 'Resume logo animation' : 'Pause logo animation');
  tickerToggle.innerHTML = `${paused ? 'Resume logos' : 'Pause logos'} <span aria-hidden="true">${paused ? '▷' : 'Ⅱ'}</span>`;
});

// Motion is optional, so an unavailable animation module cannot block the offers.
import('./motion.js').then(({ initMotion }) => initMotion()).catch(() => {});

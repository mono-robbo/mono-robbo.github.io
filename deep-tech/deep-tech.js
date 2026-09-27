import { items, stages, itemById, stageById, terms, packageQuote, createSelection, addPackage, selectedIds, removeItem, selectionQuote } from './offers.js';

const state = createSelection();
const money = value => new Intl.NumberFormat('en-AU', { style:'currency', currency:terms.currency, maximumFractionDigits: value % 100 === 0 ? 0 : 2 }).format(value / 100);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const price = value => Number.isInteger(value) && value >= 0 ? money(value) : '<span aria-label="Price to be confirmed">—</span>';
const status = message => { document.querySelector('#status').textContent = message; };
const itemDialog = document.querySelector('#item-dialog');
const selectionDialog = document.querySelector('#selection-dialog');
let returnFocus = null;

function itemCard(item, index) {
  return `<article class="item-card" id="item-${item.id}"><span class="item-number">${String(index + 1).padStart(2,'0')}</span><div><div class="item-format">${escape(item.format)}</div><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p><button class="details-button" data-detail="${item.id}" aria-label="See what is included in ${escape(item.title)}">What’s included <span aria-hidden="true">↗</span></button></div><div class="item-buy"><div class="price-slot"><small>Item price</small><strong>${price(item.priceCents)}</strong></div><button class="button button-quiet" data-toggle-item="${item.id}" aria-pressed="false" aria-label="Add ${escape(item.title)}">Add <span aria-hidden="true">+</span></button></div></article>`;
}
function packageCard(stage) {
  const quote = packageQuote(stage);
  return `<aside class="package-card" aria-label="${escape(stage.packageName)}"><p class="eyebrow">The complete package</p><h3>${escape(stage.packageName)}</h3><p>Everything in this stage. Ready when you need it.</p><ul>${stage.itemIds.map(id=>`<li>${escape(itemById[id].title)}</li>`).join('')}</ul><div class="package-price"><div><span>Items separately</span><span>${price(quote?.subtotal)}</span></div><div class="saving"><span>Package saving · 10%</span><span>${price(quote?.saving)}</span></div><div class="total"><span>Package price</span><span>${price(quote?.total)}</span></div></div><button class="button button-blue" data-toggle-package="${stage.id}" aria-pressed="false">Add package <span aria-hidden="true">+</span></button><div class="usage"><span class="usage-icon" aria-hidden="true">◷</span><div><b>Yours to use over 90 days.</b>Schedule the items separately, within 90 days from purchase.</div></div></aside>`;
}
document.querySelector('#stage-sections').innerHTML = stages.map((stage,index)=>`<section class="offer-section ${index===1?'light':''}" id="${stage.id}" aria-labelledby="${stage.id}-title"><div class="wrap"><div class="section-heading"><div><p class="eyebrow"><span class="stage-number">${stage.number}</span> ${index===0?'The first impression':index===1?'The moment it makes sense':'The next conversation'}</p><h2 id="${stage.id}-title">${escape(stage.title)}</h2></div>${stage.promise ? `<p>${escape(stage.promise)}</p>` : ''}</div><div class="stage-layout"><div><p class="stage-description">${escape(stage.description)}</p><div class="item-list">${stage.itemIds.map((id,i)=>itemCard(itemById[id],i)).join('')}</div><a class="section-example-link" href="#example-${stage.id}"><span>Explore the example space <span aria-hidden="true">↗</span></span><small>${escape(stage.exampleLabels.join(' / '))}</small></a></div>${packageCard(stage)}</div></div></section>`).join('');
document.querySelector('#additional-items').innerHTML = ['basic-logo','landing-page'].map((id,i)=>itemCard(itemById[id],i)).join('');

function safeUrl(value) {
  try { const url = new URL(value, location.href); return ['http:','https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
function exampleContent(example, label) {
  const url = example && safeUrl(example.src);
  if (!url) return `<span class="media-kind">${escape(label)}</span><span class="placeholder-label">Example to be added</span><span class="placeholder-mark" aria-hidden="true">＋</span>`;
  if (example.type==='video') return `<video controls playsinline preload="none" ${example.poster&&safeUrl(example.poster)?`poster="${escape(safeUrl(example.poster))}"`:''} aria-label="${escape(example.alt||label)}"><source src="${escape(url)}">Your browser cannot play this video.</video>`;
  if (example.type==='link') return `<a class="button button-quiet" href="${escape(url)}" target="_blank" rel="noopener">${escape(example.alt||'Open interactive example')} ↗</a>`;
  return `<img src="${escape(url)}" alt="${escape(example.alt||label)}" loading="lazy" decoding="async">`;
}
document.querySelector('#example-gallery').innerHTML = stages.map(stage=>`<article class="example-space" id="example-${stage.id}"><div class="example-media ${stage.example?'has-media':''}">${exampleContent(stage.example,stage.short)}</div><h3>${escape(stage.exampleTitle)}</h3><p>${escape(stage.exampleDescription)}</p>${stage.example?.credit?`<p class="example-credit">${escape(stage.example.credit)}</p>`:''}<div class="example-tags">${stage.exampleLabels.map(label=>`<span>${escape(label)}</span>`).join('')}</div></article>`).join('');

function packageContaining(id) { return [...state.packages].find(pack=>stageById[pack].itemIds.includes(id)); }
function syncButtons() {
  const ids = selectedIds(state);
  document.querySelectorAll('[data-toggle-item]').forEach(button=>{
    const id = button.dataset.toggleItem;
    const included = Boolean(packageContaining(id));
    const selected = ids.has(id);
    button.disabled = included;
    button.setAttribute('aria-pressed',String(selected));
    button.setAttribute('aria-label', included ? `${itemById[id].title} included in your package` : `${selected?'Remove':'Add'} ${itemById[id].title}`);
    button.innerHTML = included ? 'In package' : selected ? 'Added <span aria-hidden="true">✓</span>' : 'Add <span aria-hidden="true">+</span>';
  });
  document.querySelectorAll('[data-toggle-package]').forEach(button=>{
    const selected=state.packages.has(button.dataset.togglePackage);
    button.setAttribute('aria-pressed',String(selected));
    button.setAttribute('aria-label',`${selected?'Remove':'Add'} ${stageById[button.dataset.togglePackage].packageName}`);
    button.innerHTML=selected?'Package added <span aria-hidden="true">✓</span>':'Add package <span aria-hidden="true">+</span>';
  });
  document.querySelectorAll('[data-count]').forEach(el=>el.textContent=ids.size);
  document.querySelector('[data-selection-label]').textContent=ids.size?`${ids.size===1?'item':'items'} selected`:'Your pack';
  document.querySelector('#preview-enquiry').disabled=!ids.size;
}
function refresh() {
  syncButtons();
  renderSelection();
  document.querySelector('#enquiry-preview').hidden=true;
  document.querySelector('#enquiry-text').value='';
}
function toggleItem(id) {
  if (packageContaining(id)) return;
  if (state.individuals.has(id)) {state.individuals.delete(id);status(`${itemById[id].title} removed.`);}
  else {state.individuals.add(id);status(`${itemById[id].title} added to your pack.`);}
  refresh();
}
function togglePackage(id) {
  if (state.packages.has(id)) {state.packages.delete(id);status(`${stageById[id].packageName} removed.`);}
  else {addPackage(state,id);status(`${stageById[id].packageName} added. All ${stageById[id].itemIds.length} items are included, with no duplicates.`);}
  refresh();
}
function openDialog(dialog, opener) {
  returnFocus=opener;
  document.body.classList.add('modal-open');
  dialog.showModal();
  dialog.scrollTop=0;
  dialog.querySelector('[data-close]')?.focus();
}
function openItem(id,opener) {
  const item=itemById[id];
  document.querySelector('#item-dialog-content').innerHTML=`<div class="dialog-header"><p class="eyebrow">${escape(item.format)}</p><h2 id="item-dialog-title">${escape(item.title)}</h2><button class="close-button" data-close aria-label="Close item details">×</button><p>${escape(item.description)}</p></div><div class="dialog-body"><div class="detail-block"><h3>Useful when</h3><p>${escape(item.useful)}</p></div><div class="detail-block"><h3>You receive</h3><ul>${item.deliverables.map(text=>`<li>${escape(text)}</li>`).join('')}</ul></div><div class="detail-block"><h3>We need from you</h3><p>${escape(item.input)}</p></div><div class="detail-block"><h3>How it works</h3><p>${escape(item.process)}</p></div><div class="detail-block"><h3>Keep building</h3><p>${escape(item.handoff)}</p></div><div class="detail-block"><h3>Timing & scope</h3><p>We confirm the delivery date, quantities and feedback rounds with you before booking.</p></div>${item.example?`<div class="example-media has-media">${exampleContent(item.example,item.title)}</div>`:'<div class="detail-example"><span>Content example</span><span>Example to be added</span></div>'}</div><div class="dialog-footer"><div class="price-slot"><small>Item price</small><strong>${price(item.priceCents)}</strong></div><button class="button button-blue" data-toggle-item="${item.id}" aria-pressed="false">Add +</button></div>`;
  syncButtons();
  openDialog(itemDialog,opener);
}
function renderSelection() {
  const target=document.querySelector('#selection-items');
  if (!selectedIds(state).size) target.innerHTML='<div class="empty-state"><h3>One piece is a good start.</h3><p>Add an item or a complete stage package. You can mix items across all three stages.</p><button class="button button-quiet" data-close>Explore the offers ↓</button></div>';
  else target.innerHTML=[...state.packages].map(id=>{
    const stage=stageById[id];
    return `<article class="selected-group"><div class="selected-group-head"><div><h3>${escape(stage.packageName)}</h3><small>Complete package · 10% saving · 90 days</small></div><button class="remove" data-remove-package="${id}" aria-label="Remove ${escape(stage.packageName)}">Remove</button></div><ul>${stage.itemIds.map(item=>`<li><span>${escape(itemById[item].title)}</span><button class="remove" data-remove-item="${item}" aria-label="Remove ${escape(itemById[item].title)} from package">Remove item</button></li>`).join('')}</ul></article>`;
  }).join('')+[...state.individuals].map(id=>`<article class="selected-single"><div><h3>${escape(itemById[id].title)}</h3></div><div class="single-actions"><span>${price(itemById[id].priceCents)}</span><button class="remove" data-remove-item="${id}" aria-label="Remove ${escape(itemById[id].title)}">Remove</button></div></article>`).join('');
  for(const stage of stages){
    if(!state.packages.has(stage.id)&&stage.itemIds.every(id=>state.individuals.has(id))) target.insertAdjacentHTML('beforeend',`<div class="upgrade">You’ve selected everything in the ${escape(stage.packageName.toLowerCase())}. Choose the complete package to save 10% and use it over 90 days.<button class="button button-blue" data-toggle-package="${stage.id}">Choose complete package</button></div>`);
  }
  const quote=selectionQuote(state);
  document.querySelector('#selection-pricing').innerHTML=selectedIds(state).size?`<div class="selection-total"><span>${quote.unpriced&&quote.knownTotal?'Priced subtotal':'Estimated total'}</span><span>${quote.unpriced&&!quote.knownTotal?'—':money(quote.knownTotal)}</span></div>${quote.saving?`<p class="selection-price-note">Includes ${money(quote.saving)} in package savings.</p>`:''}${quote.unpriced?'<p class="selection-price-note">Pricing to be confirmed. Your selection is ready to discuss.</p>':''}`:'';
  document.querySelector('#package-terms').hidden=!state.packages.size;
}
function enquiryText() {
  const lines=['MONO / Deep tech enquiry',''];
  const company=document.querySelector('#company').value.trim();
  if(company)lines.push(`Company: ${company}`,'');
  for(const id of state.packages){lines.push(stageById[id].packageName.toUpperCase());stageById[id].itemIds.forEach(item=>lines.push(`- ${itemById[item].title}`));lines.push('Complete package: 10% off the combined item prices. Items usable over 90 days from purchase.','');}
  if(state.individuals.size){lines.push('INDIVIDUAL ITEMS');state.individuals.forEach(id=>lines.push(`- ${itemById[id].title}`));lines.push('');}
  const quote=selectionQuote(state);
  if(quote.unpriced){if(quote.knownTotal)lines.push(`Priced subtotal: ${money(quote.knownTotal)}`);lines.push('Unpriced items/packages: pricing to be confirmed.');}
  else lines.push(`Estimated total: ${money(quote.knownTotal)}`);
  const milestone=document.querySelector('#milestone').value.trim();
  const deadline=document.querySelector('#deadline').value;
  if(milestone)lines.push('','NEXT CONVERSATION OR MILESTONE',milestone);
  if(deadline)lines.push('',`Target date: ${deadline}`);
  lines.push('','Scope, revisions, delivery and scheduling to be agreed.','Review only — nothing has been sent or purchased.');
  return lines.join('\n');
}
document.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target)return;
  if(target.matches('[data-detail]'))openItem(target.dataset.detail,target);
  else if(target.matches('[data-open-selection]')){renderSelection();openDialog(selectionDialog,target);}
  else if(target.matches('[data-close]'))target.closest('dialog').close();
  else if(target.matches('[data-toggle-item]'))toggleItem(target.dataset.toggleItem);
  else if(target.matches('[data-toggle-package]'))togglePackage(target.dataset.togglePackage);
  else if(target.matches('[data-remove-package]')){state.packages.delete(target.dataset.removePackage);refresh();selectionDialog.querySelector('[data-close]').focus();status('Package removed.');}
  else if(target.matches('[data-remove-item]')){
    const id=target.dataset.removeItem;const wasPackage=Boolean(packageContaining(id));removeItem(state,id);refresh();selectionDialog.querySelector('[data-close]').focus();status(wasPackage?'Item removed. The remaining items are now selected individually, without a package discount.':'Item removed.');
  }
});
for(const dialog of [itemDialog,selectionDialog]){
  dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');returnFocus?.focus();});
}
document.querySelector('#brief-form').addEventListener('submit',event=>{
  event.preventDefault();if(!selectedIds(state).size)return;
  document.querySelector('#enquiry-text').value=enquiryText();document.querySelector('#enquiry-preview').hidden=false;
  document.querySelector('#enquiry-title').focus();document.querySelector('#enquiry-preview').scrollIntoView({behavior:'auto',block:'start'});
});
document.querySelector('#brief-form').addEventListener('input',()=>{document.querySelector('#enquiry-preview').hidden=true;});
document.querySelector('#copy-enquiry').addEventListener('click',async()=>{
  const field=document.querySelector('#enquiry-text');
  try{await navigator.clipboard.writeText(field.value);status('Enquiry summary copied.');document.querySelector('#copy-enquiry').textContent='Copied ✓';setTimeout(()=>document.querySelector('#copy-enquiry').textContent='Copy summary',2000);}
  catch{field.focus();field.select();status('Select and copy the enquiry summary using your keyboard or device menu.');}
});
const observer=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){document.querySelectorAll('.stage-nav a').forEach(a=>{if(a.getAttribute('href')===`#${entry.target.id}`)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
},{rootMargin:'-15% 0px -65% 0px',threshold:0});
document.querySelectorAll('.offer-section').forEach(section=>observer.observe(section));
refresh();

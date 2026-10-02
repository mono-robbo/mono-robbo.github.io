'use strict';
const productData = [
  {name:'VISY',tag:'The everyday favourite',description:'A classic, for every occasion.',sizes:['250ml','350ml','600ml','1.5L'],image:'1068ac_3cd64e9a1a2d4f188655858724def48a~mv2.jpg',filename:'VISY%20Range%20%E2%80%93%20250ml%2C%20350ml%2C%20600ml%2C%201_5L.jpg'},
  {name:'Boston',tag:'Clean & considered',description:'Simple shape. Strong presence.',sizes:['300ml','600ml'],image:'1068ac_97b914f50e054df19247754fa02921a5~mv2.jpg',filename:'Boston%20Range%20%E2%80%93%20300ml%2C%20600ml.jpg'},
  {name:'Active',tag:'Made for movement',description:'A refreshing fit for active days.',sizes:['600ml'],image:'1068ac_48e0791eab5848bc8a96609a9bd9b273~mv2.jpg',filename:'Active%20Range%20%E2%80%93%20600ml.jpg'},
  {name:'Square',tag:'A different perspective',description:'A distinctive shape that stands out.',sizes:['250ml','600ml'],image:'1068ac_b01af834c6384360817313dddc8bab0f~mv2.jpg',filename:'Square%20Range%20%E2%80%93%20250ml%2C%20600ml.jpg'}
];
const grid=document.querySelector('#range-grid');
productData.forEach(product=>{
 const card=document.createElement('article');card.className='product-card';
 card.innerHTML=`<div class="product-image"><span class="product-tag">${product.tag}</span><img src="https://static.wixstatic.com/media/${product.image}/v1/fill/w_1400,h_1050,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/${product.filename}" alt="${product.name} bottle range" loading="lazy" width="1400" height="1050"></div><div class="product-info"><div class="product-title"><h3>${product.name}</h3><button class="choose-bottle" type="button" aria-label="Choose ${product.name} bottles">Choose ${product.name}</button></div><p>${product.description}</p><p class="sizes">${product.sizes.join(' / ')}</p></div>`;
 card.querySelector('button').addEventListener('click',()=>{bottle.value=product.name;updateSizes();document.querySelector('#quote').scrollIntoView({behavior:motion()});bottle.focus({preventScroll:true});});grid.append(card);
});
const bottle=document.querySelector('#bottle');const size=document.querySelector('#size');
const motion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
function updateSizes(){const previous=size.value;const options=productData.find(p=>p.name===bottle.value)?.sizes||['250ml','300ml','350ml','600ml','1.5L'];size.replaceChildren(...['Help me choose',...options].map(s=>new Option(s,s)));if(options.includes(previous))size.value=previous;}
bottle.addEventListener('change',updateSizes);
document.querySelectorAll('[data-purpose]').forEach(link=>link.addEventListener('click',()=>{document.querySelector('#purpose').value=link.dataset.purpose;}));
const menu=document.querySelector('.menu-toggle');const navigation=document.querySelector('#navigation');
function closeMenu(){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open menu');navigation.classList.remove('open');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu');navigation.classList.toggle('open',open);});
navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();}});
const form=document.querySelector('#quote-form');const result=document.querySelector('#enquiry-result');let enquiry='';
form.addEventListener('input',()=>{result.hidden=true;});form.addEventListener('change',()=>{result.hidden=true;});
form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const data=new FormData(form);enquiry=`Hello Custom Brand Water,\n\nI'd like a quote for custom branded bottled water.\n\nName: ${data.get('name')}\nBusiness: ${data.get('business')||'Not provided'}\nEmail: ${data.get('email')}\nPhone: ${data.get('phone')||'Not provided'}\n\nBottle range: ${data.get('bottle')}\nSize: ${data.get('size')}\nQuantity: ${data.get('quantity')} bottles\nDelivery postcode: ${data.get('postcode')}\nRequired date: ${data.get('date')||'Flexible — please advise'}\nEnquiry type: ${data.get('purpose')}\n\nAdditional details:\n${data.get('notes')||'None provided'}\n\nPlease let me know about pricing, artwork requirements and timing.\n\nThank you,\n${data.get('name')}`;document.querySelector('#enquiry-text').textContent=enquiry;document.querySelector('#email-enquiry').href=`mailto:info@custombrandwater.com.au?subject=${encodeURIComponent('Custom branded water quote — '+(data.get('business')||data.get('name')))}&body=${encodeURIComponent(enquiry)}`;document.querySelector('#copy-enquiry').textContent='Copy enquiry';result.hidden=false;result.scrollIntoView({behavior:motion(),block:'nearest'});});
document.querySelector('#copy-enquiry').addEventListener('click',async event=>{try{await navigator.clipboard.writeText(enquiry);event.target.textContent='Copied';}catch{event.target.textContent='Select and copy the details above';const range=document.createRange();range.selectNodeContents(document.querySelector('#enquiry-text'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);}});
document.querySelector('#year').textContent=new Date().getFullYear();
const now=new Date();document.querySelector('[name=date]').min=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

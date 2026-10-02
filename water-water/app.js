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
const motion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='off'?'instant':'smooth';
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

// Motion is progressive enhancement. The page remains complete without it.
(() => {
 const root=document.documentElement;
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
 const control=document.querySelector('.motion-control');
 let paused=preference.matches;
 const enabled=()=>!paused&&!preference.matches;
 function applyMotion(){
  root.dataset.motion=enabled()?'on':'off';
  control.setAttribute('aria-pressed',String(!enabled()));
  control.setAttribute('aria-label',enabled()?'Pause animations':'Play animations');
  control.querySelector('.motion-label').textContent=enabled()?'Motion on':'Motion off';
  control.querySelector('.motion-icon').textContent=enabled()?'Ⅱ':'▷';
 }
 applyMotion();
 control.addEventListener('click',()=>{paused=!paused;applyMotion();});
 preference.addEventListener('change',()=>{paused=preference.matches;applyMotion();});

 const title=document.querySelector('#hero-title');
 title.setAttribute('aria-label','Your brand. In good hands.');
 title.innerHTML='<span class="hero-line" aria-hidden="true"><span>Your brand.</span></span><span class="hero-line" aria-hidden="true"><span>In good</span></span><span class="hero-line" aria-hidden="true"><span><em class="hero-word-3">hands.</em></span></span>';

 const tape=document.createElement('div');
 tape.className='brand-tape';tape.setAttribute('aria-hidden','true');
 const tapeCopy='<span class="tape-group"><span>YOUR BRAND.</span><span class="tape-mark">✳</span><em>Beautifully bottled.</em><span class="tape-mark">✳</span><span>MADE FOR YOU.</span><span class="tape-mark">✳</span></span>';
 tape.innerHTML='<div class="tape-track">'+tapeCopy+tapeCopy+'</div>';
 document.querySelector('.proof-strip').after(tape);

 document.querySelectorAll('h2').forEach(heading=>{
  const label=heading.innerText.replace(/\s+/g,' ').trim();
  heading.setAttribute('aria-label',label);
  const lines=heading.innerHTML.split(/<br\s*\/?\s*>/i);
  heading.innerHTML=lines.map((line,index)=>`<span class="headline-line" aria-hidden="true"><span style="--line-delay:${index*85}ms">${line}</span></span>`).join('');
 });

 if('IntersectionObserver' in window){
  const reveals=document.querySelectorAll('.section-head, .product-card, .how>div:first-child, .steps article, .moments>.eyebrow, .moments>h2, .moment-grid article, .trade-statement, .trade-copy, .about>div, .faq>div, .quote-intro, footer>.brand, footer>p');
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}
  }),{threshold:.08,rootMargin:'0px 0px -20px 0px'});
  reveals.forEach(element=>{
   element.classList.add('reveal');
   if(element.getBoundingClientRect().top<innerHeight*.97)element.classList.add('visible');
   else observer.observe(element);
  });
  document.querySelectorAll('.range-grid,.moment-grid').forEach(group=>[...group.children].forEach((el,index)=>{el.style.setProperty('--reveal-delay',`${index%2*90}ms`);}));
  root.classList.add('motion-ready');
  const proof=document.querySelector('.proof-strip');
  const countObserver=new IntersectionObserver(entries=>{
   if(!entries[0].isIntersecting)return;
   countObserver.disconnect();
   proof.querySelectorAll('b').forEach((number,index)=>{
    const label=number.textContent;const target=parseInt(label,10);const suffix=label.replace(/[0-9]/g,'');
    number.setAttribute('aria-label',label);
    if(!enabled())return;
    const start=performance.now()+index*65;
    function count(time){
     if(!enabled()){number.textContent=label;return;}
     const progress=Math.max(0,Math.min(1,(time-start)/1000));
     number.textContent=Math.round(target*(1-Math.pow(1-progress,3)))+suffix;
     if(progress<1)requestAnimationFrame(count);else number.textContent=label;
    }
    requestAnimationFrame(count);
   });
  },{threshold:.3});countObserver.observe(proof);
 }

 const hero=document.querySelector('.hero-visual');
 const trade=document.querySelector('.trade');
 let scheduled=false,pointerX=0,pointerY=0;
 function paint(){
  scheduled=false;
  const full=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  root.style.setProperty('--read-progress',String(Math.min(1,Math.max(0,scrollY/full))));
  root.classList.toggle('scrolled',scrollY>30);
  if(!enabled())return;
  const bounds=hero.getBoundingClientRect();
  if(bounds.bottom>0&&bounds.top<innerHeight){
   const drift=Math.max(-14,Math.min(20,-bounds.top*.035));
   hero.style.setProperty('--hero-x',`${pointerX}px`);
   hero.style.setProperty('--hero-y',`${pointerY+drift}px`);
  }
  const tradeBounds=trade.getBoundingClientRect();
  if(tradeBounds.bottom>0&&tradeBounds.top<innerHeight)trade.style.setProperty('--trade-shift',`${(tradeBounds.top-innerHeight/2)*.045}px`);
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(paint);}}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});schedule();
 hero.addEventListener('pointermove',event=>{
  if(!enabled()||!finePointer.matches)return;
  const rect=hero.getBoundingClientRect();
  pointerX=(event.clientX-rect.left-rect.width/2)*-.016;
  pointerY=(event.clientY-rect.top-rect.height/2)*-.016;schedule();
 },{passive:true});
 hero.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;schedule();});

 document.querySelectorAll('.product-card').forEach(card=>{
  const image=card.querySelector('.product-image');let pending=false,lastX=0,lastY=0;
  card.addEventListener('pointermove',event=>{
   if(!enabled()||!finePointer.matches)return;
   const rect=image.getBoundingClientRect();lastX=(event.clientX-rect.left)/rect.width;lastY=(event.clientY-rect.top)/rect.height;
   if(pending)return;pending=true;
   requestAnimationFrame(()=>{pending=false;image.style.setProperty('--tilt-x',`${(lastY-.5)*-7}deg`);image.style.setProperty('--tilt-y',`${(lastX-.5)*7}deg`);image.style.setProperty('--spot-x',`${lastX*100}%`);image.style.setProperty('--spot-y',`${lastY*100}%`);});
  },{passive:true});
  card.addEventListener('pointerleave',()=>{lastX=.5;lastY=.5;image.style.setProperty('--tilt-x','0deg');image.style.setProperty('--tilt-y','0deg');});
 });

 // A newly chosen bottle must invalidate any previously prepared enquiry.
 document.querySelectorAll('.choose-bottle,[data-purpose]').forEach(button=>button.addEventListener('click',()=>{result.hidden=true;}));
})();

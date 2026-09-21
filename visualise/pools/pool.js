/* Link verified end-to-end at A$90 + A$9 GST in Stripe sandbox. */
const CHECKOUT_URL = 'https://buy.stripe.com/fZubJ1gtqgAJb6FfiBdUY01';
const CHECKOUT_READY = true;
// Initialise measurement before optional media features so analytics still loads
// if a browser cannot support one of the richer video interactions below.
const measurementId = 'G-NHGGBL110F';
const url = new URL(location.href);
let internal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.protocol === 'file:';
try { internal ||= localStorage.getItem('mono_analytics_opt_out') === '1'; } catch (_) {}
const allowed = {utm_source:/^mono_outreach$/,utm_medium:/^email$/,utm_campaign:/^(2026q3_pool_99|2026q3_pool99_batch02)$/,utm_id:/^mo_pool99_(?:01|\d{3})$/,utm_content:/^(control|challenger|challenge)$/,outreach_country:/^au$/,outreach_industry:/^(pool_installer|pool_builder)$/,outreach_variant:/^(control|challenger|challenge)$/,outreach_batch_id:/^mo_2026w[0-9]{2}_[0-9]{2}$/};
const context = {};
const clean = new URL(url.origin + url.pathname);
for (const [key, pattern] of Object.entries(allowed)) { const value = url.searchParams.get(key); if (url.searchParams.getAll(key).length === 1 && value && pattern.test(value)) {context[key]=value;clean.searchParams.set(key,value);} }
if (/^#(package|examples|process|questions|intro)$/.test(url.hash)) clean.hash=url.hash;
if (location.protocol !== 'file:') history.replaceState(null,'',clean);
window.dataLayer=window.dataLayer||[];
function gtag(){window.dataLayer.push(arguments);}
function track(name, props={}) {if(!internal) gtag('event',name,{offer_id:'pool_99_v1',page_version:'cinema_v3_fastvideo',...context,...props});}
function mediaState(video){const error=video.error;return {media_error_code:error?.code||0,network_state:video.networkState,ready_state:video.readyState,current_src:(video.currentSrc||video.getAttribute('src')||video.dataset.src||'').split('/').pop(),connection_type:navigator.connection?.effectiveType||'unknown',save_data:Boolean(navigator.connection?.saveData)};}
if(!internal){window.gtag=gtag;gtag('js',new Date());gtag('config',measurementId,{page_location:clean.href,page_referrer:document.referrer ? new URL(document.referrer).origin+'/' : '',send_page_view:true});const tag=document.createElement('script');tag.async=true;tag.src='https://www.googletagmanager.com/gtag/js?id='+measurementId;document.head.append(tag);track('pool_page_loaded',{landing_hash:clean.hash||'none'});[15,30,60,120].forEach(seconds=>setTimeout(()=>track('pool_time_on_page',{seconds}),seconds*1000));}
const heroVideo=document.querySelector('.hero-background');heroVideo.muted=true;heroVideo.defaultMuted=true;heroVideo.playsInline=true;
const heroMotion=document.querySelector('.hero-motion');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let heroUserPaused=false;
function loadHero(){if(!heroVideo.getAttribute('src'))heroVideo.src=heroVideo.dataset.src;}
function syncHeroButton(){const playing=!heroVideo.paused;heroMotion.textContent=playing?'Pause film':'Play film';heroMotion.setAttribute('aria-label',playing?'Pause background video':'Play background video');}
let heroRequestedAt=0;
heroMotion.addEventListener('click',()=>{if(heroVideo.paused){heroUserPaused=false;const firstLoad=!heroVideo.getAttribute('src');if(firstLoad){loadHero();heroRequestedAt=performance.now();track('pool_video_request',{film_id:'hero',...mediaState(heroVideo)});}heroVideo.play().catch(()=>{});}else{heroUserPaused=true;heroVideo.pause();}});
heroVideo.addEventListener('playing',()=>{syncHeroButton();track('pool_hero_video_play',{startup_ms:heroRequestedAt?Math.round(performance.now()-heroRequestedAt):0,...mediaState(heroVideo)});});heroVideo.addEventListener('pause',syncHeroButton);
// Performance: keep the poster as first paint, then autoplay the tiny silent hero
// after the page is ready. Data Saver and reduced-motion users keep the poster.
function autoplayHero(){
 if(reducedMotion.matches||navigator.connection?.saveData||heroUserPaused||heroVideo.getAttribute('src'))return;
 loadHero(); heroRequestedAt=performance.now();
 track('pool_video_request',{film_id:'hero',...mediaState(heroVideo),autoplay:true});
 heroVideo.play().catch(()=>{});
}
if(document.readyState==='complete') setTimeout(autoplayHero,0);
else addEventListener('load',()=>setTimeout(autoplayHero,0),{once:true});
reducedMotion.addEventListener('change',e=>{if(e.matches){heroUserPaused=true;heroVideo.pause();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)heroVideo.pause();else if(!heroUserPaused&&!reducedMotion.matches&&heroVideo.getAttribute('src'))heroVideo.play().catch(()=>{});});
// Package film and image thumbnails update the existing large viewer without navigation.
const packageViewer=document.querySelector('[data-package-viewer]');
const packageFilm=packageViewer.querySelector('video');
const packageImage=packageViewer.querySelector('img');
const packageItems=[...document.querySelectorAll('[data-package-video],[data-package-image]')];
const packageProgress=new Set();
let packageRequestedAt=0;
let packageUserInteracted=false;
function autoplayPackage(){
 if(packageUserInteracted||reducedMotion.matches||navigator.connection?.saveData||packageFilm.getAttribute('src'))return;
 const videoButton=document.querySelector('[data-package-video]');
 if(!videoButton)return;
 packageFilm.muted=true;packageFilm.defaultMuted=true;packageFilm.autoplay=true;packageFilm.src=videoButton.dataset.packageVideo;packageFilm.load();
 packageRequestedAt=performance.now();track('pool_video_request',{film_id:'package',...mediaState(packageFilm),autoplay:true});
 packageFilm.play().catch(()=>{});
}
const packageSection=document.querySelector('#package');
if('IntersectionObserver' in window&&packageSection){
 const packageObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){autoplayPackage();packageObserver.disconnect();}}),{threshold:.35});
 packageObserver.observe(packageSection);
}
packageItems.forEach((button,index)=>{
 button.setAttribute('aria-pressed',String(index===0));
 button.addEventListener('click',()=>{
  packageUserInteracted=true;
  const isVideo=Boolean(button.dataset.packageVideo);
  const label=button.querySelector('span').textContent.trim();
  if(isVideo){
   packageImage.hidden=true;packageFilm.hidden=false;
   if(!packageFilm.getAttribute('src'))packageFilm.src=button.dataset.packageVideo;
   packageRequestedAt=performance.now();track('pool_video_request',{film_id:'package',...mediaState(packageFilm)});
   packageFilm.play().catch(()=>{});
   packageViewer.querySelector('.media-label').textContent='Package example / 30-second film';
  }else{
   packageFilm.pause();packageFilm.hidden=true;packageImage.hidden=false;
   packageImage.src=button.dataset.packageImage;
   packageImage.alt=button.querySelector('img').alt;
   packageViewer.querySelector('.media-label').textContent='Package example / '+label.split('/').pop().trim();
  }
  packageItems.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  track('pool_package_media_view',{media_type:isVideo?'video':'image',media_id:label.toLowerCase().replace(/[^a-z0-9]+/g,'_')});
 });
});
packageFilm.addEventListener('playing',()=>track('pool_package_video_play',{startup_ms:packageRequestedAt?Math.round(performance.now()-packageRequestedAt):0,...mediaState(packageFilm)}));
packageFilm.addEventListener('pause',()=>{if(!packageFilm.ended)track('pool_package_video_pause',{position_seconds:Math.round(packageFilm.currentTime)});});
packageFilm.addEventListener('seeked',()=>track('pool_package_video_seek',{position_seconds:Math.round(packageFilm.currentTime)}));
packageFilm.addEventListener('timeupdate',()=>{if(!packageFilm.duration)return;[25,50,75].forEach(percent=>{if(packageFilm.currentTime/packageFilm.duration*100>=percent&&!packageProgress.has(percent)){packageProgress.add(percent);track('pool_package_video_progress',{percent});}});});
packageFilm.addEventListener('ended',()=>track('pool_package_video_complete'));
packageFilm.addEventListener('error',()=>track('pool_video_error',{film_id:'package',...mediaState(packageFilm)}));
// Only the three gallery cards open films. No video downloads before interaction.
const filmDialog=document.createElement('dialog');
filmDialog.className='film-lightbox';
filmDialog.setAttribute('aria-labelledby','film-title');
filmDialog.innerHTML='<span class="film-title" id="film-title"></span><button type="button" class="film-close" aria-label="Close video">×</button><div class="film-stage"><video controls playsinline preload="none" controlslist="nodownload nofullscreen" disablepictureinpicture></video><span class="film-watermark" aria-hidden="true">MONOº</span></div><p class="film-error" hidden>Video could not load. Please close and try again.</p>';
document.body.append(filmDialog);
const filmPlayer=filmDialog.querySelector('video');
let filmOpener=null;
let filmProgress=new Set();
let activeFilm='';
let filmRequestedAt=0;
document.querySelectorAll('[data-film]').forEach(button=>button.addEventListener('click',()=>{
 if(!['plunge','family','suburban'].includes(button.dataset.film))return;
 filmOpener=button;activeFilm=button.dataset.film;filmProgress=new Set();
 filmDialog.querySelector('#film-title').textContent=button.querySelector('strong').textContent+' · 30 seconds';
 filmDialog.querySelector('.film-error').hidden=true;
 filmPlayer.poster=button.querySelector('img').src;
 filmPlayer.src='./assets/'+activeFilm+'-film-30s.mp4';
 filmDialog.showModal();document.body.style.overflow='hidden';
 track('pool_video_open',{film_id:activeFilm});
 filmRequestedAt=performance.now();track('pool_video_request',{film_id:activeFilm,...mediaState(filmPlayer)});
 filmPlayer.play().catch(()=>{});
}));
filmDialog.querySelector('.film-close').addEventListener('click',()=>filmDialog.close());
filmDialog.addEventListener('click',e=>{if(e.target===filmDialog){const r=filmDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)filmDialog.close();}});
filmDialog.addEventListener('close',()=>{filmPlayer.pause();filmPlayer.removeAttribute('src');filmPlayer.load();document.body.style.overflow='';filmOpener?.focus();});
filmPlayer.addEventListener('error',()=>{if(filmPlayer.getAttribute('src'))filmDialog.querySelector('.film-error').hidden=false;});
filmPlayer.addEventListener('playing',()=>track('pool_video_play',{film_id:activeFilm,startup_ms:filmRequestedAt?Math.round(performance.now()-filmRequestedAt):0,...mediaState(filmPlayer)}));
filmPlayer.addEventListener('timeupdate',()=>{if(!filmPlayer.duration)return;[25,50,75].forEach(percent=>{if(filmPlayer.currentTime/filmPlayer.duration*100>=percent&&!filmProgress.has(percent)){filmProgress.add(percent);track('pool_video_progress',{film_id:activeFilm,percent});}});});
filmPlayer.addEventListener('ended',()=>track('pool_video_complete',{film_id:activeFilm}));
const dialog=document.querySelector('#notice');
function notice(title,copy){document.querySelector('#notice-title').textContent=title;document.querySelector('#notice-copy').replaceChildren();const p=document.createElement('p');p.textContent=copy;document.querySelector('#notice-copy').append(p);dialog.showModal();}
document.querySelector('.close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
const sampleButtons=[...document.querySelectorAll('[data-checkout]')];
sampleButtons.forEach(button=>{button.textContent='Get your first image free ↗';});
const processSection=document.querySelector('#process');
if(processSection){
 processSection.querySelector('.eyebrow').textContent='A simple first step.';
 processSection.querySelector('h2').innerHTML='Show us the backyard.<br>We’ll show you the possibility.';
 const steps=[...processSection.querySelectorAll('.steps article')];
 const stepCopy=[
  ['Request your free image.','Leave your name and email. There’s no payment required for your first sample image.'],
  ['Email Robin your photos.','Attach clear backyard photos and add a few lines about the pool you’re proposing. Plans and finish references are welcome if you have them.'],
  ['See the idea take shape.','We’ll review your brief, get in touch if anything essential is missing, and create your free sample image.']
 ];
 steps.forEach((step,index)=>{step.querySelector('h3').textContent=stepCopy[index][0];step.querySelector('p').textContent=stepCopy[index][1];});
}
const packageFine=document.querySelector('#package .fine.pale');
if(packageFine)packageFine.innerHTML='Start with a free sample image.<br>Continue with the complete A$99 package when you’re ready.';
const finalFine=document.querySelector('.final .fine');
if(finalFine)finalFine.innerHTML='Email Robin your backyard photos.<br>No payment is required for your first sample image.';
const mobileOffer=document.querySelector('.mobile-bar span');
if(mobileOffer)mobileOffer.innerHTML='<b>First image free</b> / send us your photos';
function openSampleForm(placement){
 const title=document.querySelector('#notice-title');
 const copy=document.querySelector('#notice-copy');
 dialog.querySelector('.eyebrow').textContent='MONOº / Free sample';
 title.textContent='Get your first pool image free.';
 copy.innerHTML='<p>Leave your details, then email Robin your backyard photos and a few lines about the pool you’re proposing.</p><form class="sample-form"><label>First name<input name="firstName" autocomplete="given-name" required></label><label>Last name<input name="lastName" autocomplete="family-name" required></label><label>Email address<input name="email" type="email" autocomplete="email" required></label><button class="button" type="submit">Continue to email Robin ↗</button><p class="sample-form-note">Your email app will open next so you can attach the photos. No payment is required.</p></form>';
 const form=copy.querySelector('form');
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!form.reportValidity())return;
  const data=new FormData(form);
  const first=String(data.get('firstName')).trim();
  const last=String(data.get('lastName')).trim();
  const email=String(data.get('email')).trim();
  const subject=encodeURIComponent('Free pool sample image — '+first+' '+last);
  const body=encodeURIComponent('Hi Robin,\n\nI’d like to get my first pool concept image free.\n\nName: '+first+' '+last+'\nEmail: '+email+'\n\nI’ll attach my backyard photos and include a few notes about the pool I’m proposing.\n\nThanks,\n'+first);
  track('pool_sample_form_complete',{placement});
  location.href='mailto:robin@monohq.co?subject='+subject+'&body='+body;
 });
 dialog.showModal();
 copy.querySelector('input').focus();
 track('pool_sample_form_open',{placement});
}
sampleButtons.forEach(button=>button.addEventListener('click',()=>openSampleForm(button.dataset.checkout)));
document.querySelectorAll('[data-cta]').forEach(a=>a.addEventListener('click',()=>track('pool_offer_navigation',{placement:a.dataset.cta})));
document.querySelectorAll('[data-email]').forEach(a=>a.addEventListener('click',()=>track('pool_email_click',{placement:a.dataset.email})));
document.querySelectorAll('details').forEach((item,index)=>item.addEventListener('toggle',()=>{if(item.open)track('pool_faq_open',{faq_id:'faq_'+(index+1)});}));
document.querySelectorAll('[data-legal]').forEach(b=>b.addEventListener('click',()=>track('pool_legal_open',{document_type:b.dataset.legal})));
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){track('pool_section_view',{section_id:entry.target.dataset.section});observer.unobserve(entry.target);}}),{threshold:0.2});document.querySelectorAll('[data-section]').forEach(s=>observer.observe(s));}
const seen=new Set();addEventListener('scroll',()=>{const total=document.documentElement.scrollHeight-innerHeight;const depth=total>0 ? scrollY/total*100:100;[25,50,75,90].forEach(n=>{if(depth>=n&&!seen.has(n)){seen.add(n);track('pool_scroll_depth',{percent_scrolled:n});}});},{passive:true});

// Measure deliberate interaction separately from passive background playback.
heroMotion.addEventListener('click',()=>track('pool_hero_control',{action:heroUserPaused?'pause':'play'}));
heroVideo.addEventListener('error',()=>track('pool_video_error',{film_id:'hero',...mediaState(heroVideo)}));
filmPlayer.addEventListener('pause',()=>{if(filmDialog.open&&!filmPlayer.ended)track('pool_video_pause',{film_id:activeFilm,position_seconds:Math.round(filmPlayer.currentTime)});});
filmPlayer.addEventListener('seeked',()=>track('pool_video_seek',{film_id:activeFilm,position_seconds:Math.round(filmPlayer.currentTime)}));
filmPlayer.addEventListener('error',()=>{if(filmPlayer.getAttribute('src'))track('pool_video_error',{film_id:activeFilm,...mediaState(filmPlayer)});});
filmDialog.addEventListener('close',()=>track('pool_video_close',{film_id:activeFilm}));
document.querySelectorAll('details').forEach((item,index)=>item.addEventListener('toggle',()=>{if(!item.open)track('pool_faq_close',{faq_id:'faq_'+(index+1)});}));

// Three-way, touch-friendly finish comparison for proposal conversations.
const finishComparison=document.querySelector('[data-finish-comparison]');
if(finishComparison){
 const finishRange=finishComparison.querySelector('[data-finish-range]');
 const finishStage=finishComparison.querySelector('.finish-stage');
 const finishImages=[...finishComparison.querySelectorAll('[data-finish-image]')];
 const finishOptions=[...finishComparison.querySelectorAll('[data-finish-option]')];
 const finishName=finishComparison.querySelector('[data-finish-name]');
 const finishNames=['Light + Coastal','Warm + Natural','Dark + Architectural'];
 let finishPosition=50;
 let dragging=false;
 function setFinish(value){
  const position=Math.max(0,Math.min(100,Number(value)));
  finishPosition=position;
  const progress=position/50;
  const selected=Math.round(progress);
  finishComparison.style.setProperty('--finish-position',position+'%');
  finishImages.forEach((image,index)=>{image.style.opacity=String(Math.max(0,1-Math.abs(progress-index)));image.classList.toggle('is-active',index===selected);});
  finishOptions.forEach((button,index)=>button.setAttribute('aria-pressed',String(index===selected)));
  finishName.textContent=finishNames[selected];
  finishStage.setAttribute('aria-valuenow',String(Math.round(position)));
  finishStage.setAttribute('aria-valuetext',finishNames[selected]);
 }
 function setFromPointer(event){
  const bounds=finishStage.getBoundingClientRect();
  setFinish((event.clientX-bounds.left)/bounds.width*100);
 }
 function finishDrag(){
  if(!dragging)return;
  dragging=false;
  track('pool_finish_compare',{finish_id:finishNames[Math.round(finishPosition/50)].toLowerCase().replace(/[^a-z0-9]+/g,'_')});
 }
 finishStage.setAttribute('role','slider');
 finishStage.setAttribute('tabindex','0');
 finishStage.setAttribute('aria-label','Swipe to compare light, warm and dark pool finishes');
 finishStage.setAttribute('aria-valuemin','0');
 finishStage.setAttribute('aria-valuemax','100');
 finishStage.addEventListener('pointerdown',event=>{dragging=true;finishStage.setPointerCapture(event.pointerId);setFromPointer(event);});
 finishStage.addEventListener('pointermove',event=>{if(dragging)setFromPointer(event);});
 finishStage.addEventListener('pointerup',finishDrag);
 finishStage.addEventListener('pointercancel',finishDrag);
 finishStage.addEventListener('keydown',event=>{
  let next=finishPosition;
  if(event.key==='ArrowLeft'||event.key==='ArrowDown')next-=5;
  else if(event.key==='ArrowRight'||event.key==='ArrowUp')next+=5;
  else if(event.key==='Home')next=0;
  else if(event.key==='End')next=100;
  else return;
  event.preventDefault();setFinish(next);
 });
 finishOptions.forEach((button,index)=>button.addEventListener('click',()=>{setFinish(index*50);track('pool_finish_option',{finish_id:finishNames[index].toLowerCase().replace(/[^a-z0-9]+/g,'_')});}));
 finishRange.value='50';
 setFinish(50);
}

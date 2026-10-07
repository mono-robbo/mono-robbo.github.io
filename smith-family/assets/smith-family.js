(() => {
  'use strict';
  if (window.__smithPortfolioInitialized) return;
  window.__smithPortfolioInitialized = true;
  const track = (name,data={}) => window.SmithAnalytics?.track('smithfamily_' + name,data);
  const films = [
    {id:'bmrg',title:'Our Last Chance — BMRG',duration:'7:23'},
    {id:'main-sequence-interview',title:'Main Sequence — Interview film',duration:'9:23'},
    {id:'advanced-navigation',title:'Advanced Navigation',duration:'2:26'},
    {id:'newera',title:'NewEra — Founder profile',duration:'2:41'},
    {id:'main-sequence-motion',title:'Main Sequence — Motion graphics',duration:'1:28'}
  ];
  const images = [
    {id:'sennheiser-1',title:'Sennheiser — Campaign creative'},
    {id:'sennheiser-4',title:'Sennheiser — Product-film still'},
    {id:'sennheiser-2',title:'Sennheiser — Retail banner'},
    {id:'sennheiser-3',title:'Sennheiser — Campaign adaptation'}
  ];
  const dialog = document.getElementById('work-dialog');
  const slot = dialog.querySelector('.dialog-slot');
  const title = document.getElementById('dialog-title');
  const kind = document.getElementById('dialog-kind');
  const status = dialog.querySelector('.player-status');
  const counter = dialog.querySelector('.dialog-counter');
  const closeButton = dialog.querySelector('.close-button');
  let active = null, opener = null, current = null, ownsHistory = false;
  let dwellLast = performance.now(), pageDwell = 0;
  const sectionTime = new Map(), seen = new Set();
  const sections = [...document.querySelectorAll('[data-section]')];
  const visible = () => document.visibilityState === 'visible';
  const sectionOnscreen = el => {
    const r = el.getBoundingClientRect();
    return Math.min(r.bottom,innerHeight) - Math.max(r.top,0) >= Math.min(150, innerHeight * .25, r.height * .25);
  };
  function tickDwell() {
    const now = performance.now();
    const elapsed = Math.min(2000, Math.max(0,now-dwellLast)); dwellLast = now;
    if (!visible()) return;
    pageDwell += elapsed;
    if (dialog.open) return;
    sections.filter(sectionOnscreen).forEach(el => {
      const id = el.dataset.section;
      if (!seen.has(id)) {seen.add(id);track('section_view',{section_id:id});}
      sectionTime.set(id,(sectionTime.get(id)||0)+elapsed);
    });
  }
  function flushDwell(reason) {
    tickDwell();
    if (pageDwell >= 1000) { track('dwell',{visible_time_ms:pageDwell,dwell_reason:reason});pageDwell=0; }
    for (const [id,ms] of sectionTime) if(ms>=1000) {track('section_dwell',{section_id:id,visible_time_ms:ms,dwell_reason:reason});sectionTime.set(id,0);}
  }
  setInterval(tickDwell,1000);
  setInterval(() => flushDwell('interval'),15000);
  document.addEventListener('visibilitychange',() => {
    if (!visible()) { flushDwell('hidden'); active?.video?.pause(); }
    dwellLast = performance.now();
  });
  addEventListener('pagehide',() => {flushDwell('pagehide');active?.destroy('pagehide');active=null;dwellLast=performance.now();});
  addEventListener('pageshow',() => {dwellLast=performance.now();if(dialog.open&&!active&&current)showMedia(current.id,current.type,false);});
  tickDwell();
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  if (!reduced.matches && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('motion-enabled');
    const observer = new IntersectionObserver(entries=>entries.forEach(e=>{
      if(e.isIntersecting){e.target.classList.remove('pending');observer.unobserve(e.target);}
    }),{threshold:.07,rootMargin:'0px 0px 20px 0px'});
    document.querySelectorAll('.reveal').forEach(el=>{el.classList.add('pending');observer.observe(el);});
    reduced.addEventListener('change',()=>{if(reduced.matches){document.documentElement.classList.remove('motion-enabled');observer.disconnect();}});
  }
  function createPlayer(item,autoPlay) {
    const video=document.createElement('video');
    video.controls=true; video.playsInline=true; video.preload='none'; video.tabIndex=0;
    video.poster='assets/'+item.id+'-still.jpg'; video.setAttribute('aria-label',item.title);
    const requested=performance.now(); let started=false,disposed=false,paused=false,bufferSince=null,previousPosition=0,seekFrom=0;
    const milestones=new Set();
    const watched=()=>{let s=0;for(let i=0;i<video.played.length;i++)s+=video.played.end(i)-video.played.start(i);return s;};
    const emit=(name,extra={})=>{if(!disposed)track('video_'+name,{film_id:item.id,placement:'lightbox',position_seconds:video.currentTime||0,duration_seconds:Number.isFinite(video.duration)?video.duration:0,watched_seconds:watched(),...extra});};
    const flushBuffer=()=>{if(bufferSince!==null){emit('buffering',{action:'ended',buffer_ms:performance.now()-bufferSince});bufferSince=null;}};
    video.addEventListener('playing',()=>{
      if(!started){started=true;emit('start',{startup_ms:performance.now()-requested});}
      else if(paused)emit('resume');
      paused=false;flushBuffer();status.replaceChildren();
    });
    video.addEventListener('pause',()=>{flushBuffer();if(started&&!video.ended){paused=true;emit('pause');}});
    video.addEventListener('timeupdate',()=>{
      if(!video.seeking)previousPosition=video.currentTime;
      if(!started||!Number.isFinite(video.duration)||!video.duration)return;
      const percent=100*watched()/video.duration;
      for(const p of [10,25,50,75,90])if(percent>=p&&!milestones.has(p)){milestones.add(p);emit('progress',{percent:p});}
    });
    video.addEventListener('seeking',()=>{seekFrom=previousPosition;});
    video.addEventListener('seeked',()=>{emit('seek',{from_seconds:seekFrom,to_seconds:video.currentTime});previousPosition=video.currentTime;});
    video.addEventListener('waiting',()=>{if(!video.paused&&!video.seeking&&bufferSince===null){bufferSince=performance.now();emit('buffering',{action:'started'});}});
    video.addEventListener('ended',()=>{flushBuffer();emit('complete',{percent:video.duration?100*watched()/video.duration:0});});
    video.addEventListener('error',()=>{
      if(disposed)return;flushBuffer();emit('error',{media_error_code:video.error?.code||0});
      status.replaceChildren(document.createTextNode('The film couldn’t load.'));
      const retry=document.createElement('button');retry.textContent='Try again';retry.addEventListener('click',()=>{emit('request',{action:'retry'});video.load();video.play().catch(handlePlayError);});status.append(retry);
    });
    function handlePlayError(error){
      if(disposed)return;
      if(error.name==='NotAllowedError'){emit('play_blocked',{action:'blocked'});status.textContent='Press play in the video controls to start.';}
    }
    video.src='media/'+item.id+'.mp4';
    emit('request');slot.replaceChildren(video);
    if(autoPlay)video.play().catch(handlePlayError);
    return {video,destroy(reason){
      if(disposed)return;flushBuffer();emit('summary',{action:reason});emit('close',{action:reason});disposed=true;
      video.pause();video.removeAttribute('src');video.querySelectorAll('source').forEach(x=>x.remove());video.load();video.remove();
    }};
  }
  function showMedia(id,type,autoPlay=true) {
    const list=type==='film'?films:images;const item=list.find(x=>x.id===id);if(!item)return;
    if(active){active.destroy('switch');active=null;}
    flushDwell('interval');current={id,type};slot.replaceChildren();status.replaceChildren();
    dialog.querySelector('.previous').setAttribute('aria-label',type==='film'?'Previous film':'Previous image');dialog.querySelector('.next').setAttribute('aria-label',type==='film'?'Next film':'Next image');
    title.textContent=item.title;kind.textContent=type==='film'?'Selected film':'Selected rollout work';counter.textContent=String(list.indexOf(item)+1).padStart(2,'0')+' / '+String(list.length).padStart(2,'0');
    if(type==='film') {active=createPlayer(item,autoPlay);track('video_open',{film_id:id,placement:'lightbox'});}
    else {
      const image=document.createElement('img');image.src='assets/'+id+'.jpg';image.alt=item.title;slot.append(image);track('image_open',{content_id:id});
      active={destroy(reason){track('image_close',{content_id:id,action:reason});image.remove();}};
    }
    if(!dialog.open){dialog.showModal();document.documentElement.classList.add('modal-open');closeButton.focus({preventScroll:true});}
  }
  function cleanUp(reason) {
    const restoreFocus=dialog.open;
    active?.destroy(reason);active=null;current=null;slot.replaceChildren();status.replaceChildren();
    if(dialog.open)dialog.close();document.documentElement.classList.remove('modal-open');if(restoreFocus)opener?.focus({preventScroll:true});
  }
  function closeMedia(reason) {
    cleanUp(reason);
    if(ownsHistory&&history.state?.smithMedia){ownsHistory=false;history.back();}
    else ownsHistory=false;
  }
  document.querySelectorAll('[data-film],[data-image]').forEach(button=>button.addEventListener('click',()=>{
    opener=button;const type=button.dataset.film?'film':'image';const id=button.dataset.film||button.dataset.image;
    history.pushState({smithMedia:true,id,type},'', '#'+type+'-'+id);ownsHistory=true;showMedia(id,type);
  }));
  closeButton.addEventListener('click',()=>closeMedia('close_button'));
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeMedia('escape');});
  let backdropDown=false;
  const outside=e=>{const r=dialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};
  dialog.addEventListener('pointerdown',e=>{backdropDown=e.target===dialog&&outside(e);});
  dialog.addEventListener('click',e=>{if(backdropDown&&e.target===dialog&&outside(e))closeMedia('backdrop');backdropDown=false;});
  function navigateMedia(delta) {
    if(!current)return;const list=current.type==='film'?films:images;const index=list.findIndex(x=>x.id===current.id);const item=list[(index+delta+list.length)%list.length];
    track('media_switch',{action:delta===1?'next':'previous',media_type:current.type});
    history.replaceState({smithMedia:true,id:item.id,type:current.type},'','#'+current.type+'-'+item.id);showMedia(item.id,current.type);
  }
  dialog.querySelector('.previous').addEventListener('click',()=>navigateMedia(-1));
  dialog.querySelector('.next').addEventListener('click',()=>navigateMedia(1));
  addEventListener('popstate',e=>{
    if(e.state?.smithMedia){ownsHistory=true;showMedia(e.state.id,e.state.type,false);}
    else {ownsHistory=false;cleanUp('back');}
  });
  dialog.addEventListener('close',()=>{if(active)cleanUp('close_button');});
  const contactTargets=Object.freeze({email_contact:'mailto:robin@monohq.co?subject=A%20conversation%20with%20Robin',phone_contact:'tel:+61421489940'});
  document.querySelectorAll('[data-contact]').forEach(button=>button.addEventListener('click',e=>{
    const cta=button.dataset.contact;if(!Object.hasOwn(contactTargets,cta))return;
    track('cta_click',{cta,placement:button.closest('footer')?'footer':'contact'});
    // Contact addresses and phone numbers stay out of automatic outbound-link measurement.
    if(!e.defaultPrevented)location.href=contactTargets[cta];
  }));
  document.addEventListener('click',e=>{
    const a=e.target.closest('a');if(!a)return;
    const href=a.getAttribute('href');
    const placement=a.closest('header')?'header':a.closest('footer')?'footer':a.closest('[data-section]')?.dataset.section||'page';
    const cta=href?.startsWith('mailto:')?'email_contact':href==='#talk'?'contact_section':href==='#interviews'?'explore_work':href==='#top'?'back_to_top':href?.startsWith('https://www.bmrg.org.au/')?'project_source':href?.startsWith('https://monohq.co/')?'mono_home':'section_navigation';
    track('cta_click',{cta,placement});
  });
})();

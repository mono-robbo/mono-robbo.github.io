(() => {
  'use strict';
  const config = window.MONO_ANALYTICS_CONFIG || {};
  const measurementId = config.measurementId || '';
  if (!config.enabled || !/^G-[A-Z0-9]{5,15}$/.test(measurementId)) {
    document.documentElement.dataset.analyticsState = 'disabled'; return;
  }
  const storageKey = config.dryRun ? 'mono_pitch_analytics_qa_choice_v1' : 'mono_pitch_analytics_choice_v1';
  const browserOptOut = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  const canonicalLocation = `${window.location.origin}/ignition/`;
  const pageTitle = 'Ignition × MONO';
  let consent = false, loaded = false, started = false;
  let priorChoice = null;
  try { priorChoice = localStorage.getItem(storageKey); } catch {}
  document.documentElement.dataset.analyticsState = 'off';

  const notice = document.createElement('section');
  notice.className = 'analytics-consent'; notice.hidden = true;
  notice.setAttribute('role','region'); notice.setAttribute('aria-labelledby','analytics-consent-title');
  notice.innerHTML = '<div><h2 id="analytics-consent-title">Optional analytics</h2><p>With your permission, MONO uses Google Analytics to understand visits, scroll depth and film or website interactions. Google processes device and browsing data. We don’t send your name or email. You can change your choice anytime. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google’s privacy policy</a></p><p class="analytics-browser-choice" hidden>Your browser asks not to be tracked, so analytics will stay off.</p></div><div class="analytics-consent-actions"><button type="button" data-choice="denied">Decline</button><button type="button" data-choice="granted">Allow analytics</button></div>';
  const settings = document.createElement('button'); settings.type='button'; settings.className='analytics-settings'; settings.textContent='Privacy choices';
  (document.querySelector('footer') || document.body).append(settings); document.body.append(notice);
  const allow = notice.querySelector('[data-choice="granted"]');
  if (browserOptOut) { allow.disabled=true; notice.querySelector('.analytics-browser-choice').hidden=false; }

  const safeParams = new Set(['percent_scrolled','clip_id','video_percent','video_duration','video_current_time','link_target','link_domain','link_url']);
  function send(name, params = {}) {
    if (!consent || browserOptOut) return;
    const clean = {site_key:config.siteKey || 'ignition_mono',page_location:canonicalLocation,page_title:pageTitle,page_referrer:''};
    for (const [key,value] of Object.entries(params)) if (safeParams.has(key) && (typeof value === 'string' || Number.isFinite(value))) clean[key]=value;
    if (config.dryRun) {
      let output=document.getElementById('analytics-qa-events');
      if (!output) { output=document.createElement('pre'); output.id='analytics-qa-events'; output.hidden=true; output.textContent='[]'; document.body.append(output); }
      const events=JSON.parse(output.textContent); events.push({name,params:clean}); output.textContent=JSON.stringify(events);
      document.documentElement.dataset.analyticsEventCount=String(events.length); return;
    }
    window.gtag('event',name,{...clean,send_to:measurementId});
  }
  function loadTracker() {
    if (loaded || !consent || browserOptOut) return;
    loaded=true;
    if (config.dryRun) return;
    window[`ga-disable-${measurementId}`]=false;
    window.dataLayer=window.dataLayer || [];
    window.gtag=function(){window.dataLayer.push(arguments);};
    window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('js',new Date());
    window.gtag('config',measurementId,{
      send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,
      page_location:canonicalLocation,page_title:pageTitle,page_referrer:'',
      cookie_prefix:'mono_pitch',cookie_domain:window.location.hostname,cookie_expires:2592000,
      cookie_flags:'SameSite=Lax;Secure'
    });
    const script=document.createElement('script'); script.async=true; script.id='mono-ga4-tag';
    script.src=`https://www.googletagmanager.com/gtag/js?id=${measurementId}`; script.referrerPolicy='origin';
    script.onerror=()=>{document.documentElement.dataset.analyticsDelivery='blocked';};
    script.onload=()=>{document.documentElement.dataset.analyticsDelivery='loaded';};
    document.head.append(script);
  }
  function remember(choice) { try { localStorage.setItem(storageKey,choice); } catch {} }
  function forgetCookies() {
    for (const part of document.cookie.split(';')) {
      const name=part.split('=')[0].trim();
      if (!name.startsWith('mono_pitch_')) continue;
      document.cookie=`${name}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie=`${name}=; Max-Age=0; path=/; domain=${window.location.hostname}; SameSite=Lax`;
    }
  }
  function grant(fromUser = false) {
    if (browserOptOut) return;
    consent=true; remember('granted'); notice.hidden=true;
    document.documentElement.dataset.analyticsState=config.dryRun?'qa-consented':'consented';
    loadTracker(); if (!started) { started=true; send('page_view'); }
    if (fromUser) settings.focus({preventScroll:true});
  }
  function deny() {
    const wasLoaded=loaded; consent=false; remember('denied'); notice.hidden=true;
    document.documentElement.dataset.analyticsState='declined';
    window[`ga-disable-${measurementId}`]=true; forgetCookies();
    if (wasLoaded && !config.dryRun) { window.location.reload(); return; }
    settings.focus({preventScroll:true});
  }
  window.addEventListener('storage',event=>{
    if(event.key!==storageKey||event.newValue!=='denied'||!consent)return;
    consent=false; window[`ga-disable-${measurementId}`]=true; forgetCookies(); notice.hidden=true;
    document.documentElement.dataset.analyticsState='declined';
    if(loaded&&!config.dryRun)window.location.reload();
  });
  settings.addEventListener('click',()=>{notice.hidden=false;notice.querySelector('button').focus({preventScroll:true});});
  allow.addEventListener('click',()=>grant(true)); notice.querySelector('[data-choice="denied"]').addEventListener('click',deny);
  if (browserOptOut) { remember('denied'); forgetCookies(); document.documentElement.dataset.analyticsState='browser-opt-out'; }
  else if (priorChoice==='granted') grant();
  else if (priorChoice!=='denied') notice.hidden=false;
  else document.documentElement.dataset.analyticsState='declined';

  const scrollMarks=new Set(); let scrollQueued=false;
  window.addEventListener('scroll',()=>{
    if (!consent || scrollQueued) return; scrollQueued=true;
    window.requestAnimationFrame(()=>{
      scrollQueued=false; const max=document.documentElement.scrollHeight-window.innerHeight;
      if (max<=0) return;
      const percent=Math.min(100,Math.max(0,window.scrollY/max*100));
      for (const mark of [25,50,75,90]) if (percent>=mark && !scrollMarks.has(mark)) { scrollMarks.add(mark); send(`scroll_${mark}`,{percent_scrolled:mark}); }
    });
  },{passive:true});
  document.addEventListener('click',event=>{
    const link=event.target.closest && event.target.closest('a[href]'); if (!link || !consent) return;
    try { const url=new URL(link.href); if (url.hostname==='monohq.co' || url.hostname==='www.monohq.co') send('mono_website_click',{link_target:'mono_website',link_domain:'monohq.co',link_url:'https://monohq.co/'}); } catch {}
  });
  const clips={'main-sequence-motion':'main_sequence','advanced-navigation':'advanced_navigation','sennheiser-sound':'sennheiser_square','sennheiser-portrait':'sennheiser_portrait'};
  document.querySelectorAll('.film-player video').forEach(video=>{
    const clipId=video.dataset.analyticsClip;
    if (!Object.prototype.hasOwnProperty.call(clips,clipId)) return;
    const eventClip=clips[clipId];
    let hasStarted=false; const progress=new Set();
    const info=()=>({clip_id:clipId,video_duration:Math.round(video.duration || 0),video_current_time:Math.round(video.currentTime || 0)});
    video.addEventListener('playing',()=>{if(consent&&!hasStarted){hasStarted=true;send(`video_${eventClip}_start`,info());}});
    video.addEventListener('timeupdate',()=>{
      if(!consent||!hasStarted||!Number.isFinite(video.duration)||video.duration<=0)return;
      const percent=video.currentTime/video.duration*100;
      for(const mark of [25,50,75,90])if(percent>=mark&&!progress.has(mark)){progress.add(mark);send(`video_${eventClip}_progress_${mark}`,{...info(),video_percent:mark});}
    });
    video.addEventListener('pause',()=>{if(consent&&hasStarted&&!video.ended)send(`video_${eventClip}_pause`,info());});
    video.addEventListener('ended',()=>{if(consent&&hasStarted)send(`video_${eventClip}_complete`,{...info(),video_percent:100});});
  });
})();

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const code=readFileSync(new URL('../selected-work/tracking.js',import.meta.url),'utf8');
class Target {
  constructor(){this.handlers=new Map();}
  addEventListener(name,fn){if(!this.handlers.has(name))this.handlers.set(name,new Set());this.handlers.get(name).add(fn);}
  removeEventListener(name,fn){this.handlers.get(name)?.delete(fn);}
  fire(name){for(const fn of this.handlers.get(name)||[])fn({target:this});}
}
function fixture(){
  let clock=0;const events=[];
  const dialog=new Target();dialog.open=false;
  const document=new Target();Object.assign(document,{visibilityState:'visible',querySelector:()=>dialog,querySelectorAll:()=>[],documentElement:{scrollHeight:3000}});
  const window=new Target();Object.assign(window,{document,location:new URL('https://monohq.co/selected-work/'),MONOAnalytics:{track:(name,props)=>events.push({name,...props})},setInterval:()=>0});
  window.window=window;
  const context={window,document,location:window.location,performance:{now:()=>clock},innerHeight:900,innerWidth:1280,scrollY:0,requestAnimationFrame:fn=>fn()};
  vm.runInNewContext(code,context);
  const video=new Target();let ranges=[];
  Object.assign(video,{currentTime:0,duration:30,paused:false,ended:false,seeking:false,volume:1,muted:false,playbackRate:1,played:{get length(){return ranges.length;},start:i=>ranges[i][0],end:i=>ranges[i][1]}});
  const session=window.MONOPortfolioTracking.watchVideo(video,{dataset:{slug:'test-film'}});
  return {video,session,events,document,window,clock:value=>clock=value,ranges:value=>ranges=value};
}
test('startup is first actual playing, buffering does not count as another start, and pause/resume are distinct',()=>{
  const h=fixture();h.clock(400);h.video.fire('playing');h.clock(700);h.video.fire('waiting');h.clock(1200);h.video.fire('playing');
  assert.equal(h.events.filter(e=>e.name==='portfolio_video_start').length,1);
  assert.equal(h.events.find(e=>e.name==='portfolio_video_start').startup_ms,400);
  assert.equal(h.events.find(e=>e.name==='portfolio_video_buffer').buffer_ms,500);
  h.video.fire('pause');h.video.fire('play');
  assert.equal(h.events.filter(e=>e.name==='portfolio_video_pause').length,1);
  assert.equal(h.events.filter(e=>e.name==='portfolio_video_resume').length,1);
});
test('progress uses played ranges; seeking ahead cannot fabricate watching or repeat milestones',()=>{
  const h=fixture();h.video.fire('playing');h.video.currentTime=29;h.ranges([[0,1]]);h.video.fire('timeupdate');
  assert.equal(h.events.filter(e=>e.name==='portfolio_video_progress').length,0);
  h.ranges([[0,8]]);h.video.fire('timeupdate');h.video.fire('timeupdate');
  assert.deepEqual(h.events.filter(e=>e.name==='portfolio_video_progress').map(e=>e.percent),[10,25]);
  h.video.ended=true;h.video.fire('ended');
  assert.equal(h.events.filter(e=>e.name==='portfolio_video_complete').length,1);
  assert.equal(h.events.some(e=>e.name==='portfolio_video_progress'&&e.percent===100),false);
});
test('close records watched seconds and reason, removes listeners and does not log the cleanup pause',()=>{
  const h=fixture();h.video.fire('playing');h.ranges([[0,3],[10,12]]);h.video.currentTime=12;h.session.close('escape');
  const close=h.events.find(e=>e.name==='portfolio_video_close');
  assert.equal(close.seconds,5);assert.equal(close.action,'escape');assert.equal(close.film_id,'test-film');
  const count=h.events.length;h.video.fire('pause');h.video.fire('timeupdate');h.session.emit('portfolio_video_error');
  assert.equal(h.events.length,count);
});

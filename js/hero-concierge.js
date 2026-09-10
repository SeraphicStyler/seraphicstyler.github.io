import { topics } from './concierge-content.js';
import { guideEndpoint } from './concierge-config.js';
/* A local guide to published services. Preset answers stay local; model requests use the configured service endpoint. */
(() => {
  'use strict';
  const card = document.querySelector('.ss-concierge');
  const scene = document.querySelector('.ss-service-story');
  if (!card) return;



  const prompts = {
    difference:'Sourcing or styling?', sourcing:'I know the exact piece', photo:'I only have a photo.', styling:'I need styling direction', pricing:'How does pricing work?',
    gift:'Can I gift this?', verification:'How are pieces checked?', shipping:'Do you ship internationally?',
    group:'I’m buying for a group.', boutique:'I’m buying for a boutique.'
  };
  const thread = card.querySelector('[data-concierge-thread]');
  const form = card.querySelector('[data-concierge-form]');
  const input = form.querySelector('input');
  const submit = form.querySelector('button[type="submit"]');
  const error = card.querySelector('[data-concierge-error]');
  const live = card.querySelector('[data-concierge-live]');
  const reset = card.querySelector('[data-concierge-reset]');
  const more = card.querySelector('[data-concierge-more]');
  const moreToggle = card.querySelector('[data-concierge-more-toggle]');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)');
  let state = 'idle', timers = [], pending = null, exchanges = 0, composing = false;
  let controller=null, generation=0, history=[];
  const opening='A link, a photo, or a wardrobe idea—choose a starting point below.';

  function quiet() { return reduce.matches || document.documentElement.classList.contains('rm'); }
  function clearTimers() { timers.forEach(clearTimeout); timers=[]; }
  function later(fn,delay) { const id=setTimeout(fn,delay); timers.push(id); return id; }
  function nearEnd() { return thread.scrollHeight-thread.scrollTop-thread.clientHeight<56; }
  function follow(wasNear) { if(wasNear) thread.scrollTop=thread.scrollHeight; }
  function makeMessage(kind,text) {
    const p=document.createElement('p'); p.className='ss-message ss-message-'+kind; p.textContent=text; return p;
  }
  function makeActions(actions) {
    const row=document.createElement('div'); row.className='ss-message-actions';
    actions.forEach(([label,href])=>{
      const a=document.createElement('a');
      const localRoutes={'#gift':'#lp-gift','#process':'#lp-how'};
      a.href=document.body.classList.contains('ss-links') && href.startsWith('#') ? (localRoutes[href] || './'+href) : href;
      a.textContent=label+' →'; row.append(a);
    });
    return row;
  }
  function setBusy(busy) {
    state=busy?'preparing':'complete'; input.disabled=busy; submit.disabled=busy;
    card.querySelectorAll('[data-topic]').forEach(button=>button.disabled=busy);
  }
  function emphasize(topic) {
    if (!scene) return;
    scene.querySelectorAll('.ss-story-card').forEach(item=>{
      const active=topic && item.dataset.sceneTopic.split(' ').includes(topic);
      item.classList.toggle('is-discussed',active);
      const note=item.querySelector('.ss-story-discussed'); if(note) note.hidden=!active;
    });
  }
  function prune() {
    const groups=[...thread.querySelectorAll('[data-exchange]')];
    while(groups.length>1) groups.shift().remove();
  }
  function completeAnswer(record,answerNode,group,wasNear) {
    clearTimers(); pending=null; answerNode.textContent=record.answer; answerNode.classList.remove('ss-message-preparing');
    group.append(makeActions(record.actions)); prune(); follow(wasNear); setBusy(false); reset.hidden=false;
    live.textContent=record.answer+' '+record.actions.map(action=>action[0]).join('. ')+'.'; emphasize(record.scene);
    card.classList.add('ss-has-answer');card.classList.remove('ss-show-prompts');more.hidden=true;moreToggle.setAttribute('aria-expanded','false');moreToggle.textContent='Choose another question';
    history.push({role:'assistant',content:record.answer});history=history.slice(-4);
  }
  async function answer(topic,question,useModel=false) {
    if(state==='preparing'||state==='revealing') return;
    let record=topics[topic]||topics.fallback;
    const wasNear=true, turn=++generation; error.textContent=''; setBusy(true); exchanges++;reset.hidden=false;
    thread.replaceChildren();
    card.querySelectorAll('[data-topic]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.topic===topic)));
    const group=document.createElement('div'); group.dataset.exchange=String(exchanges);
    group.append(makeMessage('user',question));
    const answerNode=makeMessage('guide','Preparing the answer…'); answerNode.classList.add('ss-message-preparing'); group.append(answerNode); thread.append(group); follow(wasNear);
    if(useModel && guideEndpoint) {
      controller=new AbortController();const currentController=controller;
      const timeout=setTimeout(()=>currentController.abort(),15000);
      try {
        const response=await fetch(guideEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',body:JSON.stringify({question,history}),signal:currentController.signal});
        if(!response.ok)throw new Error('Unavailable');
        const data=await response.json();
        if(typeof data.answer!=='string'||!data.answer.trim()||data.answer.length>1800)throw new Error('Invalid response');
        record={...record,answer:data.answer,actions:record.actions.slice(0,topic==='photo'||topic==='groupgift'?2:1)};
      } catch {
        if(turn!==generation)return;
        error.textContent='The AI guide is unavailable. Here is the saved service answer; you can also send a personal request.';
      } finally { clearTimeout(timeout);if(controller===currentController)controller=null; }
    } else if(useModel && topic==='fallback') {
      error.textContent='Flexible AI replies are not connected yet. These answers cover the published services.';
    }
    if(turn!==generation)return;
    history.push({role:'user',content:question});
    pending={record,answerNode,group,wasNear};
    later(()=>{
      if(!pending)return; state='revealing'; answerNode.classList.remove('ss-message-preparing'); answerNode.textContent='';
      if(quiet()){ completeAnswer(record,answerNode,group,wasNear); return; }
      const phrases=record.answer.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[record.answer];
      phrases.forEach((phrase,index)=>later(()=>{
        if(!pending)return; answerNode.textContent+=(index?' ':'')+phrase.trim(); follow(wasNear);
        if(index===phrases.length-1) completeAnswer(record,answerNode,group,wasNear);
      },index*145));
    },quiet()?0:260);
  }
  function has(text,terms) {
    return terms.some(term=>{
      if(term.includes(' ')) return text.includes(term);
      const safe=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      return new RegExp('(?:^|\\s)'+safe+'(?:$|\\s)').test(text);
    });
  }
  function classify(raw) {
    const text=raw.toLowerCase().normalize('NFKD').replace(/[^a-z0-9$+\s-]/g,' ').replace(/\s+/g,' ').trim();
    const photo=has(text,['photo','picture','screenshot','image']);
    const identify=has(text,['identify','exact item','exact dress','who made','what brand','where is this from','find the source']);
    const inspiration=has(text,['similar','inspiration','vibe','feeling','like this','alternatives','outfit','outfits','wardrobe','style me','wedding look']);
    const group=has(text,['group','team','sorority','bridal party','matching outfits','twenty people','20 people','bulk']);
    const gift=has(text,['gift','present','recipient']);
    if(has(text,['boutique','resale','reseller','stock my store','wholesale'])) return 'boutique';
    if(group&&gift) return 'groupgift';
    if(group) return 'group';
    if(gift) return 'gift';
    if(has(text,['shipping','ship to','delivery','courier','country','international'])) return 'shipping';
    if(has(text,['in stock','stock available','availability'])) return 'stock';
    if(has(text,['price','pricing','cost','fee','credit','how much'])) return 'pricing';
    if(has(text,['verify','verified','inspect','checked','approval photo','authentic'])) return 'verification';
    if(photo&&!identify&&!inspiration) return 'photo';
    if(identify) return 'trace';
    if(inspiration) return 'styling';
    if(has(text,['difference','versus',' vs ','sourcing or styling','which service'])) return 'difference';
    if(has(text,['shop link','product link','seller link','already found','buy this','purchase this'])) return 'sourcing';
    if(has(text,['trace'])) return 'trace';
    if(has(text,['styling','stylist'])) return 'styling';
    if(has(text,['sourcing','source a piece'])) return 'sourcing';
    return 'fallback';
  }
  function restart() {
    generation++;controller?.abort();controller=null;history=[];
    card.classList.remove('ss-has-answer','ss-show-prompts');
    clearTimers(); pending=null; state='idle'; exchanges=0; input.disabled=false; submit.disabled=false; input.value=''; error.textContent=''; live.textContent='';
    thread.replaceChildren(makeMessage('guide',opening));
    card.querySelectorAll('[data-topic]').forEach(button=>button.setAttribute('aria-pressed','false'));
    more.hidden=true;moreToggle.setAttribute('aria-expanded','false');moreToggle.textContent='See all answers';
    card.querySelectorAll('[data-topic]').forEach(button=>button.disabled=false); reset.hidden=true; emphasize(''); input.focus();
  }
  function finishPending() { if(pending) completeAnswer(pending.record,pending.answerNode,pending.group,pending.wasNear); }

  card.querySelectorAll('[data-topic]').forEach(button=>button.addEventListener('click',()=>answer(button.dataset.topic,prompts[button.dataset.topic]||button.textContent.trim())));
  moreToggle.addEventListener('click',()=>{ const open=more.hidden; more.hidden=!open;card.classList.toggle('ss-show-prompts',open); moreToggle.setAttribute('aria-expanded',String(open)); moreToggle.textContent=open?'Show fewer':card.classList.contains('ss-has-answer')?'Choose another question':'See all answers'; });
  input.addEventListener('compositionstart',()=>{composing=true;}); input.addEventListener('compositionend',()=>{composing=false;});
  form.addEventListener('submit',event=>{ event.preventDefault(); if(composing||state==='preparing'||state==='revealing')return; const question=input.value.trim(); if(!question){error.textContent='Write a short question, or choose one above.';input.focus();return;} answer(classify(question),question,true); input.value=''; });
  reset.addEventListener('click',restart);
  reduce.addEventListener('change',()=>{if(reduce.matches)finishPending();});
  new MutationObserver(()=>{if(document.documentElement.classList.contains('rm'))finishPending();}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  addEventListener('pagehide',()=>{generation++;controller?.abort();clearTimers();},{once:true});

  if(guideEndpoint) {
    card.querySelector('.ss-concierge-label').textContent='AI service guide · Seraphic Styler';
    const disclosure=card.querySelector('.ss-concierge-disclosure');
    disclosure.textContent='AI answers can make mistakes. Questions and recent replies are processed by Cloudflare; avoid sensitive details.';
  }

  card.classList.add('ss-concierge-ready'); card.querySelector('[data-concierge-interactive]').hidden=false;
  let seen=false; try { seen=sessionStorage.getItem('ss-concierge-seen')==='1'; sessionStorage.setItem('ss-concierge-seen','1'); } catch (_) {}
  if(!seen&&!quiet()) document.body.classList.add('ss-concierge-first-visit');
})();

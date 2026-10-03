// Roue mécanique : aucun appel Home Assistant, uniquement le rendu local.
const OASIS_FLAP_SEQUENCE = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:-';
function oasisFlapText(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()
    .replace(/[^ A-Z0-9:\-]/g,' ');
}
class OasisSplitBoard {
  constructor(scroll, body, scheduler, animate = true, rotate = true) {
    this.animate=animate;this.rotate=rotate;
    this.scroll=scroll;this.body=body;this.queue=[];this.frame=0;
    this.scheduler=scheduler;scheduler?.engines.push(this);
    this.check=()=>this.prune();
    this.motion=matchMedia('(prefers-reduced-motion: reduce)');
    this.listen();
  }
  listen() {
    this.scroll.addEventListener('scroll',this.check,{passive:true});
    window.addEventListener('scroll',this.check,{capture:true,passive:true});
    window.addEventListener('resize',this.check,{passive:true});
    document.addEventListener('visibilitychange',this.check);
    this.motion.addEventListener('change',this.check);
  }
  visible(row) {
    if(document.hidden||this.motion.matches||!row.isConnected)return false;
    const r=row.getBoundingClientRect(),s=this.scroll.getBoundingClientRect();
    const header=this.scroll.querySelector('thead').getBoundingClientRect();
    return r.bottom>Math.max(s.top,header.bottom,0)&&r.top<Math.min(s.bottom,innerHeight)
      &&r.right>Math.max(s.left,0)&&r.left<Math.min(s.right,innerWidth);
  }
  flap(char) {
    const el=document.createElement('span');el.className='flap';el.dataset.char=char;
    for(const name of ['fall','rise']){const face=document.createElement('span');face.className='face '+name;el.append(face);}
    return el;
  }
  settle(job) {
    for(const slot of job.slots){slot.el.dataset.char=slot.target;slot.el.classList.remove('flip-a','flip-b');delete slot.el.dataset.old;}
    for(const cell of job.row.children){const display=cell.querySelector('.flap-word');if(display)while(display.children.length>cell._target.length)display.lastChild.remove();}
    job.row.removeAttribute('data-flipping');
  }
  prune() {
    this.queue=this.queue.filter(job=>{if(this.visible(job.row))return true;this.settle(job);return false;});
    if(!this.queue.length){cancelAnimationFrame(this.frame);this.frame=0;}
    this.scheduler?.schedule();
  }
  update(values, message, sharedWidths, instant = false) {
    if(instant)this.stop();
    const initial=!this.initialized;this.initialized=true;
    if(!values.length){this.stop();this.body.replaceChildren();const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=4;cell.textContent=message;row.append(cell);this.body.append(row);return;}
    if(this.body.querySelector('[colspan]'))this.body.replaceChildren();
    // Largeur uniforme par colonne, calculée sur tous les vols, pas seulement les visibles.
    const widths=sharedWidths||[5,Math.max(1,...values.map(v=>oasisFlapText(v[1]).length)),6,Math.max(1,...values.map(v=>oasisFlapText(v[3]).length))];
    const total=widths.reduce((a,b)=>a+b,0);
    this.scroll.style.setProperty('--flap-width',`clamp(.1px,calc((100cqi - 80px) / ${total} - .5px),11px)`);
    let columns=this.scroll.querySelector('colgroup');
    if(!columns){columns=document.createElement('colgroup');this.scroll.querySelector('table').prepend(columns);}
    columns.replaceChildren(...widths.map(count=>{const col=document.createElement('col');col.style.width=`${100*(count+2)/(total+8)}%`;return col;}));
    while(this.body.children.length>values.length){const row=this.body.lastChild;this.queue=this.queue.filter(j=>j.row!==row);row.remove();}
    values.forEach((texts,index)=>{
      let row=this.body.children[index];const added=!row;
      if(added){row=document.createElement('tr');for(let i=0;i<4;i++){const cell=document.createElement('td'),label=document.createElement('span'),word=document.createElement('span');label.className='sr-only';word.className='flap-word';word.setAttribute('aria-hidden','true');cell.append(label,word);row.append(cell);}this.body.append(row);}
      const signature=JSON.stringify([texts,widths]);
      if(row._signature===signature)return;
      row._signature=signature;
      // Une donnée plus récente remplace la cible, sans accumuler d'anciens cycles.
      this.queue=this.queue.filter(j=>j.row!==row);
      const slots=[];
      texts.forEach((text,i)=>{
        let offset=0;
        const cell=row.children[i],word=cell.querySelector('.flap-word'),target=oasisFlapText(text).slice(0,widths[i]).padEnd(widths[i],' ');
        word.style.setProperty('--flap-count',widths[i]);
        cell.title=String(text);cell.querySelector('.sr-only').textContent=String(text);cell._target=target;
        const length=Math.max(word.children.length,target.length);
        while(word.children.length<length)word.append(this.flap(' '));
        [...word.children].forEach((el,n)=>{
          el.classList.remove('flip-a','flip-b');const char=target[n]||' ';
          if(el.dataset.char!==char)slots.push({el,target:char,column:i,start:offset++*22,steps:0,last:0});
        });
      });
      const job={row,slots,start:null};
      if(instant||!this.animate||initial||!slots.length||!this.visible(row))this.settle(job);else this.queue.push(job);
    });
    this.queue.sort((a,b)=>a.row.rowIndex-b.row.rowIndex);
    this.prune();this.schedule();
  }
  schedule(){if(this.scheduler){this.scheduler.schedule();return;}if(this.queue.length&&!this.frame)this.frame=requestAnimationFrame(t=>this.tick(t));}
  tick(time) {
    this.frame=0;this.prune();const job=this.queue[0];if(!job)return;
    if(job.start===null){job.start=time;job.row.dataset.flipping='true';}
    const column=Math.min(...job.slots.filter(s=>!s.done).map(s=>s.column||0));
    const active=job.slots.filter(s=>!s.done&&(s.column||0)===column);
    let pending=false;
    for(const slot of active){
      const elapsed=time-job.start-slot.start;
      if(elapsed<0){pending=true;continue;}
      if(slot.el.dataset.char===slot.target){if(time-slot.last<52)pending=true;continue;}
      pending=true;
      if(slot.steps&&time-slot.last<52)continue;
      const previous=slot.el.dataset.char;
      const from=OASIS_FLAP_SEQUENCE.indexOf(previous),to=OASIS_FLAP_SEQUENCE.indexOf(slot.target),length=OASIS_FLAP_SEQUENCE.length;
      const forward=(to-from+length)%length,backward=(from-to+length)%length;
      const direction=forward<=backward?1:-1;
      slot.el.dataset.direction=direction===1?'forward':'reverse';
      slot.el.dataset.old=previous;
      slot.el.dataset.char=OASIS_FLAP_SEQUENCE[(from+direction+length)%length];
      slot.el.querySelector('.fall').dataset.glyph=previous;
      slot.el.querySelector('.rise').dataset.glyph=slot.el.dataset.char;
      slot.el.classList.remove('flip-a','flip-b');slot.steps++;
      if(this.rotate)slot.el.classList.add(slot.steps%2?'flip-a':'flip-b');
      slot.last=time;
    }
    if(!pending){
      for(const slot of active){slot.done=true;slot.el.classList.remove('flip-a','flip-b');delete slot.el.dataset.old;}
      if(job.slots.some(s=>!s.done))job.start=null;
      else{this.settle(job);this.queue.shift();}
    }
    this.schedule();
  }
  stop(){cancelAnimationFrame(this.frame);this.frame=0;for(const job of this.queue)this.settle(job);this.queue=[];}
  destroy(){this.stop();this.scroll.removeEventListener('scroll',this.check);window.removeEventListener('scroll',this.check,true);window.removeEventListener('resize',this.check);document.removeEventListener('visibilitychange',this.check);this.motion.removeEventListener('change',this.check);}
}
// Une seule horloge d'animation pour la carte entière : jamais deux tableaux actifs.
class OasisBoardScheduler {
  constructor(){this.engines=[];this.frame=0;this.active=null;this.hold=false;this.enabled=true;}
  schedule(){if(this.enabled&&!this.hold&&!this.frame&&this.engines.some(e=>e.queue.length))this.frame=requestAnimationFrame(t=>this.tick(t));}
  tick(time){
    this.frame=0;if(!this.enabled)return;
    if(!this.active?.queue.length)this.active=this.engines.find(e=>e.queue.length)||null;
    if(this.active)this.active.tick(time);
    if(!this.active?.queue.length)this.active=null;
    if(!this.engines.some(e=>e.queue.length)){cancelAnimationFrame(this.frame);this.frame=0;}
    else this.schedule();
  }
  stop(){this.enabled=false;cancelAnimationFrame(this.frame);this.frame=0;this.active=null;}
}

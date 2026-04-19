/* anjan athreya — site scripts */

// ───── custom cursor ─────
(function(){
  const cur = document.querySelector('.cursor-crosshair');
  const trail = document.querySelector('.cursor-trail');
  if(!cur || !trail) return;
  let tx=0,ty=0,cx=0,cy=0;
  document.addEventListener('mousemove',e=>{
    cur.style.transform=`translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
    tx=e.clientX;ty=e.clientY;
  });
  (function loop(){
    cx += (tx-cx)*.18; cy += (ty-cy)*.18;
    trail.style.transform=`translate(${cx}px,${cy}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('a,button,.life-card,.xp-row,.pj-media').forEach(el=>{
    el.addEventListener('mouseenter',()=>{cur.classList.add('hov');trail.classList.add('hov')});
    el.addEventListener('mouseleave',()=>{cur.classList.remove('hov');trail.classList.remove('hov')});
  });
})();

// ───── active nav on scroll ─────
(function(){
  const links = document.querySelectorAll('.topbar nav a');
  const sections = [...document.querySelectorAll('section[id]')];
  window.addEventListener('scroll',()=>{
    let cur='';
    const y = window.scrollY + 140;
    sections.forEach(s=>{ if(y>=s.offsetTop) cur=s.id; });
    links.forEach(l=>l.classList.toggle('active', l.getAttribute('href')===`#${cur}`));
  });
})();

// ───── hero terminal typewriter ─────
(function(){
  const body = document.querySelector('.term-body');
  if(!body) return;
  const lines = [
    {t:'<span class="p">anjan@sbu</span>:<span class="m">~</span>$ whoami'},
    {t:'<span class="c">anjan athreya · cs + applied math, stony brook \'27</span>'},
    {t:' '},
    {t:'<span class="p">anjan@sbu</span>:<span class="m">~</span>$ cat focus.json'},
    {t:'{'},
    {t:'  <span class="k">"role"</span>: <span class="s">"ml research assistant"</span>,'},
    {t:'  <span class="k">"building"</span>: <span class="s">"Circular — adaptive run routes"</span>,'},
    {t:'  <span class="k">"shipping_to"</span>: [<span class="s">"NAI"</span>, <span class="s">"IBM"</span>],'},
    {t:'  <span class="k">"training_for"</span>: <span class="s">"next marathon"</span>,'},
    {t:'  <span class="k">"pcd_status"</span>: <span class="n">"genetic, not limiting"</span>'},
    {t:'}'},
    {t:' '},
    {t:'<span class="p">anjan@sbu</span>:<span class="m">~</span>$ <span class="caret"></span>'}
  ];
  let i=0;
  function addLine(){
    if(i>=lines.length) return;
    const row = document.createElement('div');
    row.className='row';
    row.innerHTML = lines[i].t;
    body.appendChild(row);
    i++;
    setTimeout(addLine, lines[i-1]?.t.length > 30 ? 260 : 160);
  }
  // start after brief delay
  setTimeout(addLine, 600);
})();

// ───── ticker content duplication for seamless loop ─────
(function(){
  const track = document.querySelector('.hero-ticker .track');
  if(!track) return;
  track.innerHTML += track.innerHTML;
})();

// ───── marathon mini-route path draw on view ─────
(function(){
  const path = document.querySelector('#routePath');
  if(!path) return;
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = len;
  const io = new IntersectionObserver((en)=>{
    en.forEach(e=>{ if(e.isIntersecting){ path.style.transition='stroke-dashoffset 3s ease-out'; path.style.strokeDashoffset=0; io.disconnect(); } });
  },{threshold:.35});
  io.observe(path);
})();

// ───── life carousel ─────
(function(){
  const track = document.querySelector('.life-track');
  if(!track) return;
  const cards = [...track.querySelectorAll('.life-card')];
  const strip = document.querySelector('.life-strip');
  const counter = document.querySelector('.life-nav .count');
  let idx = 0;

  function scrollTo(i){
    idx = (i+cards.length)%cards.length;
    const c = cards[idx];
    track.scrollTo({left: c.offsetLeft - (track.clientWidth - c.clientWidth)/2, behavior:'smooth'});
    updateUI();
  }
  function updateUI(){
    strip?.querySelectorAll('.thumb').forEach((t,i)=>t.classList.toggle('active',i===idx));
    if(counter) counter.textContent = `${String(idx+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;
  }

  document.querySelector('.life-prev')?.addEventListener('click',()=>scrollTo(idx-1));
  document.querySelector('.life-next')?.addEventListener('click',()=>scrollTo(idx+1));
  strip?.querySelectorAll('.thumb').forEach((t,i)=>t.addEventListener('click',()=>scrollTo(i)));

  // detect current on scroll
  let scrollT;
  track.addEventListener('scroll',()=>{
    clearTimeout(scrollT);
    scrollT = setTimeout(()=>{
      const mid = track.scrollLeft + track.clientWidth/2;
      let best=0,bestD=Infinity;
      cards.forEach((c,i)=>{
        const cm = c.offsetLeft + c.clientWidth/2;
        const d = Math.abs(cm-mid);
        if(d<bestD){bestD=d;best=i}
      });
      idx=best; updateUI();
    },80);
  });

  updateUI();
})();

// ───── reveal on scroll ─────
(function(){
  const io = new IntersectionObserver((en)=>{
    en.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
})();

// ───── subtle parallax for portrait & edu-hero ─────
(function(){
  const els = document.querySelectorAll('[data-parallax]');
  window.addEventListener('scroll',()=>{
    const y = window.scrollY;
    els.forEach(el=>{
      const speed = parseFloat(el.dataset.parallax)||.15;
      el.style.transform = `translate3d(0, ${(y*speed)%400 * -1}px, 0)`;
    });
  },{passive:true});
})();

// ───── update nav path ─────
(function(){
  const b = document.querySelector('.topbar .path b');
  if(!b) return;
  const map = { hero:'index', about:'about.md', experience:'experience.log', life:'life.jpg', projects:'projects/', skills:'skills.yaml', education:'edu.md', contact:'contact.sh' };
  let cur='index';
  window.addEventListener('scroll',()=>{
    const y = window.scrollY + 140;
    document.querySelectorAll('section[id]').forEach(s=>{ if(y>=s.offsetTop) cur=map[s.id]||cur; });
    if(b.textContent !== cur) b.textContent = cur;
  });
})();

// ───── local time in topbar ─────
(function(){
  const el = document.querySelector('[data-clock]');
  if(!el) return;
  function tick(){
    const d = new Date();
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    const ss = String(d.getSeconds()).padStart(2,'0');
    el.textContent = `${hh}:${mm}:${ss}`;
  }
  tick(); setInterval(tick,1000);
})();

// ───── mouse-tilt for hero cluster + portrait ─────
(function(){
  const targets = document.querySelectorAll('[data-tilt]');
  if(!targets.length) return;
  const range = 8;
  window.addEventListener('mousemove', e=>{
    const cx = window.innerWidth/2, cy = window.innerHeight/2;
    const mx = ((e.clientX - cx) / cx) * range;
    const my = ((e.clientY - cy) / cy) * range;
    targets.forEach(t=>{
      const base = t.dataset.tiltBase || '';
      const sign = t.dataset.tiltSign === '-1' ? -1 : 1;
      t.style.transform = `${base} rotateY(${mx * sign}deg) rotateX(${-my}deg)`;
    });
  },{passive:true});
})();

// ───── scroll-driven 3D depth on cards ─────
(function(){
  const cards = document.querySelectorAll('.pj-media, .life-card, .stats, .edu-card, .manifesto .portrait');
  function update(){
    const vh = window.innerHeight;
    cards.forEach(el=>{
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height/2;
      const t = (mid - vh/2) / (vh/2); // -1 to 1
      const z = Math.max(-120, Math.min(40, -60 * t));
      const ry = t * 3;
      el.style.setProperty('--scroll-z', z+'px');
      el.style.setProperty('--scroll-ry', ry+'deg');
    });
  }
  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
  update();
})();

/* anjan athreya — three.js animated background
   "file system fly-through": floating filename glyphs + falling binary rain + grid tunnel
*/
(function(){
  if (typeof THREE === 'undefined') { console.warn('three.js missing'); return; }

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070a, 0.012);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 30);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const BLUE = 0x3da8ff;
  const BLUE_SOFT = 0x6bc3ff;
  const DEEP = 0x1a4880;

  // ── helper: build a canvas-texture sprite for a filename glyph ──
  function makeTextSprite(text, opts={}){
    const {
      color = '#3da8ff',
      glow  = 'rgba(60,168,255,0.85)',
      bg    = 'rgba(5,7,10,0.78)',
      border= 'rgba(60,168,255,0.85)',
      font  = '600 42px "JetBrains Mono", monospace',
      pad   = 28,
    } = opts;

    const measureCanvas = document.createElement('canvas');
    const mctx = measureCanvas.getContext('2d');
    mctx.font = font;
    const metrics = mctx.measureText(text);
    const w = Math.ceil(metrics.width) + pad*2;
    const h = 72;

    const cvs = document.createElement('canvas');
    cvs.width = w * 2;   // supersample
    cvs.height = h * 2;
    const ctx = cvs.getContext('2d');
    ctx.scale(2,2);

    // bg chip
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,w,h);

    // border
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.75,0.75, w-1.5, h-1.5);

    // left bullet
    ctx.fillStyle = color;
    ctx.fillRect(pad*0.4, h/2-3, 6, 6);

    // text
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 12;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, pad, h/2 + 2);

    const tex = new THREE.CanvasTexture(cvs);
    tex.anisotropy = 4;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipMapLinearFilter;

    const mat = new THREE.SpriteMaterial({ map: tex, transparent:true, depthWrite:false });
    const spr = new THREE.Sprite(mat);
    // world scale roughly matches chip pixel size
    spr.scale.set(w * 0.06, h * 0.06, 1);
    return spr;
  }

  // ── filename library ──────────────────────────
  const FILES = [
    'anjan.jpg',  'anjan.exe',  'anjan.py',   'anjan.md',
    'anjan.tsx',  'anjan.rs',   'anjan.wasm', 'anjan.sh',
    'resume.pdf', 'thoughts.txt', 'build.log', 'portfolio.zip',
    'kernel.c',   'README.md',  'hello.world','dreams.json',
    'ship.it',    'sleep.bak',  'coffee.mp3', 'arxiv.mcp',
    'metamake.py','pytorch.py', 'vllm.py',    'resea.rch',
    'hn.launch',  '404.html',   '.env',       'mem.dump',
  ];

  // cache sprites per-filename (material sharing would be nice but sprite.position is per-mesh so this is fine)
  const fileSprites = [];
  const SPRITE_COUNT = 42;
  for (let i=0; i<SPRITE_COUNT; i++){
    const name = FILES[i % FILES.length];
    // color variety: mostly blue, sometimes a softer cyan tint, sometimes deep
    const variant = Math.random();
    let opts;
    if (variant < 0.15) opts = { color:'#6bc3ff', glow:'rgba(107,195,255,0.8)', border:'rgba(107,195,255,0.7)' };
    else if (variant < 0.25) opts = { color:'#88d4ff', glow:'rgba(136,212,255,0.9)', border:'rgba(136,212,255,0.8)' };
    else opts = {};
    const spr = makeTextSprite(name, opts);
    spr.position.set(
      (Math.random()-0.5) * 140,
      (Math.random()-0.5) * 80,
      -Math.random() * 200
    );
    spr.userData = {
      speed: 0.25 + Math.random() * 0.55,
      floatAmp: 0.5 + Math.random()*0.8,
      floatSpeed: 0.3 + Math.random()*0.7,
      floatPhase: Math.random()*Math.PI*2,
      baseY: spr.position.y,
    };
    // opacity jitter
    spr.material.opacity = 0.55 + Math.random()*0.4;
    scene.add(spr);
    fileSprites.push(spr);
  }

  // ── binary rain (falling 0/1 columns, behind the files) ─
  // One column = a sprite with a vertical string of digits.
  function makeBinaryColumn(){
    const chars = 22;
    const w = 28, h = chars * 26;
    const cvs = document.createElement('canvas');
    cvs.width = w*2; cvs.height = h*2;
    const ctx = cvs.getContext('2d');
    ctx.scale(2,2);
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.textBaseline = 'top';
    for (let i=0;i<chars;i++){
      const alpha = Math.max(0.15, 1 - (i/chars) * 1.1);
      ctx.fillStyle = i === 0
        ? `rgba(180,230,255,${alpha})`   // bright head
        : `rgba(60,168,255,${alpha * 0.8})`;
      ctx.shadowColor = 'rgba(60,168,255,0.9)';
      ctx.shadowBlur = i === 0 ? 14 : 6;
      const ch = Math.random() < 0.5 ? '0' : '1';
      ctx.fillText(ch, 4, i*26);
    }
    const tex = new THREE.CanvasTexture(cvs);
    tex.magFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map:tex, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending });
    const spr = new THREE.Sprite(mat);
    spr.scale.set(w*0.1, h*0.1, 1);
    return spr;
  }
  const rainCols = [];
  for (let i=0;i<34;i++){
    const c = makeBinaryColumn();
    c.position.set(
      (Math.random()-0.5) * 240,
      (Math.random()) * 100 + 20,
      -80 - Math.random() * 180
    );
    c.userData = {
      fallSpeed: 6 + Math.random()*14,
      resetY: 80 + Math.random()*40,
      bottomY: -80 - Math.random()*20,
    };
    c.material.opacity = 0.4 + Math.random()*0.4;
    scene.add(c);
    rainCols.push(c);
  }

  // ── starfield (blue points) ────────────────
  const starGeo = new THREE.BufferGeometry();
  const STAR_COUNT = 1200;
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  for (let i=0;i<STAR_COUNT;i++){
    const r = 250 + Math.random()*450;
    const theta = Math.random()*Math.PI*2;
    const phi = Math.acos(2*Math.random()-1);
    positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = r * Math.cos(phi);
    const tint = Math.random();
    colors[i*3]   = tint * 0.3 + 0.15;
    colors[i*3+1] = tint * 0.55 + 0.4;
    colors[i*3+2] = tint * 0.35 + 0.75;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const starMat = new THREE.PointsMaterial({
    size:1.2, vertexColors:true, transparent:true, opacity:.75,
    sizeAttenuation:true, depthWrite:false
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ── grid tunnel ────────────────────────────
  function buildGrid(intensity){
    const g = new THREE.GridHelper(800, 40, BLUE, DEEP);
    g.material.transparent = true;
    g.material.opacity = intensity;
    g.material.depthWrite = false;
    return g;
  }
  const gridFloor = buildGrid(0.4);
  gridFloor.position.y = -70;
  scene.add(gridFloor);
  const gridCeil = buildGrid(0.22);
  gridCeil.position.y = 70;
  gridCeil.rotation.x = Math.PI;
  scene.add(gridCeil);

  // ── scanning plane ─────────────────────────
  const scanGeo = new THREE.PlaneGeometry(800, 1);
  const scanMat = new THREE.MeshBasicMaterial({ color:BLUE, transparent:true, opacity:0.3, side:THREE.DoubleSide, depthWrite:false });
  const scan = new THREE.Mesh(scanGeo, scanMat);
  scan.rotation.x = Math.PI/2;
  scene.add(scan);

  // ── mouse reactive camera ──────────────────
  let mx=0, my=0, tmx=0, tmy=0;
  window.addEventListener('mousemove', e=>{
    tmx = (e.clientX / window.innerWidth - 0.5);
    tmy = (e.clientY / window.innerHeight - 0.5);
  }, { passive:true });

  // ── scroll ─────────────────────────────────
  let scrollT = 0;
  window.addEventListener('scroll', ()=>{ scrollT = window.scrollY; }, { passive:true });

  // ── resize ─────────────────────────────────
  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── animate ────────────────────────────────
  const clock = new THREE.Clock();
  function animate(){
    const t = clock.getElapsedTime();

    mx += (tmx - mx) * 0.05;
    my += (tmy - my) * 0.05;

    camera.position.x = mx * 6;
    camera.position.y = -my * 4 + Math.sin(t*0.2) * 1.2;
    camera.position.z = 30 - (scrollT * 0.008);
    camera.rotation.y = mx * 0.14;
    camera.rotation.x = -my * 0.09;

    // files drift forward (toward camera) + gentle float
    fileSprites.forEach(s => {
      s.position.z += s.userData.speed * 0.35;
      s.position.y = s.userData.baseY + Math.sin(t * s.userData.floatSpeed + s.userData.floatPhase) * s.userData.floatAmp;
      if (s.position.z > 40){
        s.position.z = -200 - Math.random()*60;
        s.position.x = (Math.random()-0.5) * 140;
        s.userData.baseY = (Math.random()-0.5) * 80;
      }
      // fade in as they approach
      const dist = s.position.z;
      const fade = Math.max(0, Math.min(1, (dist + 160) / 120));
      s.material.opacity = 0.25 + fade * 0.7;
    });

    // binary rain falls
    rainCols.forEach(c => {
      c.position.y -= c.userData.fallSpeed * 0.016;
      if (c.position.y < c.userData.bottomY){
        c.position.y = c.userData.resetY;
        c.position.x = (Math.random()-0.5) * 240;
        c.position.z = -80 - Math.random() * 180;
      }
    });

    // grid scroll
    gridFloor.position.z = ((t * 18) % 40) - 20;
    gridCeil.position.z  = ((t * 18) % 40) - 20;

    // stars
    stars.rotation.y = t * 0.008;
    stars.rotation.x = t * 0.004;

    // scan bar
    scan.position.z = -((t * 35) % 300) + 40;
    scan.material.opacity = 0.2 + Math.sin(t*2.5) * 0.1;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
})();

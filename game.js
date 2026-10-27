/* ============================================================
   DOTA 3 — мини-MOBA на three.js (r128)
   Аркадий (ты) против лорда Моркуса. Снеси башни и Трон сумрака!
   ============================================================ */
(function () {
'use strict';

/* ---------- ожидание three.js (локальный файл / CDN-fallback) ---------- */
(function waitThree() {
  if (window.THREE) { setTimeout(boot, 0); return; } // отложить: дождаться инициализации let/const ниже
  let tries = 0;
  const iv = setInterval(function () {
    tries++;
    if (window.THREE) { clearInterval(iv); boot(); }
    else if (tries > 300) {
      clearInterval(iv);
      document.getElementById('startscreen').innerHTML =
        '<div id="startcard"><h1 style="font-size:40px">ОШИБКА</h1><div class="sub">не удалось загрузить three.js</div>' +
        '<div class="fine">Кладите файл three.min.js рядом с index.html или включите интернет.</div></div>';
    }
  }, 40);
})();

/* ============================ ДАННЫЕ ============================ */
/* Герои — оригинальные архетипы в духе классической MOBA (имена собственные). */
let ABIL = null;      // кит выбранного героя (переназначается при старте)
const HEROES = [
  { id:'ignara', letter:'И', name:'Игнара', title:'Повелительница пламени', role:'маг · урон',
    letterCol:'#ffb37a', icon:'🔥',
    hpMul:0.92, manaMul:1.2, speedMul:1.0, dmgMul:1.18, atkRange:6.2,
    cloth:0xb04328, armor:0x6d2412, trim:0xe8b45a, glow:0xff8a3a, cape:0x8a2a14, dark:0x2b140c,
    style:'mage',
    abils:[
      { key:'Q',   type:'proj', pcolor:0xff8b2a, paoe:4.2, slow:0, name:'Огненный шар', icon:'🔥', mana:60,  cd:4,  minLvl:1, desc:'снаряд, взрыв по области' },
      { key:'SPC', type:'dash', dashDist:12, name:'Рывок', icon:'💨', mana:40,  cd:6,  minLvl:1, desc:'бросок вперёд, урон по пути' },
      { key:'E',   type:'nova', ncolor:0xffa24a, nrad:6.2, slow:2, dmgB:100, dmgL:13, name:'Вихрь огня', icon:'🌀', mana:80,  cd:8,  minLvl:1, desc:'урон + замедление вокруг' },
      { key:'R',   type:'meteor', mcolor:0xff8a3a, name:'Метеор', icon:'☄️', mana:200, cd:45, minLvl:4, desc:'с неба падает метеор' },
    ]},
  { id:'krissa', letter:'К', name:'Криста', title:'Ледяная дева', role:'маг · контроль',
    letterCol:'#9fd9ff', icon:'❄️',
    hpMul:0.9, manaMul:1.35, speedMul:1.05, dmgMul:1.02, atkRange:6.2,
    cloth:0x3f7fae, armor:0x2a4f6e, trim:0xcfe8ff, glow:0x8fe6ff, cape:0x22517a, dark:0x14273a,
    style:'mage',
    abils:[
      { key:'Q',   type:'proj', pcolor:0x9fe8ff, paoe:3.2, slow:2.6, name:'Осколок льда', icon:'❄️', mana:55,  cd:3.5, minLvl:1, desc:'снаряд, сильно замедляет' },
      { key:'SPC', type:'blink', name:'Миг', icon:'✳️', mana:55,  cd:7,  minLvl:1, desc:'мгновенный перенос к точке' },
      { key:'E',   type:'nova', ncolor:0x9fe8ff, nrad:6.4, slow:3, dmgB:90, dmgL:12, name:'Ледяная волна', icon:'🔮', mana:80,  cd:8,  minLvl:1, desc:'урон + долгое замедление' },
      { key:'R',   type:'blizzard', mcolor:0x9fe8ff, name:'Метель', icon:'🌨️', mana:220, cd:50, minLvl:4, desc:'ледяные осколки бьют область' },
    ]},
  { id:'bastion', letter:'Б', name:'Бастион', title:'Страж рассвета', role:'боец · живучесть',
    letterCol:'#ffe08a', icon:'🛡️',
    hpMul:1.28, manaMul:0.8, speedMul:0.94, dmgMul:0.95, atkRange:5.6,
    cloth:0x3d5a8a, armor:0x46586e, trim:0xe8c56a, glow:0xffd257, cape:0x24406e, dark:0x1c2230,
    style:'knight',
    abils:[
      { key:'Q',   type:'proj', pcolor:0xd8e2ea, paoe:3.6, slow:1.2, name:'Ударная волна', icon:'💥', mana:50,  cd:5,  minLvl:1, desc:'стальная волна выбивает дух' },
      { key:'SPC', type:'dash', dashDist:20, name:'Натиск', icon:'🌪️', mana:45,  cd:7,  minLvl:1, desc:'длинный рывок с бременем' },
      { key:'E',   type:'nova', ncolor:0xffd257, nrad:5.4, slow:2.6, dmgB:85, dmgL:10, name:'Молот и станина', icon:'🔨', mana:60,  cd:9,  minLvl:1, desc:'оглушительный удар в округе' },
      { key:'R',   type:'bulwark', name:'Баррикада', icon:'🧱', mana:150, cd:40, minLvl:4, desc:'щит держит часть урона' },
    ]},
  { id:'morgus', letter:'М', name:'Моркус', title:'Повелитель сумрака', role:'тёмный маг · босс',
    letterCol:'#c9a7ff', icon:'🌑',
    hpMul:1.0, manaMul:1.1, speedMul:1.0, dmgMul:1.08, atkRange:5.6,
    cloth:0x4a2f6e, armor:0x33224a, trim:0xb28a4a, glow:0xb26cff, cape:0x2a1740, dark:0x1b1028,
    style:'dark',
    abils:[
      { key:'Q',   type:'proj', pcolor:0xb26cff, paoe:3.8, slow:1.4, name:'Стрела бездны', icon:'🌑', mana:60,  cd:4.5, minLvl:1, desc:'тёмный снаряд, слабое замедление' },
      { key:'SPC', type:'blink', name:'Рыскание', icon:'✳️', mana:50,  cd:8,  minLvl:1, desc:'шаг сквозь тень' },
      { key:'E',   type:'nova', ncolor:0xb26cff, nrad:6.0, slow:2.2, dmgB:95, dmgL:12, name:'Тень бездны', icon:'🔮', mana:80,  cd:9,  minLvl:1, desc:'волна тьмы вокруг' },
      { key:'R',   type:'meteor', mcolor:0xb26cff, name:'Слёзный камень', icon:'☄️', mana:200, cd:45, minLvl:4, desc:'падает камень бездны' },
    ]},
];
function heroDefBySel(id){ const i=HEROES.findIndex(h=>h.id===id); return HEROES[i<0?0:i]; }
let heroSel='ignara';
ABIL = HEROES[0].abils;      // дефолтный кит до выбора
const ITEMS = [
  { id:'sword', icon:'⚔️', name:'Меч Бездны',  price:550, once:false, desc:'+10 к урону. Стакается.' },
  { id:'armor', icon:'🛡️', name:'Панцирь',     price:500, once:false, desc:'+4 брони. Стакается.' },
  { id:'boots', icon:'👟', name:'Сапоги Ветра',price:350, once:true,  desc:'+2.2 к скорости хода.' },
  { id:'regen', icon:'🌿', name:'Травник',     price:450, once:true,  desc:'+6 HP в секунду.' },
  { id:'elix',  icon:'🍷', name:'Эликсир',     price:300, once:false, desc:'Полное восстановление HP/маны.' },
  { id:'tp',    icon:'📜', name:'Свиток ТП',   price:100, once:false, desc:'Телепорт к трону! Клавиша T.' },
  { id:'vamp',  icon:'🩸', name:'Клык Вампира', price:650, once:false, desc:'+12% вампиризма от атак. Стакается.' },
  { id:'ring',  icon:'💠', name:'Кольцо Стихий',price:600, once:true,  desc:'+80 маны и +3 маны в секунду.' },
  { id:'tome',  icon:'📖', name:'Фолиант Знаний', price:420, once:false, desc:'Мгновенно +260 опыта.' },
];
const BASE = [ {x:-75,z:0}, {x:75,z:0} ];   // база света / база сумрака
const LANE = [-45,-22,0,22,45];
const TOWER_X = [24, 48];                  // mirrored для team 1

/* ============================ СОСТОЯНИЕ ============================ */
let scene, camera, renderer, clock;
let started=false, over=false, paused=false;
let frames=0, fpsT=0, fpsNow=0;
let gameTime=0, waveTimer=0, firstBlood=false;
let dashTag=1;
const heroes=[], creeps=[], towers=[], ancients=[], projectiles=[], meteors=[], fountains=[];
const partsP=[], ringsP=[], textsP=[];
const decalsP=[], beamsP=[];
let glowTex=null, crackTex=null;
let player=null, bot=null;
let itemCounts={};
let camYaw = Math.PI - 0.35, camDist = 38, camLock = false;
const PITCH = 0.84;
const camPos = { x:null, z:null };   // свободная точка камеры (как в Доте)
let shakeAmp = 0, texGrass = null, texDirt = null, tmpCol = new THREE.Color(0,0,0);
let hemiL=null, sunL=null, ambL=null, dayCol=null, nightCol=null;
let nightK=0, lastPhase='day', runeT=90, fountainTick=0;
const runes=[]; let roshan=null;
const camps=[], jcamps=[];
const CAMP_POS=[ {x:-58,z:36,tier:1}, {x:58,z:-36,tier:2} ];
let waveCount=0;
let skyDome=null, stars=null, sunSpr=null, moonSpr=null;
const clouds=[]; let waterTex=null;
const lanterns=[], flags=[];
let musOn=false, musicIv=null, musStep=0;
const RUNE_COLORS={ bounty:0xffd257, water:0x66d9ff, haste:0xff9a3a };
const RUNE_WORD  ={ bounty:'золота', water:'воды', haste:'ускорения' };
const mouse = { x:0, y:0, px:-1, py:-1, inGame:false };
const keys = new Set();            // зажатые клавиши (WASD-бег)
const camFwd = { x:1, z:0 };       //куда смотрит камера — для WASD
let mmCtx=null, lookT=null, pvS={x:0,z:0}, pPrev=null, botThinkAcc=0, shopOpenEl=null;
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const G=e=>e.group.position;
const dist2D=(a,b)=>Math.hypot(a.x-b.x, a.z-b.z);

/* ============================ ЗВУК ============================ */
let AC=null, muted=false;
function ensureAudio(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ AC=null; } }
  if(AC && AC.state==='suspended') AC.resume(); }
function beep(f,d,type,vol,slide){ if(!AC) return; const o=AC.createOscillator(), g=AC.createGain();
  o.type=type||'sine'; o.frequency.setValueAtTime(f, AC.currentTime);
  if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,slide), AC.currentTime+d);
  g.gain.setValueAtTime(vol||0.12, AC.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime+d);
  o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime+d+0.02); }
function noiseBurst(dur,vol,freq){ if(!AC) return;
  const n=Math.floor(AC.sampleRate*dur), buf=AC.createBuffer(1,n,AC.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
  const src=AC.createBufferSource(); src.buffer=buf;
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=freq||400;
  const g=AC.createGain(); g.gain.value=vol||0.25;
  src.connect(f); f.connect(g); g.connect(AC.destination); src.start(); }
// «анонансер» — голосовые фразы локальным синтезатором речи
function say(text){
  if(muted) return;
  try{
    if(!('speechSynthesis' in window)) return;
    const u=new SpeechSynthesisUtterance(text);
    u.lang='ru-RU'; u.rate=0.95; u.pitch=0.72; u.volume=0.9;
    const ru=speechSynthesis.getVoices().find(v=>/ru/i.test(v.lang));
    if(ru) u.voice=ru;
    speechSynthesis.speak(u);
  }catch(e){}
}
function sfx(n){ if(n) ensureAudio(); if(!AC||muted) return;
  switch(n){
    case 'hit':    beep(190,0.07,'square',0.06,110); break;
    case 'bolt':   beep(720,0.09,'triangle',0.05,240); break;
    case 'fire':   beep(300,0.3,'sawtooth',0.16,80); noiseBurst(0.25,0.1,700); break;
    case 'nova':   beep(880,0.5,'triangle',0.18,110); beep(440,0.5,'sine',0.12,220); break;
    case 'dash':   beep(240,0.2,'sine',0.14,900); break;
    case 'meteor': beep(110,1.0,'sawtooth',0.16,35); break;
    case 'boom':   beep(60,0.6,'square',0.24,28); noiseBurst(0.5,0.3,320); break;
    case 'shield': beep(520,0.12,'sine',0.1,760); break;
    case 'first':  beep(180,0.3,'square',0.18,90); setTimeout(()=>{beep(360,0.22,'square',0.16,180); noiseBurst(0.4,0.22,280);},140); break;
    case 'level':  [660,880,1100,1320].forEach((f,i)=>setTimeout(()=>beep(f,0.14,'sine',0.14),i*70)); break;
    case 'coin':   beep(1180,0.05,'triangle',0.07); setTimeout(()=>beep(1560,0.07,'triangle',0.07),50); break;
    case 'buy':    beep(880,0.08,'triangle',0.12); setTimeout(()=>beep(1320,0.12,'triangle',0.12),80); break;
    case 'order':  beep(700,0.04,'sine',0.05); break;
    case 'towerfall': beep(200,0.7,'sawtooth',0.18,45); noiseBurst(0.6,0.28,240); break;
    case 'deny':   beep(140,0.12,'square',0.08,90); break;
    case 'win':    [523,659,784,1046,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,0.3,'triangle',0.16),i*160)); break;
    case 'lose':   beep(220,0.7,'sawtooth',0.16,55); setTimeout(()=>beep(150,0.9,'sawtooth',0.16,40),500); break;
    case 'start':  noiseBurst(0.18,0.32,180); setTimeout(()=>noiseBurst(0.18,0.32,180),220);
                   setTimeout(()=>{noiseBurst(0.18,0.32,180); beep(392,0.5,'triangle',0.14);},440);
                   setTimeout(()=>beep(523,0.6,'triangle',0.14),600); break;
  } }

/* эмбиент-музыка: тихие аккордовые пэды, громкость почти шёпотная */
const MUS_CHORDS=[[220,277.18,329.63],[174.61,220,261.63],[196,233.08,293.66],[164.81,196,246.94]];
function padNote(f,t0,dur,vol){
  const o=AC.createOscillator(), o2=AC.createOscillator(), g=AC.createGain();
  o.type='sine'; o2.type='sine';
  o.frequency.value=f; o2.frequency.value=f*1.004;
  g.gain.setValueAtTime(0.0001,t0);
  g.gain.linearRampToValueAtTime(vol, t0+dur*0.35);
  g.gain.linearRampToValueAtTime(0.0001, t0+dur);
  o.connect(g); o2.connect(g); g.connect(AC.destination);
  o.start(t0); o2.start(t0); o.stop(t0+dur+0.1); o2.stop(t0+dur+0.1);
}
function startMusic(){
  if(musOn||!AC) return; musOn=true;
  musicIv=setInterval(()=>{
    if(!AC||muted||paused) return;
    if(AC.state!=='running'){ try{ AC.resume(); }catch(e){} }
    const ch=MUS_CHORDS[musStep%MUS_CHORDS.length];
    const t0=AC.currentTime+0.05, dur=3.8;
    padNote(ch[0]/2, t0, dur, 0.045);
    padNote(ch[1],   t0, dur, 0.026);
    padNote(ch[2],   t0, dur, 0.024);
    if(musStep%2===0) padNote(ch[0]*2, t0, 2.4, 0.0135);
    musStep++;
  }, 3600);
}

/* ============================ СЦЕНА / МИР ============================ */
function boot() {
  clock = new THREE.Clock();
  renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.88;
  renderer.domElement.className = 'game';
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x86b2da);
  dayCol = new THREE.Color(0x86b2da);
  nightCol = new THREE.Color(0x0c1230);
  scene.fog = new THREE.Fog(0x86b2da, 110, 300);
  camera = new THREE.PerspectiveCamera(50, innerWidth/innerHeight, 0.1, 600);

  hemiL = new THREE.HemisphereLight(0xb9c8ff, 0x2e3d22, 0.45); scene.add(hemiL);
  const sun = new THREE.DirectionalLight(0xffd9a8, 1.35);
  sunL = sun;
  sun.position.set(60, 90, 25); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006;
  sun.shadow.camera.left=-125; sun.shadow.camera.right=125;
  sun.shadow.camera.top=125; sun.shadow.camera.bottom=-125;
  sun.shadow.camera.near=20; sun.shadow.camera.far=400;
  scene.add(sun);
  ambL = new THREE.AmbientLight(0xffffff, 0.12); scene.add(ambL);

  buildSky();
  buildTerrain();
  initFXPools();
  buildWorld();
  initHUD();
  initInput();

  addEventListener('resize', () => {
    camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  updateCamera(1); // ставим камеру в стартовую точку
  animate();
}

function makeNoiseTex(base, spots, n, rep){
  const c=document.createElement('canvas'); c.width=c.height=512; const g=c.getContext('2d');
  g.fillStyle=base; g.fillRect(0,0,512,512);
  for(let i=0;i<n;i++){ g.fillStyle=spots[Math.floor(Math.random()*spots.length)];
    g.globalAlpha = 0.05+Math.random()*0.11;
    const r=3+Math.random()*24; g.beginPath();
    g.arc(Math.random()*512, Math.random()*512, r, 0, 7); g.fill(); }
  g.globalAlpha=1;                              // зерно
  for(let i=0;i<3200;i++){ g.fillStyle='rgba(0,0,0,'+(Math.random()*0.05)+')';
    g.fillRect(Math.random()*512, Math.random()*512, 2, 2);
    if (i%3===0){ g.fillStyle='rgba(255,255,255,'+(Math.random()*0.04)+')';
      g.fillRect(Math.random()*512, Math.random()*512, 2, 2); } }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.repeat.set(rep,rep); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; return t;
}
/* кирпичная кладка (башни/трон) — как в Доте каменная, но своя */
function makeBrickTex(){
  const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d');
  g.fillStyle='#3d4148'; g.fillRect(0,0,256,256);
  const bh=16, bw=42, br=[106,111,122], bg=0x9aa4b6;
  for(let row=0; row<17; row++){
    const off=(row%2)? bw/2 : 0;
    for(let col=-1; col<8; col++){
      const sh=0.72+Math.random()*0.4;
      const r=Math.min(255,(br[0]*sh)|0), gg=Math.min(255,(br[1]*sh)|0), b=Math.min(255,(br[2]*sh)|0);
      g.fillStyle='rgb('+r+','+gg+','+b+')';
      g.fillRect(col*bw+off+2, row*bh+2, bw-4, bh-4);
      g.fillStyle='rgba(255,255,255,'+(Math.random()*0.09)+')';
      g.fillRect(col*bw+off+2, row*bh+2, bw-4, 2);
      g.fillStyle='rgba(0,0,0,'+(0.08+Math.random()*0.14)+')';
      g.fillRect(col*bw+off+2, row*bh+bh-4, bw-4, 3);
    }
  }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.encoding=THREE.sRGBEncoding; t.anisotropy=8; return t;
}
let brickTex=null;

/* blob-тень: мягкий чёрный овал под юнитом (читаемость positioned в доте) */
let blobTex=null;
function makeBlobTex(){
  const c=document.createElement('canvas'); c.width=c.height=128;
  const g=c.getContext('2d');
  const gr=g.createRadialGradient(64,64,6,64,64,62);
  gr.addColorStop(0,'rgba(0,0,0,0.42)'); gr.addColorStop(0.6,'rgba(0,0,0,0.25)');
  gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr; g.fillRect(0,0,128,128);
  const t=new THREE.CanvasTexture(c); return t;
}
function addBlob(ent, s){
  if(!blobTex) blobTex=makeBlobTex();
  const m=new THREE.Mesh(new THREE.PlaneGeometry(s,s),
    new THREE.MeshBasicMaterial({ map:blobTex, transparent:true, depthWrite:false }));
  m.rotation.x=-Math.PI/2; m.position.set(G(ent).x,0.055,G(ent).z);
  m.visible=false; m.renderOrder=1;
  scene.add(m); ent.blob=m; return m;
}

/* ---------- небо: купол, звёзды, светила, облака ---------- */
function radialTex(inner, mid, size){
  size=size||128;
  const c=document.createElement('canvas'); c.width=c.height=size;
  const g=c.getContext('2d');
  const gr=g.createRadialGradient(size/2,size/2,0, size/2,size/2,size/2);
  gr.addColorStop(0,inner); gr.addColorStop(0.35,mid); gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr; g.fillRect(0,0,size,size);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; return t;
}
function buildSky(){
  const c=document.createElement('canvas'); c.width=16; c.height=256;
  const g=c.getContext('2d');
  const gr=g.createLinearGradient(0,0,0,256);
  gr.addColorStop(0,'#2f5fa8'); gr.addColorStop(0.5,'#7fa4d8');
  gr.addColorStop(0.78,'#c8d8ec'); gr.addColorStop(0.92,'#f0d8a8'); gr.addColorStop(1,'#e8dcc0');
  g.fillStyle=gr; g.fillRect(0,0,16,256);
  const skyTex=new THREE.CanvasTexture(c); skyTex.encoding=THREE.sRGBEncoding;
  skyDome=new THREE.Mesh(new THREE.SphereGeometry(420,28,18),
    new THREE.MeshBasicMaterial({ map:skyTex, side:THREE.BackSide, fog:false, depthWrite:false }));
  scene.add(skyDome);
  // звёзды (появляются ночью)
  const n=460, pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){ const th=rand(0,Math.PI*2), ph=rand(0.02,1.35), r=400;
    pos[i*3]=Math.sin(ph)*Math.cos(th)*r; pos[i*3+1]=Math.cos(ph)*r*0.85+20; pos[i*3+2]=Math.sin(ph)*Math.sin(th)*r; }
  const gg=new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(pos,3));
  stars=new THREE.Points(gg, new THREE.PointsMaterial({ color:0xe8f0ff, size:2, sizeAttenuation:false,
    transparent:true, opacity:0, fog:false, depthWrite:false }));
  scene.add(stars);
  // солнце и луна
  sunSpr=new THREE.Sprite(new THREE.SpriteMaterial({
    map:radialTex('rgba(255,246,220,1)','rgba(255,198,120,0.5)'), transparent:true, opacity:0.95, fog:false, depthWrite:false }));
  sunSpr.scale.setScalar(95); sunSpr.position.set(170,180,-60); scene.add(sunSpr);
  moonSpr=new THREE.Sprite(new THREE.SpriteMaterial({
    map:radialTex('rgba(236,244,255,1)','rgba(150,178,255,0.3)'), transparent:true, opacity:0, fog:false, depthWrite:false }));
  moonSpr.scale.setScalar(72); moonSpr.position.set(-160,150,90); scene.add(moonSpr);
  // мягкие облака
  const cld=document.createElement('canvas'); cld.width=256; cld.height=128;
  const cg=cld.getContext('2d');
  for(let i=0;i<26;i++){ const x=rand(30,226), y=rand(38,92), r=rand(14,36);
    const ggr=cg.createRadialGradient(x,y,0,x,y,r);
    ggr.addColorStop(0,'rgba(255,255,255,0.22)'); ggr.addColorStop(1,'rgba(255,255,255,0)');
    cg.fillStyle=ggr; cg.beginPath(); cg.arc(x,y,r,0,7); cg.fill(); }
  const cloudTex=new THREE.CanvasTexture(cld);
  for(let i=0;i<12;i++){
    const s=new THREE.Sprite(new THREE.SpriteMaterial({ map:cloudTex, transparent:true,
      opacity:rand(0.5,0.85), fog:false, depthWrite:false }));
    s.scale.set(rand(90,170), rand(34,62), 1);
    s.position.set(rand(-380,380), rand(115,180), rand(-380,380));
    s.userData.vx=rand(1.2,3.4)*(Math.random()<0.5?-1:1);
    clouds.push(s); scene.add(s);
  }
}
function updateSky(dt){
  if(!skyDome) return;
  if(stars){ stars.material.opacity=nightK*0.9; stars.rotation.y+=dt*0.004; }
  if(sunSpr)  sunSpr.material.opacity=Math.max(0,(1-nightK*1.7)+0.06);
  if(moonSpr) moonSpr.material.opacity=clamp((nightK-0.25)*1.6,0,1);
  tmpCol.setRGB(1,1,1).lerp(nightCol, Math.min(1,nightK*1.12));
  skyDome.material.color.copy(tmpCol);
  for(const c of clouds){ c.position.x+=c.userData.vx*dt;
    if(c.position.x>420) c.position.x=-420; if(c.position.x<-420) c.position.x=420; }
}

function buildTerrain(){
  const dummy=new THREE.Object3D();
  brickTex = makeBrickTex();
  texGrass = makeNoiseTex('#4d7a38', ['#435f2e','#58904a','#3c5d28'], 900, 26);
  texDirt  = makeNoiseTex('#6b4e34', ['#5d4028','#7a5c40','#4e3a26'], 700, 10);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(480,480),
    new THREE.MeshStandardMaterial({ map: texGrass, roughness:1 }));
  ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);

  const lane = new THREE.Mesh(new THREE.PlaneGeometry(180,12),
    new THREE.MeshStandardMaterial({ map: texDirt, roughness:1 }));
  lane.rotation.x = -Math.PI/2; lane.position.y = 0.02; lane.receiveShadow=true; scene.add(lane);

  // каменные бортуры дороги (стиль Dota 2)
  const curbM=new THREE.MeshStandardMaterial({ color:0x4f5149, roughness:0.95 });
  const curbI=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.42), curbM, 76);
  for(let i=0;i<76;i++){
    const x=-90+i*2.42, z=(i%2? 6.35:-6.35);
    dummy.position.set(x, 0.16, z);
    dummy.rotation.set(rand(0,7),rand(0,7),0);
    const s=rand(0.45,0.95); dummy.scale.set(s,s*0.7,s);
    dummy.updateMatrix(); curbI.setMatrixAt(i,dummy.matrix);
  }
  curbI.castShadow=true; scene.add(curbI);
  // обрывы у реки (холмистый профиль)
  const bankM=new THREE.MeshStandardMaterial({ color:0x5e5138, roughness:0.9 });
  for(const sx of [-1,1]){
    const b=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.6,470), bankM);
    b.position.set(sx*6.4, 0.22, 0); b.receiveShadow=true; b.castShadow=true; scene.add(b);
  }
  // знамёна вдоль линии: полюс + флаг цвета своих земель
  const poleM=new THREE.MeshStandardMaterial({ color:0x4a3a26, roughness:0.9 });
  const flagCols=[0x2e6fd8, 0xb03428];
  for(let i=0;i<6;i++){
    const gx=(i%2===0? -1:1)*(26+(i>>1)*22), gz=(i%2? -8.6:8.6);
    const f=new THREE.Group();
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.09,5,6), poleM);
    pole.position.y=2.5; pole.castShadow=true; f.add(pole);
    const fm=new THREE.MeshStandardMaterial({ color:flagCols[i%2], roughness:0.8, side:THREE.DoubleSide });
    const pl2=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1.0), fm);
    pl2.position.set(0.88, 4.35, 0); pl2.castShadow=true; f.add(pl2);
    f.position.set(gx,0,gz); f.userData.ph=rand(0,7); scene.add(f); flags.push(f);
  }

  waterTex=(function(){
    const c=document.createElement('canvas'); c.width=64; c.height=256; const g=c.getContext('2d');
    g.fillStyle='#2e86c8'; g.fillRect(0,0,64,256);
    for(let i=0;i<110;i++){ g.fillStyle='rgba(200,235,255,'+rand(0.04,0.18).toFixed(2)+')';
      g.fillRect(rand(-8,64), Math.random()*256, rand(5,26), rand(1.4,3.4)); }
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.repeat.set(1,24); t.encoding=THREE.sRGBEncoding; return t; })();
  const river = new THREE.Mesh(new THREE.PlaneGeometry(12,480),
    new THREE.MeshStandardMaterial({ map:waterTex, transparent:true, opacity:0.8, roughness:0.18, metalness:0.2 }));
  river.rotation.x = -Math.PI/2; river.position.y = 0.045; river.receiveShadow = true; scene.add(river);

  const tintG = new THREE.PlaneGeometry(210, 460);
  const tint0 = new THREE.Mesh(tintG, new THREE.MeshBasicMaterial({ color:0x35e06a, transparent:true, opacity:0.055, depthWrite:false }));
  tint0.rotation.x=-Math.PI/2; tint0.position.set(-105,0.05,0); scene.add(tint0);
  const tint1 = new THREE.Mesh(tintG, new THREE.MeshBasicMaterial({ color:0xff4030, transparent:true, opacity:0.055, depthWrite:false }));
  tint1.rotation.x=-Math.PI/2; tint1.position.set(105,0.05,0); scene.add(tint1);

  // горы по кругу
  const mMat = new THREE.MeshStandardMaterial({ color:0x43523f, roughness:1 });
  for(let i=0;i<34;i++){
    const a = rand(0, Math.PI*2), r = rand(150, 205);
    const m = new THREE.Mesh(new THREE.ConeGeometry(rand(9,20), rand(18,46), 5), mMat);
    m.position.set(Math.cos(a)*r, 0, Math.sin(a)*r);
    m.rotation.y = rand(0,7); scene.add(m);
  }
  // деревья (инстансы) — двойная крона в духе Доты
  const n=190;
  const trunkI = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22,0.34,1.6,6),
    new THREE.MeshStandardMaterial({color:0x6b4a2f, roughness:1}), n);
  const leafI = new THREE.InstancedMesh(new THREE.ConeGeometry(1.5,2.8,7),
    new THREE.MeshStandardMaterial({color:0x2c6e33, roughness:1}), n);
  const leafI2 = new THREE.InstancedMesh(new THREE.ConeGeometry(1.02,2.05,7),
    new THREE.MeshStandardMaterial({color:0x245a28, roughness:1}), n);
  trunkI.castShadow = leafI.castShadow = leafI2.castShadow = true;
  let placed=0, guard=0;
  const leafCol=new THREE.Color(), leafCol2=new THREE.Color();
  while(placed<n && guard++<4000){
    const x=rand(-108,108), z=rand(-108,108);
    if (Math.abs(z)<8) continue;                       // полоса лейна
    if (Math.abs(x)<8) continue;                       // река
    if (dist2D({x,z},BASE[0])<20 || dist2D({x,z},BASE[1])<20) continue;
    if (dist2D({x,z},CAMP_POS[0])<10 || dist2D({x,z},CAMP_POS[1])<10) continue;
    dummy.position.set(x, 0.8, z); dummy.rotation.y=rand(0,7);
    const s=rand(0.7,1.35); dummy.scale.set(s,s,s); dummy.updateMatrix();
    trunkI.setMatrixAt(placed, dummy.matrix);
    dummy.position.set(x, 2.6*s+0.6, z); dummy.updateMatrix();
    leafI.setMatrixAt(placed, dummy.matrix);
    leafI.setColorAt(placed, leafCol.setHSL(0.29+rand(-0.04,0.06), 0.5+rand(-0.15,0.1), 0.30+rand(-0.06,0.10)));
    dummy.position.set(x, 3.6*s+0.5, z); dummy.updateMatrix();
    leafI2.setMatrixAt(placed, dummy.matrix);
    leafI2.setColorAt(placed, leafCol2.setHSL(0.30+rand(-0.035,0.05), 0.5, 0.22+rand(-0.05,0.07)));
    placed++;
  }
  dummy.scale.set(1,1,1);
  if(leafI.instanceColor) leafI.instanceColor.needsUpdate=true;
  if(leafI2.instanceColor) leafI2.instanceColor.needsUpdate=true;
  scene.add(trunkI); scene.add(leafI); scene.add(leafI2);
  // камни
  const rockI = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.5),
    new THREE.MeshStandardMaterial({color:0x5d606a, roughness:0.9}), 40);
  for(let i=0;i<40;i++){ const x=rand(-100,100), z=rand(-100,100);
    dummy.position.set(x, 0.25, z); dummy.rotation.set(rand(0,7),rand(0,7),0);
    const s=rand(0.5,1.6); dummy.scale.set(s,s*0.7,s); dummy.updateMatrix(); rockI.setMatrixAt(i,dummy.matrix); }
  scene.add(rockI);
  // живая трава (мелкие пучки)
  const tuftI=new THREE.InstancedMesh(new THREE.ConeGeometry(0.09,0.35,4),
    new THREE.MeshStandardMaterial({ color:0x4f8f3e, roughness:1 }), 320);
  const tuftCol=new THREE.Color(); let tt=0, guard2=0;
  while(tt<320 && guard2++<5000){
    const x=rand(-110,110), z=rand(-64,64);
    if (Math.abs(z)<7.2||Math.abs(x)<9.4) continue;
    if (dist2D({x,z},BASE[0])<18||dist2D({x,z},BASE[1])<18) continue;
    dummy.position.set(x,0.14,z);
    dummy.rotation.set(rand(-0.3,0.3), rand(0,7), rand(-0.3,0.3));
    const s=rand(0.7,1.6); dummy.scale.set(1, s, 1);
    dummy.updateMatrix(); tuftI.setMatrixAt(tt, dummy.matrix);
    tuftI.setColorAt(tt, tuftCol.setHSL(0.27+rand(-0.045,0.06), 0.55, 0.28+rand(-0.05,0.14)));
    tt++;
  }
  if(tuftI.instanceColor) tuftI.instanceColor.needsUpdate=true;
  scene.add(tuftI);
}

/* ---------- пулы эффектов ---------- */
function initFXPools(){
  const pg = new THREE.TetrahedronGeometry(0.24);
  for(let i=0;i<320;i++){
    const m=new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true }));
    m.visible=false; scene.add(m);
    partsP.push({ m, vx:0,vy:0,vz:0, life:0, max:1, size:1, grav:20, spin:rand(2,9) });
  }
  const rg = new THREE.RingGeometry(0.92,1,56);
  for(let i=0;i<26;i++){
    const m=new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, side:THREE.DoubleSide, depthWrite:false }));
    m.rotation.x=-Math.PI/2; m.visible=false; scene.add(m);
    ringsP.push({ m, life:0, max:1, r0:1, r1:2, op:0.8, y:0.06 });
  }
  for(let i=0;i<26;i++){
    const cnv=document.createElement('canvas'); cnv.width=128; cnv.height=64;
    const tex=new THREE.CanvasTexture(cnv); tex.minFilter=THREE.LinearFilter; tex.generateMipmaps=false;
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, depthTest:false }));
    spr.scale.set(3.4,1.7,1); spr.visible=false; spr.renderOrder=1001; scene.add(spr);
    textsP.push({ spr, cnv, life:0, max:1, vy:2 });
  }
  // glow для снарядов и огней (белая радиалка — красится материалом)
  glowTex=radialTex('rgba(255,255,255,1)','rgba(255,255,255,0.42)');
  // трещины в земле для декалей
  crackTex=makeCrackTex();
  const dg=new THREE.PlaneGeometry(1,1);
  for(let i=0;i<14;i++){
    const m=new THREE.Mesh(dg, new THREE.MeshBasicMaterial({ map:crackTex, color:0xffffff,
      transparent:true, opacity:0.7, blending:THREE.AdditiveBlending, depthWrite:false }));
    m.rotation.x=-Math.PI/2; m.rotation.z=rand(0,7);
    m.position.y=0.07; m.visible=false; m.renderOrder=2; scene.add(m);
    decalsP.push({ m, life:0, max:1.6 });
  }
  // вертикальные столбы света (взрывы, блинк, замесы)
  const bg=new THREE.CylinderGeometry(1,1,1,12,1,true);
  for(let i=0;i<12;i++){
    const m=new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color:0xffffff,
      transparent:true, opacity:0.5, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide }));
    m.visible=false; scene.add(m);
    beamsP.push({ m, life:0, max:0.5, op:0.5, rx:1, h:4 });
  }
}
function spawnBurst(x,y,z,color,n,spd,opts){
  opts=opts||{};
  let c=0;
  for(const p of partsP){
    if(p.life>0) continue;
    const a=rand(0,Math.PI*2), up=rand(0.2,1)*(opts.up!==undefined?opts.up:1);
    p.vx=Math.cos(a)*rand(0.2,1)*spd; p.vz=Math.sin(a)*rand(0.2,1)*spd;
    p.vy=up*rand(0.5,1)*spd*0.8;
    p.m.position.set(x+rand(-.2,.2), y+rand(-.2,.2), z+rand(-.2,.2));
    p.m.material.color.setHex(color); p.m.material.opacity=1;
    p.life=p.max=(opts.life||0.6)*rand(0.7,1.2);
    p.size=opts.size||1; p.grav=opts.grav!==undefined?opts.grav:20;
    p.m.scale.setScalar(p.size*(0.6+Math.random()*0.8));
    p.m.visible=true;
    if(++c>=n) break;
  }
}
function spawnRing(x,z,color,r0,r1,dur,opts){
  opts=opts||{};
  for(const r of ringsP){ if(r.life>0) continue;
    r.life=r.max=dur; r.r0=r0; r.r1=r1; r.op=opts.op!==undefined?opts.op:0.8; r.y=opts.y||0.06;
    r.m.position.set(x,r.y,z); r.m.material.color.setHex(color); r.m.material.opacity=r.op;
    r.m.scale.setScalar(r0); r.m.visible=true; return r; }
  return null;
}
/* трещины/подпалины на земле (аддитивное свечение, гаснет) */
function makeCrackTex(){
  const c=document.createElement('canvas'); c.width=c.height=128;
  const g=c.getContext('2d');
  g.translate(64,64);
  for(let i=0;i<16;i++){
    const a=rand(0,Math.PI*2), n=3+((Math.random()*3)|0);
    g.beginPath(); g.moveTo(0,0);
    let r=6;
    for(let k=0;k<n;k++){ const aa=a+rand(-0.33,0.33); r+=17+rand(0,11);
      g.lineTo(Math.cos(aa)*r, Math.sin(aa)*r); }
    g.lineCap='round';
    g.strokeStyle='rgba(255,255,255,0.55)'; g.lineWidth=3.4; g.stroke();
    g.strokeStyle='rgba(255,255,255,0.9)';  g.lineWidth=1.4; g.stroke();
  }
  const gr=g.createRadialGradient(0,0,0,0,0,26);
  gr.addColorStop(0,'rgba(255,255,255,0.55)'); gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr; g.fillRect(-64,-64,128,128);
  const t=new THREE.CanvasTexture(c); return t;
}
function spawnDecal(x,z,color,size,dur,opts){
  opts=opts||{};
  for(const d of decalsP){ if(d.life>0) continue;
    d.life=d.max=dur||1.6; d.op=opts.op!==undefined?opts.op:0.75;
    d.m.position.set(x,0.07,z);
    d.m.rotation.z=rand(0,7);
    d.m.scale.setScalar(Math.max(0.6,size));
    d.m.material.color.setHex(color); d.m.material.opacity=d.op; d.m.visible=true;
    return d; }
  return null;
}
/* столб света (взрыв, блинк, сливки каста) */
function spawnBeam(x,z,color,h,dur,opts){
  opts=opts||{};
  for(const b of beamsP){ if(b.life>0) continue;
    b.life=b.max=dur||0.5; b.h=h;
    b.op=opts.op!==undefined?opts.op:0.55; b.rx=opts.rx||1;
    b.m.position.set(x, h*0.5, z);
    b.m.scale.set(b.rx, h, b.rx);
    b.m.material.color.setHex(color); b.m.material.opacity=b.op; b.m.visible=true;
    return b; }
  return null;
}
function popText(x,y,z,str,color){
  for(const t of textsP){ if(t.life>0) continue;
    t.life=t.max=0.95; t.vy=2.2;
    const g=t.cnv.getContext('2d'); g.clearRect(0,0,128,64);
    g.font='bold 34px Verdana'; g.textAlign='center'; g.textBaseline='middle';
    g.lineWidth=6; g.strokeStyle='rgba(0,0,0,.85)'; g.strokeText(str,64,32);
    g.fillStyle=color; g.fillText(str,64,32);
    t.spr.material.map.needsUpdate=true;
    t.spr.position.set(x,y,z); t.spr.material.opacity=1; t.spr.visible=true; return; }
}
function updateFX(dt){
  for(const p of partsP){ if(p.life<=0) continue;
    p.life-=dt; if(p.life<=0){ p.m.visible=false; continue; }
    p.vy-=p.grav*dt;
    p.m.position.x+=p.vx*dt; p.m.position.y+=p.vy*dt; p.m.position.z+=p.vz*dt;
    if(p.m.position.y<0.08){ p.m.position.y=0.08; p.vy*=-0.32; p.vx*=0.7; p.vz*=0.7; }
    p.m.rotation.x+=p.spin*dt; p.m.rotation.y+=p.spin*dt;
    p.m.material.opacity=Math.min(1, p.life/p.max*1.6);
  }
  for(const r of ringsP){ if(r.life<=0) continue;
    r.life-=dt; if(r.life<=0){ r.m.visible=false; continue; }
    const k=1-r.life/r.max, rad=r.r0+(r.r1-r.r0)*k;
    r.m.scale.setScalar(Math.max(0.01,rad));
    r.m.material.opacity=r.op*Math.pow(1-k,1.4);
  }
  for(const t of textsP){ if(t.life<=0) continue;
    t.life-=dt; if(t.life<=0){ t.spr.visible=false; continue; }
    t.spr.position.y+=t.vy*dt; t.vy*=0.94;
    t.spr.material.opacity=Math.min(1, t.life/t.max*1.8);
  }
  for(const d of decalsP){ if(d.life<=0) continue;
    d.life-=dt; if(d.life<=0){ d.m.visible=false; continue; }
    const k=1-d.life/d.max;
    d.m.material.opacity=d.op*(1-k);
    const s=d.m.scale.x*(1+dt*0.5); d.m.scale.setScalar(s);   // трещины раз ползают
  }
  for(const b of beamsP){ if(b.life<=0) continue;
    b.life-=dt; if(b.life<=0){ b.m.visible=false; continue; }
    const k=1-b.life/b.max;
    b.m.material.opacity=b.op*(1-k)*(1-k);
    b.m.scale.set(b.rx*(1+k*0.8), b.h*(1+k*0.25), b.rx*(1+k*0.8));
  }
}
function shake(a){ shakeAmp=Math.max(shakeAmp,a); }

/* ============================ ТАБЛИЧКИ / ПЕРСОНАЖИ ============================ */
function makeNP(w,h,sx,sy,withName){
  w=w||256; h=h||64;
  const cnv=document.createElement('canvas'); cnv.width=w; cnv.height=h;
  const tex=new THREE.CanvasTexture(cnv); tex.minFilter=THREE.LinearFilter; tex.generateMipmaps=false;
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, depthTest:false }));
  spr.scale.set(sx,sy,1); spr.renderOrder=1000; spr.visible=true; scene.add(spr);
  let lastR=-1, lastName=undefined;
  const barColor = { r:'#63c968', n:'#7dd0ff' };
  return { sprite:spr, tex, draw(name,ratio,nameCol,teamCol){
    if (name===lastName && Math.abs(ratio-lastR)<0.02) return;
    lastR=ratio; lastName=name;
    const g=cnv.getContext('2d'); g.clearRect(0,0,w,h);
    const bw=w*0.82, bh=h*0.26, bx=(w-bw)/2;
    const by = withName? h*0.6 : h*0.3;
    if(withName){ g.font='bold 20px Verdana'; g.textAlign='center'; g.textBaseline='middle';
      g.lineWidth=4; g.strokeStyle='rgba(0,0,0,.8)'; g.strokeText(name,w/2,h*0.26);
      g.fillStyle=nameCol||'#fff'; g.fillText(name,w/2,h*0.26); }
    g.fillStyle='rgba(0,0,0,.7)'; g.fillRect(bx,by,bw,bh);
    g.fillStyle=teamCol||barColor.r; g.fillRect(bx+1,by+1,(bw-2)*Math.max(0,Math.min(1,ratio)),bh-2);
    g.strokeStyle='rgba(230,235,240,.55)'; g.lineWidth=2; g.strokeRect(bx,by,bw,bh);
    tex.needsUpdate=true;
  }};
}
function addPart(parent, geo, mat, x,y,z){ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=true; parent.add(m); return m; }

function makeHero(team, isPlayer, defIdx){
  const d = HEROES[defIdx!==undefined && defIdx>=0 ? defIdx : (team===0?0:3)];
  const g=new THREE.Group();
  const cloth=d.cloth, armor=d.armor, trimC=d.trim, glowC=d.glow;
  const matCloth=new THREE.MeshStandardMaterial({ color:cloth,  roughness:0.6, metalness:0.1, emissive:0xff5533, emissiveIntensity:0 });
  const matArmor=new THREE.MeshStandardMaterial({ color:armor,  roughness:0.38, metalness:0.62, emissive:0xff5533, emissiveIntensity:0 });
  const matTrim =new THREE.MeshStandardMaterial({ color:trimC,  roughness:0.3,  metalness:0.85 });
  const matGlow =new THREE.MeshBasicMaterial({ color:glowC });
  const matDark =new THREE.MeshStandardMaterial({ color:d.dark, roughness:0.5 });
  const matSteel=new THREE.MeshStandardMaterial({ color:0xcfd6e0, roughness:0.22, metalness:0.9 });
  const matCape =new THREE.MeshStandardMaterial({ color:d.cape, roughness:0.85, side:THREE.DoubleSide, transparent:true, opacity:0.96 });
  const capePivot=new THREE.Group(); capePivot.position.set(0,1.58,-0.24);
  const cape=new THREE.Mesh(new THREE.PlaneGeometry(0.66,0.95), matCape);
  cape.position.set(0,-0.47,0); capePivot.add(cape); g.add(capePivot);
  // ноги + сапоги
  addPart(g, new THREE.BoxGeometry(0.2,0.28,0.44), matTrim, 0.17,0.14,0.02);
  addPart(g, new THREE.BoxGeometry(0.2,0.28,0.44), matTrim, -0.17,0.14,0.02);
  addPart(g, new THREE.CylinderGeometry(0.13,0.11,0.5,8), matCloth, 0.19,0.53,0);
  addPart(g, new THREE.CylinderGeometry(0.13,0.11,0.5,8), matCloth, -0.19,0.53,0);
  addPart(g, new THREE.BoxGeometry(0.46,0.24,0.32), matCloth, 0,0.88,0);
  addPart(g, new THREE.BoxGeometry(0.5,0.08,0.34), matTrim, 0,1.0,0);      // пояс
  addPart(g, new THREE.BoxGeometry(0.52,0.52,0.4), matArmor, 0,1.32,0);    // кираса
  addPart(g, new THREE.OctahedronGeometry(0.09), matGlow, 0,1.36,0.21);    // кристалл на груди
  addPart(g, new THREE.CylinderGeometry(0.09,0.08,0.52,8), matCloth, 0.38,1.32,0);
  addPart(g, new THREE.CylinderGeometry(0.09,0.08,0.52,8), matCloth, -0.38,1.32,0);
  addPart(g, new THREE.SphereGeometry(0.23,10,8), matArmor, 0.42,1.53,0);  // наплечники
  addPart(g, new THREE.SphereGeometry(0.23,10,8), matArmor, -0.42,1.53,0);
  // голова + убор
  addPart(g, new THREE.SphereGeometry(0.24,12,10), matCloth, 0,1.82,0);
  addPart(g, new THREE.CylinderGeometry(0.27,0.29,0.16,10), matArmor, 0,1.94,0);
  addPart(g, new THREE.BoxGeometry(0.3,0.09,0.14), matDark, 0,1.8,0.2);    // визор
  // оружие по стилю
  const weapon=new THREE.Group(); weapon.position.set(0.5,1.35,0.12);
  if(d.style==='mage'||d.style==='dark'){                    // посох с огненной/ледяной сферой
    addPart(weapon, new THREE.CylinderGeometry(0.045,0.055,1.5,6), matDark, 0,0.5,0);
    addPart(weapon, new THREE.SphereGeometry(0.19,10,10), matGlow, 0,1.38,0);
    addPart(weapon, new THREE.BoxGeometry(0.22,0.07,0.22), matTrim, 0,1.2,0);
    addPart(weapon, new THREE.SphereGeometry(0.07,8,6), matTrim, 0,-0.24,0);
    // капюшон
    const hood=addPart(g, new THREE.ConeGeometry(0.3,0.62,7), matCloth, 0,2.06,0); hood.rotation.x=0.22;
  } else {                                                   // меч рыцаря/тьмы
    addPart(weapon, new THREE.BoxGeometry(0.09,1.15,0.24), matSteel, 0,0.62,0);
    addPart(weapon, new THREE.ConeGeometry(0.13,0.28,4), matSteel, 0,1.25,0);
    addPart(weapon, new THREE.BoxGeometry(0.36,0.08,0.3), matTrim, 0,0.16,0);
    addPart(weapon, new THREE.CylinderGeometry(0.05,0.05,0.3,6), matDark, 0,-0.03,0);
    addPart(weapon, new THREE.SphereGeometry(0.07,8,6), matTrim, 0,-0.22,0);
  }
  g.add(weapon);
  if(d.style==='knight'){                                    // щит только у бойца
    addPart(g, new THREE.BoxGeometry(0.1,0.7,0.52), matArmor, -0.58,1.3,0.06);
    addPart(g, new THREE.BoxGeometry(0.11,0.76,0.1), matTrim, -0.58,1.3,0.28);
  }
  if(d.style==='dark'){                                      // рога Моркуса
    const h1=addPart(g, new THREE.ConeGeometry(0.07,0.4,6), matDark, 0.2,2.06,0); h1.rotation.z=-0.55;
    const h2=addPart(g, new THREE.ConeGeometry(0.07,0.4,6), matDark, -0.2,2.06,0); h2.rotation.z=0.55;
    addPart(g, new THREE.OctahedronGeometry(0.07), matGlow, 0,2.12,-0.05);   // глаз бездны
  } else if(d.style==='mage'){                               // ледяная/огненная корона
    addPart(g, new THREE.BoxGeometry(0.05,0.2,0.3), matTrim, 0,2.12,0);
    addPart(g, new THREE.OctahedronGeometry(0.055), matGlow, 0,2.26,0);
  }
  // кольцо выделения
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.98,1.14,36),
    new THREE.MeshBasicMaterial({ color: team===0?0x7fd0ff:0xff8b7a, transparent:true, opacity:isPlayer?0.55:0.3, depthWrite:false }));
  ring.rotation.x=-Math.PI/2; ring.position.y=0.05; g.add(ring);
  scene.add(g);
  const ent={
    kind:'hero', team, isPlayer:!!isPlayer, def:d, name:d.name,
    alive:true, hp:maxHp0*d.hpMul, maxHp:maxHp0*d.hpMul, mana:300*d.manaMul, maxMana:300*d.manaMul,
    hpRegen:4, manaRegen:2.5, speed:7.6*d.speedMul, baseSpeed:7.6*d.speedMul,
    dmg:56*d.dmgMul, atkInt:1.05, atkCd:0, atkRange:d.atkRange||5.6, armor:d.style==='knight'?4:2, radius:0.62,
    level:1, xp:0, gold:650, kills:0, deaths:0, creepsLH:0,
    cds:[0,0,0,0], respawnT:0, slowT:0, hurtT:0, swingT:0, animT:0, moving:false,
    order:{type:'idle'}, dash:null, retreat:false, absorb:0, absorbT:0,
    nameCol: isPlayer? '#9fd0ff' : '#ffb49a',
    group:g, weapon, cape:capePivot, flash:[matCloth,matArmor], ring,
    npY:2.95, np:makeNP(256,64, 4.6,1.15, true),
  };
  g.traverse(o=>{ o.userData.ent=ent; });
  addBlob(ent, 1.35);
  ent.np.sprite.position.set(G(ent).x, ent.npY, G(ent).z);
  heroes.push(ent); return ent;
}
function rebuildHero(ent, defIdx, isPlayer){
  const gp=G(ent);
  const i=heroes.indexOf(ent); if(i>=0) heroes.splice(i,1);
  scene.remove(ent.group); if(ent.np&&ent.np.sprite) scene.remove(ent.np.sprite);
  if(ent.blob) scene.remove(ent.blob);
  const n=makeHero(ent.team, isPlayer, defIdx);
  G(n).set(gp.x,0,gp.z);
  return n;
}
const maxHp0=620;

function makeCreep(team, ranged, i, mul, superC){
  const g=new THREE.Group();
  mul=mul||1;
  const c = team===0? 0x2f7a49 : 0x9e3b2a;
  const matB=new THREE.MeshStandardMaterial({ color:c, roughness:0.6, emissive:0xff5533, emissiveIntensity:0 });
  const trim=new THREE.MeshStandardMaterial({ color:0x8b909a, roughness:0.5, metalness:0.4 });
  addPart(g, new THREE.CylinderGeometry(0.24,0.2,0.62,8), matB, 0,0.62,0);
  addPart(g, new THREE.SphereGeometry(0.2,10,10), matB, 0,1.08,0);
  if (ranged) addPart(g, new THREE.ConeGeometry(0.16,0.3,6), trim, 0,1.3,0); // остроконечный капюшон
  const ban=new THREE.Mesh(new THREE.PlaneGeometry(0.24,0.38),
    new THREE.MeshBasicMaterial({ color: c, side:THREE.DoubleSide }));
  ban.position.set(-0.26,0.95,-0.1); ban.rotation.y=0.6; g.add(ban);
  if (ranged){ addPart(g, new THREE.CylinderGeometry(0.04,0.04,1.15,6), trim, 0.26,0.8,0);
    addPart(g, new THREE.SphereGeometry(0.09,6,6), new THREE.MeshBasicMaterial({color:0x66d9ff}), 0.26,1.42,0); }
  else addPart(g, new THREE.BoxGeometry(0.1,0.5,0.14), trim, 0.24,0.75,0);
  scene.add(g);
  const base=BASE[team], dir= team===0? 1:-1;
  g.position.set(base.x + dir*(6+i*1.7), 0, (i-1.5)*1.9);
  const ent={
    kind:'creep', team, ranged:!!ranged, name:'', alive:true,
    hp: Math.round((ranged?250:320)*mul*(superC?2.6:1)), maxHp: Math.round((ranged?250:320)*mul*(superC?2.6:1)),
    speed: ranged?5.6:6.1, dmg: Math.round((ranged?40:24)*mul*(superC?1.8:1)), atkInt: ranged?1.7:1.25, atkCd:rand(0,1),
    atkRange: ranged?9:1.9, armor:0, radius:0.45,
    hurtT:0, swingT:0, animT:0, moving:false, slowT:0, target:null, wpIdx:0,
    goldVal: Math.round((ranged?65:45)*mul*(superC?2.2:1)), xpVal: Math.round((ranged?55:40)*mul*(superC?1.7:1)),
    group:g, weapon:null, flash:[matB], npY:1.55,
    np:makeNP(256,40, 2.3,0.58, false),
  };
  g.traverse(o=>{ o.userData.ent=ent; });
  if(superC){ g.scale.setScalar(1.34); ent.npY=2.2; }
  addBlob(ent, superC?1.15:0.85);
  creeps.push(ent); return ent;
}

function makeTower(team, x){
  const g=new THREE.Group();
  const stone=new THREE.MeshStandardMaterial({ color:0x4e525c, roughness:0.92 });
  if(brickTex){ stone.map=brickTex; stone.needsUpdate=true; }   // кладка в HD
  const tc = team===0? 0x58d874 : 0xff5a44;
  const matC=new THREE.MeshStandardMaterial({ color:tc, emissive:tc, emissiveIntensity:0.55, roughness:0.3, metalness:0.2 });
  const matB=new THREE.MeshBasicMaterial({ color:0xff9a4a });
  addPart(g, new THREE.CylinderGeometry(1.7,2.2,1.2,12), stone, 0,0.6,0);
  addPart(g, new THREE.CylinderGeometry(1.22,1.55,3.2,12), stone, 0,2.4,0);
  // бразьер под кристаллом
  addPart(g, new THREE.CylinderGeometry(0.52,0.34,0.4,8),
    new THREE.MeshStandardMaterial({ color:0x3a3a42, roughness:0.9, metalness:0.45 }), 0,4.3,0);
  addPart(g, new THREE.SphereGeometry(0.24,8,6), matB, 0,4.55,0);
  const ringT=new THREE.Mesh(new THREE.TorusGeometry(1.32,0.12,8,24), matC); ringT.rotation.x=Math.PI/2; ringT.position.y=4.05; ringT.castShadow=true; g.add(ringT);
  const crys=addPart(g, new THREE.OctahedronGeometry(0.9), matC, 0,5.35,0); crys.scale.y=1.9;
  const pl=new THREE.PointLight(tc, 0.85, 30); pl.position.set(0,5.8,0); g.add(pl);
  const mr=new THREE.Mesh(new THREE.RingGeometry(15.8,16,64),
    new THREE.MeshBasicMaterial({ color:tc, transparent:true, opacity:0.055, depthWrite:false })); // радиус атаки
  mr.rotation.x=-Math.PI/2; mr.position.y=0.05; g.add(mr);
  g.position.set(x,0,0); scene.add(g);
  const ent={ kind:'tower', team, name:'', alive:true, hp:1900, maxHp:1900,
    dmg:118, atkInt:1.05, atkCd:rand(0,1), atkRange:16, armor:3, radius:1.9,
    hurtT:0, animT:rand(0,5), group:g, flash:[matC], npY:5.9, brazier:[matB],
    np:makeNP(256,40, 3.2,0.8, false) };
  g.traverse(o=>{ o.userData.ent=ent; });
  addBlob(ent, 5.6);
  towers.push(ent); return ent;
}

function makeAncient(team){
  const g=new THREE.Group();
  const stone=new THREE.MeshStandardMaterial({ color:0x454a58, roughness:0.92 });
  if(brickTex){ const bt=brickTex.clone(); bt.needsUpdate=true; bt.repeat.set(5,1.4);
    stone.map=bt; stone.needsUpdate=true; }                     // своя крупная кладка
  const tc = team===0? 0x58d874 : 0xff5a44;
  const matC=new THREE.MeshStandardMaterial({ color:tc, emissive:tc, emissiveIntensity:0.75, roughness:0.25, metalness:0.2 });
  addPart(g, new THREE.CylinderGeometry(3.6,4.4,1.4,12), stone, 0,0.7,0);
  // 4 столба-обелиска с рунными огнями
  for(let i=0;i<4;i++){ const a=i/4*Math.PI*2+0.4;
    addPart(g, new THREE.CylinderGeometry(0.34,0.46,2.4,8), stone, Math.cos(a)*3.95, 1.2, Math.sin(a)*3.95);
    addPart(g, new THREE.BoxGeometry(0.5,0.34,0.5), matC, Math.cos(a)*3.95, 2.5, Math.sin(a)*3.95);
  }
  const crys=addPart(g, new THREE.OctahedronGeometry(2.6), matC, 0,4.4,0); crys.scale.y=1.35;
  const halo=new THREE.Mesh(new THREE.TorusGeometry(3.1,0.13,8,32), matC); halo.rotation.x=Math.PI/2; halo.position.y=4.2; g.add(halo);
  const pl=new THREE.PointLight(tc, 1.15, 70); pl.position.set(0,5,0); g.add(pl);
  const barrier=new THREE.Mesh(new THREE.TorusGeometry(6.8,0.14,8,48),
    new THREE.MeshBasicMaterial({ color:tc, transparent:true, opacity:0.35, depthWrite:false }));
  barrier.rotation.x=Math.PI/2; barrier.position.y=3; g.add(barrier);
  const pad=new THREE.Mesh(new THREE.CircleGeometry(11,40),
    new THREE.MeshBasicMaterial({ color:tc, transparent:true, opacity:0.13, depthWrite:false }));
  pad.rotation.x=-Math.PI/2; pad.position.y=0.06; scene.add(pad); pad.position.set(BASE[team].x,0.06,BASE[team].z);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,8,18,1,true),
    new THREE.MeshBasicMaterial({ color:tc, transparent:true, opacity:0.16, depthWrite:false, side:THREE.DoubleSide }));
  beam.position.set(BASE[team].x,4,BASE[team].z); scene.add(beam);
  fountains.push({ beam, pad });
  g.position.set(BASE[team].x,0,BASE[team].z); scene.add(g);
  const ent={ kind:'ancient', team, name: team===0?'Трон света':'Трон сумрака', alive:true,
    hp:3400, maxHp:3400, armor:0, radius:3.4, protected:true, hurtT:0, pulse:0, animT:rand(0,9),
    group:g, flash:[matC], npY:7.6, crys, halo, barrier,
    np:makeNP(256,64, 7.5,1.8, true) };
  g.traverse(o=>{ o.userData.ent=ent; });
  addBlob(ent, 9);
  ancients.push(ent); return ent;
}

function buildWorld(){
  makeAncient(0); makeAncient(1);
  makeTower(0, -TOWER_X[0]); makeTower(0, -TOWER_X[1]); // свет: Т1 у реки (-24), Т2 у базы (-48)
  makeTower(1, TOWER_X[0]); makeTower(1, TOWER_X[1]);   // сумрак: зеркально
  player = makeHero(0, true, 0);  G(player).set(BASE[0].x+4, 0, 2.5);
  bot    = makeHero(1, false, 3); G(bot).set(BASE[1].x-4, 0, 2.5);
  buildRoshan();
  buildJungle();
  buildLanterns();
}

/* ---------- нейтральные кемпы в джунглях ---------- */
function buildJungle(){
  for(const p of CAMP_POS) buildCamp(p.x, p.z, p.tier);
}
function buildCamp(x,z,tier){
  const c={ x, z, tier, members:[], respT:0, dead:false, deco:new THREE.Group() };
  const stoneM=new THREE.MeshStandardMaterial({ color:0x767069, roughness:0.95 });
  for(let i=0;i<7;i++){ const a=i/7*Math.PI*2, rr=rand(3.4,4.6);
    const st=new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.45,0.9)), stoneM);
    st.position.set(x+Math.cos(a)*rr, rand(0.1,0.3), z+Math.sin(a)*rr);
    st.rotation.set(rand(0,3),rand(0,3),0); st.castShadow=true; c.deco.add(st); }
  const tot=new THREE.Mesh(new THREE.ConeGeometry(0.5,3.2,6),
    new THREE.MeshStandardMaterial({ color: tier===1?0x5f7a3e:0x7a3e46, roughness:0.8 }));
  tot.position.set(x,1.6,z); tot.castShadow=true; c.deco.add(tot);
  const pl=new THREE.PointLight(tier===1?0xa5e26b:0xff6a5e, 0.35, 26); pl.position.set(x,2.6,z); c.deco.add(pl);
  scene.add(c.deco);
  campSpawn(c);
  camps.push(c); return c;
}
function campSpawn(c){
  c.members=[]; c.dead=false; c.respT=0;
  const n = c.tier===1? 3 : 2;
  for(let i=0;i<n;i++) c.members.push(makeJCreep(c, i, n));
}
function makeJCreep(camp, i, n){
  const g=new THREE.Group();
  const t1=camp.tier===1, sc=t1?1:1.3;
  const bodyC = t1? 0x5f7f46 : 0x7a4a58;
  const matB=new THREE.MeshStandardMaterial({ color:bodyC, roughness:0.65, emissive:0xff5533, emissiveIntensity:0 });
  const matTrim=new THREE.MeshStandardMaterial({ color:0x3a3630, roughness:0.6 });
  addPart(g, new THREE.BoxGeometry(0.52*sc,0.5*sc,0.7*sc), matB, 0,0.55*sc,0);
  addPart(g, new THREE.SphereGeometry(0.3*sc,10,8), matB, 0,1.0*sc,0);
  const spear=addPart(g, new THREE.ConeGeometry(0.09,0.5,5), matTrim, 0.26*sc,0.9*sc,0.2*sc); spear.rotation.z=-0.5;
  addPart(g, new THREE.ConeGeometry(0.1,0.34,4), matTrim, -0.2*sc,1.3*sc,0);        // рог
  if(!t1){                                                                          // крылья гарпии
    const wG=new THREE.PlaneGeometry(1.05,0.5);
    const wM=new THREE.MeshStandardMaterial({ color:0x8f5a6e, roughness:0.7, side:THREE.DoubleSide });
    const w1=new THREE.Mesh(wG,wM); w1.position.set(0.55*sc,1.05*sc,-0.1); w1.rotation.z=0.5; g.add(w1);
    const w2=new THREE.Mesh(wG,wM); w2.position.set(-0.55*sc,1.05*sc,-0.1); w2.rotation.z=-0.5; g.add(w2);
  }
  const eyeM=new THREE.MeshBasicMaterial({ color: t1?0xffd257:0xff5a44 });
  addPart(g, new THREE.SphereGeometry(0.055*sc,6,6), eyeM, 0.11*sc,1.04*sc,0.26*sc);
  addPart(g, new THREE.SphereGeometry(0.055*sc,6,6), eyeM, -0.11*sc,1.04*sc,0.26*sc);
  scene.add(g);
  g.position.set(camp.x+(i-(n-1)/2)*1.9, 0, camp.z+rand(-1.2,1.2));
  const t1s = t1;
  const ent={
    kind:'jcreep', team:2, name: t1s?'Гоблин-мародёр':'Каменная гарпия', camp, alive:true,
    hp: t1s?320:540, maxHp: t1s?320:540,
    dmg: t1s?24:34, atkInt: t1s?1.3:1.05, atkCd:rand(0,0.8), atkRange: t1s?1.9:2.1,
    armor: t1s?1:2, speed: t1s?6.2:6.9, radius:0.5*sc,
    goldVal: t1s?80:150, xpVal: t1s?60:115,
    hurtT:0, swingT:0, animT:rand(0,5), moving:false, slowT:0, target:null, wT:rand(0,3), wTgt:null,
    group:g, weapon:null, flash:[matB], npY:1.65*sc,
    np:makeNP(256,40, 2.1*sc,0.5, false),
  };
  g.traverse(o=>{ o.userData.ent=ent; });
  addBlob(ent, 0.85*sc);
  jcamps.push(ent); return ent;
}
function updateJungle(dt){
  for(let i=jcamps.length-1;i>=0;i--) if(!jcamps[i].alive) jcamps.splice(i,1);
  for(const c of camps){
    if (!c.dead && c.members.length && c.members.every(m=>!m.alive)){ c.dead=true; c.respT=85; }
    if (c.dead){ c.respT-=dt;
      if (c.respT<=0){ campSpawn(c);
        spawnRing(c.x,c.z,0xd9c25f,0.5,4.4,0.6,{op:0.65});
        addMsg('⛺ Нейтральный лагерь снова заседает (золото ждёт)','good'); } }
    for(const m of c.members) updateJCreep(m,dt);
  }
}
function updateJCreep(m,dt){
  if(!m.alive) return;
  m.atkCd=Math.max(0,m.atkCd-dt); if(m.slowT>0) m.slowT-=dt;
  let tgt=m.target;
  if(tgt && (!tgt.alive || dist2D(G(m),{x:m.camp.x,z:m.camp.z})>13)) m.target=tgt=null;  // «поводок» кемпа
  if(tgt){
    const d=dist2D(G(m),G(tgt));
    if(d>m.atkRange+(tgt.radius||0)) moveToward(m,G(tgt).x,G(tgt).z,dt);
    else { faceStep(m,G(tgt).x,G(tgt).z,dt); m.moving=false;
      if(m.atkCd<=0) performAttack(m,tgt); }
  } else {
    if(dist2D(G(m),{x:m.camp.x,z:m.camp.z})>6.5) moveToward(m,m.camp.x,m.camp.z,dt,0.8);
    else { m.moving=false; m.wT-=dt;
      if(m.wT<=0){ m.wT=rand(2.5,5.5); const a=rand(0,7);
        m.wTgt={ x:m.camp.x+Math.cos(a)*rand(1,2.6), z:m.camp.z+Math.sin(a)*rand(1,2.6) }; }
      if(m.wTgt){ const d=dist2D(G(m),m.wTgt);
        if(d>0.35) moveToward(m,m.wTgt.x,m.wTgt.z,dt,0.4); } }
  }
  animEnt(m,dt);
}

/* ---------- фонари вдоль линии (светят ночью) ---------- */
function buildLanterns(){
  const posL=[[ -20,9],[20,-9],[-58,9],[58,-9]];
  for(const [x,z] of posL){
    const g=new THREE.Group();
    addPart(g, new THREE.CylinderGeometry(0.09,0.13,3.4,6),
      new THREE.MeshStandardMaterial({ color:0x4a3a26, roughness:0.9 }), 0,1.7,0);
    const lamp=new THREE.Mesh(new THREE.OctahedronGeometry(0.32), new THREE.MeshBasicMaterial({ color:0xffc86a }));
    lamp.position.y=3.55; g.add(lamp);
    const pl=new THREE.PointLight(0xffb45e, 0, 30); pl.position.y=3.5; g.add(pl);
    g.position.set(x,0,z); scene.add(g);
    lanterns.push({ lamp, pl, seed:rand(0,9) });
  }
}

/* ============================ ЦЕЛИ / БОЙ ============================ */
function enemiesOf(team){
  const out=[];
  for(const h of heroes) if(h.alive&&h.team!==team) out.push(h);
  for(const c of creeps) if(c.alive&&c.team!==team) out.push(c);
  for(const t of towers) if(t.alive&&t.team!==team) out.push(t);
  const a=ancients[1-team]; if(a.alive&&!a.protected) out.push(a);
  return out;
}
function nearestEnemy(team,x,z,maxD,filter){
  let best=null,bd=maxD;
  for(const e of enemiesOf(team)){
    if(filter && !filter(e)) continue;
    const d=Math.hypot(e.group.position.x-x, e.group.position.z-z);
    if(d<bd){ bd=d; best=e; } }
  return best;
}
function faceDir(ent,dx,dz){
  const t=Math.atan2(dx,dz);
  let d=t-ent.group.rotation.y;
  while(d> Math.PI) d-=Math.PI*2; while(d<-Math.PI) d+=Math.PI*2;
  ent.group.rotation.y+=d;
}
const ROTSPD=10;
function faceStep(ent,tx,tz,dt){ // плавный поворот
  const gp=G(ent); const t=Math.atan2(tx-gp.x, tz-gp.z);
  let d=t-ent.group.rotation.y; while(d>Math.PI)d-=Math.PI*2; while(d<-Math.PI)d+=Math.PI*2;
  ent.group.rotation.y+=clamp(d, -ROTSPD*dt, ROTSPD*dt);
}
function moveToward(ent,tx,tz,dt,factor){
  const gp=G(ent), dx=tx-gp.x, dz=tz-gp.z, l=Math.hypot(dx,dz);
  if(l<0.01){ ent.moving=false; return true; }
  let sp=ent.speed*(factor||1); if(ent.slowT>0) sp*=0.55; if(ent.hasteT>0) sp*=1.45;
  const st=Math.min(sp*dt,l);
  gp.x+=dx/l*st; gp.z+=dz/l*st;
  if (ent.kind!=='creep'&&ent.kind!=='jcreep'){ gp.x=clamp(gp.x,-115,115); gp.z=clamp(gp.z,-88,88); }
  faceDir(ent,dx,dz); ent.moving=true;
  return l-st<0.01;
}
function pushOut(ent){ // не проваливаться в строения
  const gp=G(ent);
  for(const t of towers){ if(!t.alive) continue; const d=Math.hypot(gp.x-t.group.position.x, gp.z-t.group.position.z);
    if(d<t.radius+0.35){ const k=(t.radius+0.35)/Math.max(d,0.01); gp.x=t.group.position.x+(gp.x-t.group.position.x)*k; gp.z=t.group.position.z+(gp.z-t.group.position.z)*k; } }
  for(const a of ancients){ const d=Math.hypot(gp.x-a.group.position.x, gp.z-a.group.position.z);
    if(d<a.radius+0.6){ const k=(a.radius+0.6)/Math.max(d,0.01); gp.x=a.group.position.x+(gp.x-a.group.position.x)*k; gp.z=a.group.position.z+(gp.z-a.group.position.z)*k; } }
}
function performAttack(att, tgt){
  att.atkCd=att.atkInt; att.swingT=0.22;
  const gp=G(att), tp=G(tgt);
  faceDir(att, tp.x-gp.x, tp.z-gp.z);
  if (att.kind==='tower' || (att.kind==='creep'&&att.ranged)){
    spawnProjectile({ x:gp.x, y:1.9, z:gp.z, tgt, speed:26, dmg:att.dmg, src:att,
      color: att.team===0?0xffd27a:0xff9b7a, kind:'bolt', trail:true, ttl:2.5 });
    sfx('bolt');
  } else {
    spawnBurst(tp.x, 1.1, tp.z, 0xffe08a, 4, 5, { life:0.28, grav:10 });
    sfx('hit');
    damage(tgt, att.dmg, att, {});
    if(att.kind==='hero' && att.lsPct){                    // вампиризм (Клык Вампира)
      const heal=att.dmg*att.lsPct;
      att.hp=Math.min(att.maxHp, att.hp+heal);
      if(att.isPlayer&&heal>3) popText(gp.x+rand(-.4,.4), 2.2, gp.z, '+'+Math.round(heal), '#7fe08a');
    }
  }
}
function damage(t,dmg,src,opts){
  if(!t || !t.alive || over) return;
  if(t.kind==='ancient'&&t.protected){
    t.pulse=0.55;
    popText(G(t).x, 6.5, G(t).z, 'ЩИТ!', '#8fd0ff'); sfx('shield'); return; }
  if(t.absorb>0){                      // барьер (Баррикада Бастиона)
    const ab=Math.min(t.absorb, dmg);  t.absorb-=ab; dmg-=ab;
    if(ab>0 && !opts.silent) popText(G(t).x+rand(-.4,.4), 2.1, G(t).z, 'щит −'+Math.round(ab), '#ffd257');
    if(dmg<=0.5) return;
  }
  if(!opts.magic && t.armor) dmg*=100/(100+t.armor*8);
  t.hp-=dmg; t.hurtT=0.13;
  const gp=G(t);
  if(!opts.silent){
    const col=opts.magic?'#b58cff':(t.team===0?'#ff6a5a':'#ffd257');
    popText(gp.x+rand(-.5,.5), 1.7, gp.z+rand(-.3,.3), String(Math.max(1,Math.round(dmg))), col);
  }
  if(opts.slow!==undefined && t.slowT!==undefined) t.slowT=Math.max(t.slowT, opts.slow);
  // нейтралы злятся, когда их бьют
  if(t.kind==='jcreep' && src){
    const aggr=(src.kind && src.team!==2)? src : null;
    if(aggr) for(const m of t.camp.members){ if(m.alive && m!==t && !m.target) m.target=aggr; }
  }
  if(t.hp<=0) die(t, src);
}
function die(t, src){
  if(t.kind==='hero' && t.aegis>0){       // Эгида Рошана: смерть отменяется
    t.aegis--; t.hp=t.maxHp; t.mana=t.maxMana; t.alive=true; t.hurtT=0;
    spawnRing(G(t).x,G(t).z,0xffd257,0.4,3.2,0.7,{op:0.95});
    popText(G(t).x,3,G(t).z,'ЭГИДА!','#ffd257');
    showBanner('ЭГИДА СПАСЛА!', t.isPlayer?'':'bad');
    sfx('level'); say(t.isPlayer?'Эгида спасает вас':'Моркус под защитой эгиды');
    if(t.isPlayer) addMsg('🥚 Эгида Рошана растворилась — вы живы!','good');
    else addMsg('Эгида спасла Моркуса!','bad');
    return;
  }
  t.alive=false; t.hp=0;
  const gp=G(t);
  if (t.kind!=='ancient'){
    spawnBurst(gp.x,1.2,gp.z, t.team===0?0x7fd88f:0xff7d6e, 22, 9, { life:0.8 });
    spawnRing(gp.x,gp.z,0xdddddd,0.4, t.radius*2.4, 0.5, { op:0.5 });
  }
  t.group.visible=false; if(t.np) t.np.sprite.visible=false; if(t.ring) t.ring.visible=false;
  if(t.blob) t.blob.visible=false;
  switch(t.kind){
    case 'jcreep':{                        // нейтральный крип — награда лагеря
      if (src && src.kind==='hero'){
        giveGold(src, t.goldVal); giveXP(src, t.xpVal);
        if (src.isPlayer){ sfx('coin'); popText(gp.x+rand(-.6,.6), 1.8, gp.z, '+'+t.goldVal+' 🪙', '#ffd257');
          addMsg('⛺ Лагерь расчищен: +'+t.goldVal+' золота','good'); }
      }
      t.camp.members=t.camp.members.filter(m=>m.alive);
      if(!t.camp.members.length){ t.camp.dead=true; t.camp.respT=85; }
      scene.remove(t.group); if(t.np){ t.np.sprite.visible=false; scene.remove(t.np.sprite); }
      break; }
    case 'creep':
      if (src && src.kind==='hero' && src.alive && src.team!==t.team){
        if (src.isPlayer){ src.creepsLH++; sfx('coin'); }
        giveGold(src, t.goldVal); giveXP(src, t.xpVal);
      }
      for(const h of heroes){ if(!h.alive||h.team===t.team) continue;
        if (dist2D(G(h),gp)<16) giveXP(h, Math.round(t.xpVal*0.6)); }
      break;
    case 'hero':
      t.deaths++; t.streak=0;
      if (src && src.kind==='hero'){ src.kills++; src.streak=(src.streak||0)+1;
        if(src.streak>(src.maxStreak||0)) src.maxStreak=src.streak; giveGold(src,300); giveXP(src,280);
        if(src.streak>=2){
          const phr = src.streak===2? '⚡ Двойное убийство!' : src.streak===3? '🔥 Убийственная серия ×'+src.streak+'!' : '💥 '+src.name+' НЕУДЕРЖИМ ×'+src.streak+'!';
          addMsg(src.isPlayer? phr : 'Моркус: '+phr, src.isPlayer?'good':'bad');
          say(src.isPlayer? (src.streak===2?'Двойное убийство':'Ты неудержим') : 'Моркус неудержим');
        } }
      if (!firstBlood){ firstBlood=true; addMsg('⚔️ ПЕРВАЯ КРОВЬ!','good'); sfx('first'); say('Первая кровь!');
        showBanner('⚔ ПЕРВАЯ КРОВЬ!', src&&src.isPlayer?'':'bad'); }
      t.respawnT = 5 + t.level*1.6;
      if (t.isPlayer){ addMsg('Моркус отправил вас на фонтан…','bad'); say('Вы погибли'); showBanner('ВЫ ПОГИБЛИ','bad'); }
      else { addMsg('Моркус погиб! Возродится через '+Math.ceil(t.respawnT)+' с.','good'); say('Враг уничтожен');
        showBanner('ВРАГ ПОВЕРЖЕН!','good'); }
      sfx(t.isPlayer?'lose':'boom');
      break;
    case 'tower':{
      addMsg(t.team===0? '🛡️ Своя башня разрушена!' : '🗼 Башня врага разрушена!', t.team===0?'bad':'good');
      showBanner(t.team===0? 'СВОЯ БАШНЯ ПАЛА' : 'БАШНЯ ВРАГА ПАЛА!', t.team===0?'bad':'good');
      say(t.team===0? 'Наша башня разрушена' : 'Башня врага разрушена');
      sfx('towerfall');
      const credit = (src&&src.kind==='hero')? src : (src? heroes.find(h=>h.team===src.team):null);
      if (credit){ giveGold(credit,280); giveXP(credit,170); }
      spawnBurst(gp.x,3,gp.z, 0xd8d0c0, 30, 12, { life:1 });
      checkAncientBarrier(); break; }
    case 'ancient':
      endGame(t.team===0?1:0); break;
    case 'roshan':{
      roshan.respT=180;
      addMsg('🔥 РОШАН ПОВЕРЖЕН!','good'); say('Рошан повержен');
      showBanner('🔥 РОШАН ПОВЕРЖЕН!','good');
      if(src&&src.kind==='hero'){ giveGold(src,600); src.aegis=(src.aegis||0)+1;
        addMsg('🥚 Эгида Рошана — ваша! +600 золота','good'); }
      break; }
  }
}
function checkAncientBarrier(){
  for(let tm=0;tm<2;tm++){
    const a=ancients[tm];
    if (a.protected && !towers.some(tw=>tw.team===tm&&tw.alive)){
      a.protected=false; // барьер сам скроется в updateAncients
      addMsg(tm===0? '⚠️ ТРОН СВЕТА УЯЗВИМ!' : '💥 ТРОН СУМРАКА ОТКРЫТ ДЛЯ АТАКИ!', tm===0?'bad':'good');
      showBanner(tm===0? '⚠ НАШ ТРОН УЯЗВИМ' : 'ТРОН ВРАГА ОТКРЫТ!', tm===0?'bad':'good');
      say(tm===0? 'Наш трон уязвим' : 'Трон врага открыт для атаки');
    }
  }
}
function giveGold(h,amt){ h.gold+=amt; if(h.isPlayer) h.earned=(h.earned||0)+amt; }
function giveXP(h,amt){
  h.xp+=amt;
  while(h.level<12){
    const need=140+110*h.level;
    if(h.xp<need) break;
    h.xp-=need; h.level++;
    h.maxHp+=75; h.hp+=75; h.maxMana+=30; h.mana+=30;
    h.dmg+=7; h.hpRegen+=0.4;
    spawnRing(G(h).x,G(h).z,0xe8c56a,0.6,3.2,0.6,{op:0.8});
    spawnBurst(G(h).x,1.4,G(h).z,0xffd766,14,6,{life:0.7});
    if(h.isPlayer){ addMsg('⭐ Уровень '+h.level+'! Характеристики выросли.','good'); sfx('level'); showBanner('УРОВЕНЬ '+h.level); }
  }
}

/* ============================ СПОСОБНОСТИ ============================ */
function spawnProjectile(o){
  const g=new THREE.SphereGeometry(0.3,10,8);
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({ color:o.color||0xffffff }));
  m.scale.setScalar(o.kind==='fireball'?1.7:0.85);
  m.position.set(o.x,o.y,o.z);
  // светящийся ореол будущей магии
  if(glowTex){
    const gs=new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:o.color||0xffffff,
      transparent:true, opacity:0.85, blending:THREE.AdditiveBlending, depthWrite:false }));
    gs.scale.setScalar(o.kind==='fireball'?2.7:1.7); m.add(gs);
  }
  scene.add(m);
  projectiles.push({ mesh:m, x:o.x,y:o.y,z:o.z, tx:o.tx, tz:o.tz, ty:o.ty||0.8,
    tgt:o.tgt||null, speed:o.speed, dmg:o.dmg, src:o.src, kind:o.kind||'bolt',
    color:o.color, aoe:o.aoe||0, trail:!!o.trail, trailT:0, ttl:o.ttl||3 });
}
function aoeDamage(srcTeam, src, x,z,r,dmg,opts){
  opts=opts||{};
  for(const e of enemiesOf(srcTeam)){
    const gp=G(e);
    if (Math.hypot(gp.x-x, gp.z-z) <= r+e.radius) damage(e,dmg,src,{ magic:opts.magic!==false, slow:opts.slow });
  }
}
function castAbil(hero, i, pt, fromClick){
  if(over||!hero||!hero.alive) return;
  const A=hero.def? hero.def.abils[i] : ABIL[i];
  if(!A) return;
  if (hero.cds[i]>0){ if(hero.isPlayer) slotFlash(i); return; }
  if (hero.level<A.minLvl){ if(hero.isPlayer){ slotFlash(i); flashMsg('«'+A.name+'» доступна с '+A.minLvl+' уровня'); } return; }
  if (hero.mana<A.mana){ if(hero.isPlayer){ slotFlash(i); flashMsg('Не хватает маны'); } return; }
  hero.mana-=A.mana; hero.cds[i]=A.cd;
  const gp=G(hero), clr=hero.def.glow||0xffd257;
  // общий «замес» каста: свечение под ногами и вспышка частиц
  spawnRing(gp.x,gp.z,clr,0.4,1.7,0.3,{op:0.8});
  spawnBurst(gp.x,1.4,gp.z,clr,5,3,{life:0.32,up:0.35,grav:1.5});
  switch(A.type){
    case 'proj':{
      const dx=pt.x-gp.x, dz=pt.z-gp.z; faceDir(hero,dx,dz);
      spawnBeam(gp.x,gp.z,clr,2.6,0.3,{op:0.35,rx:0.7});
      spawnProjectile({ x:gp.x,y:1.5,z:gp.z, tx:pt.x,tz:pt.z, speed:24,
        dmg:115+15*hero.level+(A.dmgAdd||0), src:hero, kind:'fireball', color:A.pcolor, aoe:A.paoe, trail:true,
        slow:A.slow||0, ttl:3 });
      sfx('fire'); break; }
    case 'dash':{
      let dx=pt.x-gp.x, dz=pt.z-gp.z, l=Math.hypot(dx,dz);
      if(l<0.6){ dx=Math.sin(hero.group.rotation.y); dz=Math.cos(hero.group.rotation.y); }
      else { dx/=l; dz/=l; }
      hero.dash={ x:dx, z:dz, left:(A.dashDist||12), tag:dashTag++ };
      spawnDecal(gp.x,gp.z,clr,2.2,0.9,{op:0.4});
      spawnBurst(gp.x,0.9,gp.z,clr,12,7,{life:0.45});
      spawnBurst(gp.x,0.6,gp.z,0xd8cfc0,4,4,{life:0.6,up:0.35,grav:6,size:0.8}); // пыль из-под ног
      sfx('dash'); break; }
    case 'blink':{
      let dx=pt.x-gp.x, dz=pt.z-gp.z, l=Math.hypot(dx,dz)||1;
      const maxL=16; if(l>maxL){ dx=dx/l*maxL; dz=dz/l*maxL; }
      // откуда: схлопывание
      spawnDecal(gp.x,gp.z,clr,3,0.7,{op:0.5}); spawnRing(gp.x,gp.z,clr,3,0.4,0.4,{op:0.7});
      spawnBurst(gp.x,1.1,gp.z,clr,14,7,{life:0.5});
      G(hero).set(clamp(gp.x+dx,-115,115), 0, clamp(gp.z+dz,-88,88));
      pushOut(hero);
      // куда: вспышка-столб
      spawnBeam(G(hero).x,G(hero).z,clr,4.4,0.45,{op:0.5,rx:1.1});
      spawnDecal(G(hero).x,G(hero).z,clr,3.4,0.9,{op:0.6});
      spawnBurst(G(hero).x,1.1,G(hero).z,clr,18,8,{life:0.55});
      spawnRing(G(hero).x,G(hero).z,clr,0.5,3.4,0.45,{op:0.9});
      sfx('dash'); break; }
    case 'nova':{
      const rad=A.nrad||6.2;
      spawnDecal(gp.x,gp.z,A.ncolor,rad*1.5,1.5,{op:0.5});
      spawnBeam(gp.x,gp.z,A.ncolor,3.8,0.4,{op:0.45,rx:1.4});
      spawnRing(gp.x,gp.z,A.ncolor,1,rad,0.45,{op:0.9});
      spawnRing(gp.x,gp.z,0xffffff,1,rad*0.62,0.35,{op:0.55});
      spawnRing(gp.x,gp.z,A.ncolor,1,rad*1.18,0.8,{op:0.35});
      spawnBurst(gp.x,1.1,gp.z,A.ncolor,26,9,{life:0.6});
      spawnBurst(gp.x,1.4,gp.z,0xffffff,8,6,{life:0.35,up:0.5,grav:2,size:0.7});
      aoeDamage(hero.team, hero, gp.x,gp.z,rad, (A.dmgB||95)+(A.dmgL||12)*hero.level, { magic:true, slow:A.slow });
      sfx('nova'); shake(0.28); break; }
    case 'meteor':{
      meteors.push({ x:pt.x, z:pt.z, delay:1.25, warnT:0, vy:6, mesh:null, col:A.mcolor,
        dmg:330+35*hero.level, team:hero.team, src:hero, r:7, decalDone:false, smk:0 });
      spawnDecal(pt.x,pt.z,A.mcolor,6.8,1.4,{op:0.4});      // метка на земле
      spawnRing(pt.x,pt.z,A.mcolor,2,7,0.7,{op:0.4}); sfx('meteor'); break; }
    case 'blizzard':{
      spawnDecal(pt.x,pt.z,0xcfeeff,7.5,2.4,{op:0.35});
      spawnBeam(pt.x,pt.z,0xcfeeff,5.2,0.6,{op:0.35,rx:2.4});
      spawnRing(pt.x,pt.z,0xffffff,1,7.5,0.65,{op:0.55});
      for(let k=0;k<6;k++){
        const a=k*1.05+rand(-0.4,0.4), rr=rand(0,4.4);
        meteors.push({ x:pt.x+Math.cos(a)*rr, z:pt.z+Math.sin(a)*rr,
          delay:0.5+k*0.38, warnT:0, vy:9, mesh:null, col:A.mcolor, small:true,
          dmg:120+20*hero.level, team:hero.team, src:hero, r:3.4, decalDone:false, smk:0 });
      }
      spawnRing(pt.x,pt.z,A.mcolor,1,7,0.6,{op:0.5});
      sfx('meteor'); break; }
    case 'bulwark':{
      hero.absorb=hero.maxHp*0.45; hero.absorbT=9;
      if(hero.shieldFx){ hero.group.remove(hero.shieldFx); }
      const bub=new THREE.Mesh(new THREE.SphereGeometry(1.55,16,12),
        new THREE.MeshBasicMaterial({ color:0xffd257, transparent:true, opacity:0.2,
          blending:THREE.AdditiveBlending, depthWrite:false }));
      bub.visible=false; bub.position.y=1.35; hero.group.add(bub); hero.shieldFx=bub;
      spawnRing(gp.x,gp.z,0xffd257,0.4,3,0.6,{op:0.95});
      spawnRing(gp.x,gp.z,0xffd257,1.2,4.4,0.5,{op:0.6});
      spawnBeam(gp.x,gp.z,0xffd257,3.2,0.4,{op:0.4,rx:1.2});
      spawnBurst(gp.x,1.6,gp.z,0xffd257,16,5,{life:0.7,grav:-2});
      spawnDecal(gp.x,gp.z,0xffd257,4,1.1,{op:0.5});
      popText(G(hero).x,2.6,G(hero).z,'БАРЬЕР!','#ffd257');
      sfx('shield'); break; }
    default: break;
  }
  if(hero.isPlayer && fromClick!==undefined) {} // no-op
}
function updateMeteors(dt){
  for(let i=meteors.length-1;i>=0;i--){
    const m=meteors[i], mc=m.col||0xff6a3a;
    if(m.delay>0){ m.delay-=dt; m.warnT-=dt;
      if(m.warnT<=0){ spawnRing(m.x,m.z,mc,0.4,m.small?4.4:7,0.55,{op:0.5}); m.warnT=0.33; }
      continue; }
    if(!m.mesh){ m.mesh=new THREE.Mesh(new THREE.SphereGeometry(m.small?0.9:1.5,12,10),
      new THREE.MeshBasicMaterial({ color:m.small?0xeafaff:0xffd9a0 }));
      if(glowTex){ const gs=new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:mc,
        transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false }));
        gs.scale.setScalar(m.small?4.4:7.5); m.mesh.add(gs); }
      m.mesh.position.set(m.x+rand(-1.5,1.5),46,m.z+rand(-1.5,1.5)); scene.add(m.mesh); m.vy=6; }
    m.vy+=85*dt; m.mesh.position.y-=m.vy*dt;
    // огненный шлейф + дым
    spawnBurst(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,mc,2,3,{life:0.35,grav:4});
    if((m.smk=(m.smk+1)%3)===0)
      spawnBurst(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,
        m.small?0xdfefff:0x6a564a,1,1.6,{life:0.8,grav:-2,size:m.small?0.7:1.3});
    if(m.mesh.position.y<=1.1){
      scene.remove(m.mesh); meteors.splice(i,1);
      const big=!m.small;
      spawnBurst(m.x,1.5,m.z,mc,(big?46:18),(big?18:9),{life:1, size:big?1.5:0.8, grav:16});
      spawnBurst(m.x,1.2,m.z,0xffffff,big?12:5,(big?8:5),{life:0.35, size:0.8, grav:2, up:0.6});
      spawnBurst(m.x,1,m.z,0x555a60,big?22:10,big?9:6,{life:1.2, size:1.2, grav:8});
      spawnRing(m.x,m.z,mc,1,big?9.5:5.4,0.5,{op:0.9});
      spawnRing(m.x,m.z,0xffffff,0.5,big?6:3.4,0.35,{op:0.6});
      spawnDecal(m.x,m.z,mc,big?9:4.4,big?2:1.1,{op:big?0.55:0.4});
      spawnBeam(m.x,m.z,mc,big?5.5:2.6,big?0.55:0.4,{op:big?0.5:0.4,rx:big?2.2:1.1});
      aoeDamage(m.team, m.src, m.x,m.z,m.r, m.dmg, { magic:true });
      if(big){ shake(0.9); sfx('boom'); } else shake(0.25);
    }
  }
}
function updateProjectiles(dt){
  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i];
    p.ttl-=dt; if(p.ttl<=0){ scene.remove(p.mesh); projectiles.splice(i,1); continue; }
    const aliveT=p.tgt&&p.tgt.alive;
    if(aliveT){ p.tx=G(p.tgt).x; p.tz=G(p.tgt).z; }
    const dx=p.tx-p.mesh.position.x, dy=(p.ty)-p.mesh.position.y, dz=p.tz-p.mesh.position.z;
    const d=Math.sqrt(dx*dx+dy*dy+dz*dz), st=p.speed*dt;
    if(p.trail){ p.trailT-=dt; if(p.trailT<=0){ p.trailT=0.05;
      spawnBurst(p.mesh.position.x,p.mesh.position.y,p.mesh.position.z,p.color,1,2,{life:0.3,grav:1}); } }
    if(d<=st || (aliveT && d < 0.9+(p.tgt.radius||0))){
      if(p.kind==='fireball'){
        spawnBurst(p.tx,1.2,p.tz,p.color,26,10,{life:0.6});
        spawnBurst(p.tx,0.8,p.tz,0xffffff,12,6,{life:0.4,size:0.7,up:0.5,grav:2});
        spawnRing(p.tx,p.tz,p.color,0.8,4.6,0.4,{op:0.85});
        spawnRing(p.tx,p.tz,0xffffff,0.4,2.9,0.3,{op:0.6});
        spawnDecal(p.tx,p.tz,p.color,5.6,1.2,{op:0.5});
        spawnBeam(p.tx,p.tz,p.color,3.4,0.4,{op:0.4,rx:1.2});
        aoeDamage(p.src.team, p.src, p.tx,p.tz, p.aoe, p.dmg, { magic:true, slow:p.slow });
        shake(0.3); sfx('boom');
      } else {
        if(aliveT){ damage(p.tgt,p.dmg,p.src,{});
          spawnBurst(G(p.tgt).x,1.2,G(p.tgt).z,p.color,5,4,{life:0.3}); }
      }
      scene.remove(p.mesh); projectiles.splice(i,1); continue;
    }
    p.mesh.position.x+=dx/d*st; p.mesh.position.y+=dy/d*st; p.mesh.position.z+=dz/d*st;
  }
}

/* ============================ ОБНОВЛЕНИЯ СУЩНОСТЕЙ ============================ */
function animEnt(ent,dt){
  if(ent.hurtT>0){ ent.hurtT-=dt;
    for(const m of ent.flash) m.emissiveIntensity = ent.hurtT>0? 1.2 : 0; }
  const gp=G(ent);
  if(ent.blob){ ent.blob.visible=ent.alive; ent.blob.position.set(gp.x,0.055,gp.z); }
  const bob = ent.moving? Math.abs(Math.sin(ent.animT*9))*0.09 : 0;
  gp.y=bob;
  if(ent.moving) ent.animT+=dt;
  if(ent.kind==='hero' && ent.cape){
    const sw = ent.moving? 9 : 3;
    ent.cape.rotation.x = 0.3 + Math.sin(ent.animT*sw)*(ent.moving?0.18:0.05);
    ent.cape.rotation.z = Math.sin(ent.animT*sw*0.5)*0.06;
  }
  if(ent.swingT>0){ ent.swingT-=dt;
    const k=1-Math.max(0,ent.swingT)/0.22;
    if(ent.kind==='hero') ent.weapon.rotation.x=-Math.sin(Math.min(1,k)*Math.PI)*1.15;
  } else if(ent.kind==='hero') ent.weapon.rotation.x=0;
  // табличка
  if(ent.np){ ent.np.sprite.visible=ent.alive;
    ent.np.sprite.position.set(gp.x, gp.y+ent.npY, gp.z);
    const teamCol = ent.team===0? '#63c968' : (ent.team===2? '#d9c25f' : '#ff7d6e');
    ent.np.draw(ent.npName||ent.name||'', Math.max(0,ent.hp/ent.maxHp), ent.nameCol, teamCol); }
}
function updateHero(h,dt){
  for(let k=0;k<4;k++) if(h.cds[k]>0) h.cds[k]-=dt;
  h.atkCd=Math.max(0,h.atkCd-dt);
  if(h.slowT>0) h.slowT-=dt;
  if(h.absorbT>0){ h.absorbT-=dt; if(h.absorbT<=0) h.absorb=0; }
  // купол Баррикады
  if(h.shieldFx){
    const on = h.absorb>0 && h.absorbT>0;
    h.shieldFx.visible=on;
    if(on){ h.shieldFx.rotation.y+=dt*1.5;
      h.shieldFx.rotation.x=Math.sin(gameTime*2.2)*0.12;
      h.shieldFx.material.opacity=0.15+Math.abs(Math.sin(gameTime*3.4))*0.1; }
    else if(h.shieldFx.parent){ h.group.remove(h.shieldFx); h.shieldFx=null; }
  }
  if(!h.alive){
    h.respawnT-=dt;
    if(h.isPlayer && !over) document.getElementById('resptime').textContent=Math.max(1,Math.ceil(h.respawnT));
    if(h.respawnT<=0) revive(h);
    return;
  }
  // реген
  const ownAnc=ancients[h.team], inF = dist2D(G(h),G(ownAnc))<13;
  h.hp=Math.min(h.maxHp, h.hp+(h.hpRegen+(inF?h.maxHp*0.30:0))*dt);
  h.mana=Math.min(h.maxMana, h.mana+(h.manaRegen+(inF?h.maxMana*0.4:0))*dt);
  if(h.hasteT>0) h.hasteT-=dt;
  // канал телепорта
  if(h.channel){
    h.channel-=dt; h.moving=false;
    if(h.dash) h.dash=null;
    if(h.isPlayer && kbdDir()){ h.channel=null; addMsg('Телепорт прерван движением!','bad'); sfx('deny'); }
    else if(h.channel<=0){
      h.channel=null;
      const b=BASE[h.team];
      G(h).set(b.x+(h.team===0?4:-4), 0, rand(-2,2));
      spawnRing(G(h).x,G(h).z,0x66d9ff,0.4,3.4,0.6,{op:0.9});
      spawnBurst(G(h).x,1.2,G(h).z,0x66d9ff,18,6,{life:0.6});
      addMsg('📜 Телепорт к трону!','good'); sfx('nova');
    }
    animEnt(h,dt); return;
  }
  // рывок
  if(h.dash){
    const gp=G(h), st=Math.min(42*dt, h.dash.left);
    gp.x+=h.dash.x*st; gp.z+=h.dash.z*st; h.dash.left-=st;
    h.moving=true; h.animT+=dt;
    if(Math.random()<0.6) spawnBurst(gp.x,0.8,gp.z,h.def.glow||0xa8d4ff,1,2,{life:0.3,grav:2});
    if(Math.random()<0.3) spawnBurst(gp.x,0.4,gp.z,0xd8cfc0,1,2,{life:0.5,up:0.3,grav:5,size:0.8});
    for(const e of enemiesOf(h.team)){ const ep=G(e);
      if(Math.hypot(ep.x-gp.x,ep.z-gp.z)<1.7 && e.lastDash!==h.dash.tag){
        e.lastDash=h.dash.tag; damage(e, 80+10*h.level, h, {magic:true});
        spawnBurst(ep.x,1.1,ep.z,h.def.glow||0xa8d4ff,8,5,{life:0.4}); } }
    if(h.dash.left<=0.01){ h.dash=null;
      spawnRing(gp.x,gp.z,h.def.glow||0xa8d4ff,0.4,2.6,0.35,{op:0.65});
      spawnBurst(gp.x,0.5,gp.z,0xd8cfc0,6,4,{life:0.7,up:0.35,grav:8,size:0.9}); }
    pushOut(h);
    animEnt(h,dt); return;
  }
  // прямое управление: WASD / стрелки — бег героя поверх приказов
  if(h.isPlayer){
    const kd=kbdDir();
    if(kd){
      const gp=G(h), sp=h.speed*(h.slowT>0?0.55:1)*(h.hasteT>0?1.45:1);
      gp.x=clamp(gp.x+kd.x*sp*dt,-115,115); gp.z=clamp(gp.z+kd.z*sp*dt,-88,88);
      faceDir(h,kd.x,kd.z); h.moving=true; h.animT+=dt;
      if(h.dash) h.dash=null;
      h.order={type:'idle'};
      pushOut(h);
      const t=nearestEnemy(h.team,gp.x,gp.z,9, e=>dist2D(G(e),G(h))<=h.atkRange+(e.radius||0));
      if(t&&h.atkCd<=0) performAttack(h,t);
      else if(t) faceStep(h,G(t).x,G(t).z,dt);
      animEnt(h,dt); return;
    }
  }
  // приказы
  const o=h.order;
  if(o.type==='attack'&&(!o.tgt||!o.tgt.alive)) h.order={type:'idle'};
  if(h.order.type==='attack'){
    const tp=G(h.order.tgt), gp=G(h);
    const d=dist2D(gp,tp);
    const need=h.order.tgt.radius||0;
    if(d>h.atkRange+need-0.15){ moveToward(h,tp.x,tp.z,dt); pushOut(h); }
    else { faceStep(h,tp.x,tp.z,dt); h.moving=false;
      if(h.atkCd<=0) performAttack(h,h.order.tgt); }
    animEnt(h,dt); return;
  }
  if(h.order.type==='move'){
    const done=moveToward(h,h.order.x,h.order.z,dt);
    pushOut(h);
    if(done) h.order={type:'idle'};
    animEnt(h,dt); return;
  }
  // idle — автоцель
  h.moving=false;
  const t=nearestEnemy(h.team,G(h).x,G(h).z, h.atkRange+3, e=>dist2D(G(e),G(h))<=h.atkRange+(e.radius||0));
  if(t&&h.atkCd<=0) performAttack(h,t);
  else if(t) faceStep(h,G(t).x,G(t).z,dt);
  animEnt(h,dt);
}
function revive(h){
  h.alive=true; h.hp=h.maxHp; h.mana=h.maxMana; h.slowT=0;
  if(h.shieldFx){ if(h.shieldFx.parent) h.group.remove(h.shieldFx); h.shieldFx=null; }
  const b=BASE[h.team];
  G(h).set(b.x+(h.team===0?4:-4), 0, rand(-2,2));
  h.group.visible=true; if(h.np) h.np.sprite.visible=true;
  h.order={type:'idle'}; h.dash=null;
  spawnRing(G(h).x,G(h).z, h.team===0?0x7fd0ff:0xff8b7a, 0.5,3,0.7,{op:0.8});
  if(h.isPlayer) addMsg('Вы вернулись в бой!','good');
}

function updateCreep(c,dt){
  if(!c.alive) return;
  c.atkCd=Math.max(0,c.atkCd-dt);
  if(c.slowT>0) c.slowT-=dt;
  // цель
  if(c.target&&(!c.target.alive||dist2D(G(c),G(c.target))>15)) c.target=null;
  if(!c.target) c.target=nearestEnemy(c.team, G(c).x, G(c).z, 11);
  let fought=false;
  if(c.target){
    fought=true;
    const d=dist2D(G(c),G(c.target));
    if(d>c.atkRange+(c.target.radius||0)) moveToward(c,G(c.target).x,G(c.target).z,dt);
    else { faceStep(c,G(c.target).x,G(c.target).z,dt); c.moving=false;
      if(c.atkCd<=0) performAttack(c,c.target); }
  }
  if(!fought){
    c.moving=false;
    if(c.wpIdx===undefined) c.wpIdx=0;
    const path=LANE.map(x=> ({ x: c.team===0? x : -x, z:0 }));
    let tx,tz;
    if(c.wpIdx<path.length){ tx=path[c.wpIdx].x; tz=path[c.wpIdx].z;
      if(Math.abs(G(c).x-tx)+Math.abs(G(c).z-tz)<3) c.wpIdx++; }
    else { const a=ancients[1-c.team]; tx=G(a).x; tz=G(a).z;
      if(a.protected&&dist2D(G(c),G(a))<12){ animEnt(c,dt); return; } } // стоит у защищённого трона
    moveToward(c,tx,tz,dt); pushOut(c);
  }
  // расталкивание
  const gp=G(c);
  for(const o of creeps){ if(o===c||!o.alive) continue; const op=G(o);
    const dx=gp.x-op.x, dz=gp.z-op.z, d=Math.hypot(dx,dz);
    if(d<1.15&&d>0.001){ const k=(1.15-d)/d*0.5; gp.x+=dx*k; gp.z+=dz*k; } }
  for(const h of heroes){ if(!h.alive||h.dash) continue; const hp=G(h);
    const dx=gp.x-hp.x, dz=gp.z-hp.z, d=Math.hypot(dx,dz);
    if(d<0.95&&d>0.001){ const k=(0.95-d)/d; gp.x+=dx*k*0.4; gp.z+=dz*k*0.4; } }
  animEnt(c,dt);
}

function updateTower(tw,dt){
  if(!tw.alive) return;
  tw.atkCd=Math.max(0,tw.atkCd-dt);
  const gp=G(tw);
  if(tw.target&&(!tw.target.alive||dist2D(gp,G(tw.target))>tw.atkRange+2)) tw.target=null;
  if(!tw.target){
    tw.target=nearestEnemy(tw.team, gp.x, gp.z, tw.atkRange+1.2, e=>e.kind==='creep') ||
              nearestEnemy(tw.team, gp.x, gp.z, tw.atkRange+1.2, e=>e.kind==='hero');
  }
  if(tw.target&&tw.atkCd<=0) performAttack(tw,tw.target);
  if(Math.random()<dt*2.4){                      // искры бразьера
    tw.brazier[0].color.setHSL(0.08+Math.random()*0.05, 1, 0.55+Math.random()*0.2);
    spawnBurst(gp.x+rand(-0.2,0.2), 4.75, gp.z+rand(-0.2,0.2), 0xffa24a, 1, 1.3, { life:0.5, grav:-1.4, size:0.45 });
  }
  animEnt(tw,dt);
}

function updateAncients(dt){
  for(let tm=0;tm<2;tm++){
    const a=ancients[tm], g=a.group;
    const crys=a.crys, halo=a.halo, bar=a.barrier;
    if(crys){ crys.rotation.y+=dt*0.6; crys.position.y=4.4+Math.sin(gameTime*1.3+tm)*0.25; }
    if(halo){ halo.rotation.z+=dt*0.4; }
    if(bar){ bar.visible=a.protected; bar.rotation.z+=dt*0.7;
      if(a.pulse>0){ a.pulse-=dt; const s=1+a.pulse*0.5; bar.scale.set(s,s,1); bar.material.opacity=0.35+a.pulse; }
      else { bar.scale.set(1,1,1); bar.material.opacity=a.protected?0.3:0; } }
    animEnt(a,dt);
    if(a.alive && Math.random()<dt*7) // лёгкие светящиеся искры вокруг тронов
      spawnBurst(G(a).x+rand(-3,3), rand(1.5,5), G(a).z+rand(-3,3),
        tm===0?0x58d874:0xff8a5a, 1, 0.6, { life:1.1, grav:-1.5, size:0.7 });
  }
}

/* ============================ ИИ БОТА ============================ */
function botThink(dt){
  if(!bot.alive||over) return;
  botThinkAcc-=dt; if(botThinkAcc>0) return;
  botThinkAcc=0.35;
  const b=bot, gp=G(b), base=BASE[1];
  const hpR=b.hp/b.maxHp;
  if(!b.retreat&&hpR<0.24&&dist2D(gp,base)>26) b.retreat=true;
  if(b.retreat){
    if(dist2D(gp,base)<15&&hpR>0.62){ b.retreat=false; }
    else { b.order={type:'move', x:base.x-6, z:0};
      if(player&&player.alive){
        const d=dist2D(gp,G(player));
        if(d<5&&b.cds[2]<=0) castAbil(b,2,G(player),true);
      }
      return; }
  }
  if(gameTime<40){ b.order={type:'move', x:18, z:0}; } // ждёт у своей башни до первых волн
  else {
    // защита повреждённых башен или толчок за своими крипами
    let def=null;
    for(const tw of towers){ if(tw.team===1&&tw.alive&&tw.hp<tw.maxHp){
      if(!def||Math.abs(tw.group.position.x)<Math.abs(def.group.position.x)) def=tw; } }
    let px;
    if(def) px=def.group.position.x-7;
    else {
      let front=Infinity;
      for(const c of creeps){ if(c.team===1&&c.alive) front=Math.min(front, c.group.position.x); }
      px = front===Infinity? 20 : front+5;
      px=clamp(px, -70, 50);
    }
    b.order={type:'move', x:px, z:rand(-2.5,2.5)};
  }
  // бой с героем игрока
  if(player&&player.alive){
    const pg=G(player), d=dist2D(gp,pg);
    if(d<12.5&&b.cds[0]<=0) castAbil(b,0,{ x:pg.x+pvS.x*0.4, z:pg.z+pvS.z*0.4 }, true);
    if(d<5&&b.cds[2]<=0) castAbil(b,2,pg,true);
    if(d>7&&d<12&&b.cds[1]<=0) castAbil(b,1,pg,true);
    if(d<8) b.order={type:'attack', tgt:player};
  }
  // добить крипа, если герой не атакует
  if(b.order.type!=='attack'){
    const cr=nearestEnemy(1, gp.x, gp.z, 6, e=>e.kind==='creep');
    if(cr) b.order={type:'attack', tgt:cr};
  }
}

/* ============================ ВОЛНЫ ============================ */
function spawnWave(team){
  let n=0; for(const c of creeps) if(c.team===team&&c.alive) n++;
  if(n>24) return;
  if(team===0) waveCount++;
  const mul=1+Math.min(2.4,(waveCount-1)*0.065);
  const superWave = team===0 && waveCount%6===0;
  for(let i=0;i<3;i++) makeCreep(team,false,i,mul);
  makeCreep(team,true,3,mul);
  if(superWave){ makeCreep(team,true,4,mul*1.4,true);
    addMsg('🦾 Супер-крип выдвигается! Крепче держитесь на линии','bad'); showBanner('🦾 СУПЕР-КРИП!','bad'); }
}

/* ============================ КАМЕРА (как в Доте — свободная) ============================ */
let camLook={x:0,y:2,z:0};
function updateCamera(rdt){
  // ориентация — только от угла и зума
  const horiz=Math.cos(PITCH)*camDist, h=Math.sin(PITCH)*camDist;
  const ox=Math.cos(camYaw)*horiz, oz=Math.sin(camYaw)*horiz;
  const fx=-ox/Math.max(0.001,Math.hypot(ox,oz)), fz=-oz/Math.max(0.001,Math.hypot(ox,oz));
  camFwd.x=fx; camFwd.z=fz;
  if(camPos.x===null && player){ camPos.x=G(player).x; camPos.z=G(player).z; }
  // закреплённая камера — мягко плывёт за героем
  if(camLock && player){
    const k=Math.min(1, rdt*3.2);
    camPos.x+=(G(player).x-camPos.x)*k;
    camPos.z+=(G(player).z-camPos.z)*k;
  } else if(started && mouse.inGame && camPos.x!==null){
    // панорама у краёв экрана, как в Доте — медленная и плавная
    const kw=52, W=innerWidth, H=innerHeight;
    const eR=Math.min(1, Math.max(0, (mouse.px-(W-kw))/kw));
    const eL=Math.min(1, Math.max(0, (kw-mouse.px)/kw));
    const eD=Math.min(1, Math.max(0, (mouse.py-(H-kw))/kw));
    const eU=Math.min(1, Math.max(0, (kw-mouse.py)/kw));
    const s=(0.14*camDist+2.6)*rdt, rx=-fz, rz=fx;
    camPos.x=clamp(camPos.x+((eR-eL)*rx+(eU-eD)*fx)*s, -118, 118);
    camPos.z=clamp(camPos.z+((eR-eL)*rz+(eU-eD)*fz)*s, -90, 90);
  }
  const k=1-Math.exp(-4.5*rdt);
  const tx=camPos.x+ox, tz=camPos.z+oz, ty=h;
  camera.position.x+=(tx-camera.position.x)*k;
  camera.position.y+=(ty-camera.position.y)*k;
  camera.position.z+=(tz-camera.position.z)*k;
  const lk=1-Math.exp(-6.5*rdt);
  const lx=camPos.x+fx*7, lz=camPos.z+fz*7, ly=2.2;
  camLook.x+=(lx-camLook.x)*lk; camLook.y+=(ly-camLook.y)*lk; camLook.z+=(lz-camLook.z)*lk;
  if(shakeAmp>0){
    camera.position.x+=rand(-1,1)*shakeAmp; camera.position.y+=rand(-1,1)*shakeAmp*0.5; camera.position.z+=rand(-1,1)*shakeAmp;
    shakeAmp=Math.max(0,shakeAmp-rdt*2.4);
  }
  camera.lookAt(camLook.x,camLook.y,camLook.z);
}
function camCenterOnHero(){ // F1 — бросить взгляд на героя
  if(!player) return;
  camLock=false; camPos.x=G(player).x; camPos.z=G(player).z;
  sfx('order');
}

function kbdDir(){ // вектор WASD относительно камеры
  let wx=0, wz=0;
  const f={ x:camFwd.x, z:camFwd.z }, r={ x:-camFwd.z, z:camFwd.x };
  if(keys.has('KeyW')||keys.has('ArrowUp')){ wx+=f.x; wz+=f.z; }
  if(keys.has('KeyS')||keys.has('ArrowDown')){ wx-=f.x; wz-=f.z; }
  if(keys.has('KeyD')||keys.has('ArrowRight')){ wx+=r.x; wz+=r.z; }
  if(keys.has('KeyA')||keys.has('ArrowLeft')){ wx-=r.x; wz-=r.z; }
  if(!wx&&!wz) return null;
  const l=Math.hypot(wx,wz); return { x:wx/l, z:wz/l };
}

/* ============================ РОШАН И РУНЫ ============================ */
function buildRoshan(){
  const g=new THREE.Group();
  const matB=new THREE.MeshStandardMaterial({color:0x38221e, roughness:0.7, emissive:0xff5533, emissiveIntensity:0});
  const matH=new THREE.MeshStandardMaterial({color:0x57352c, roughness:0.6});
  const matEye=new THREE.MeshBasicMaterial({color:0xff3222});
  addPart(g, new THREE.BoxGeometry(3.2,2.4,4.2), matB, 0,1.7,0);
  addPart(g, new THREE.BoxGeometry(1.9,1.6,1.6), matH, 0,3.05,1.3);
  addPart(g, new THREE.SphereGeometry(0.15,6,6), matEye, 0.45,3.25,2.15);
  addPart(g, new THREE.SphereGeometry(0.15,6,6), matEye, -0.45,3.25,2.15);
  const h1=addPart(g,new THREE.ConeGeometry(0.28,1.3,6),matH, 0.85,3.85,1.2); h1.rotation.z=-0.5;
  const h2=addPart(g,new THREE.ConeGeometry(0.28,1.3,6),matH,-0.85,3.85,1.2); h2.rotation.z=0.5;
  addPart(g,new THREE.BoxGeometry(0.72,1.5,0.85),matB, 1.25,0.85,1.15);
  addPart(g,new THREE.BoxGeometry(0.72,1.5,0.85),matB,-1.25,0.85,1.15);
  addPart(g,new THREE.BoxGeometry(0.72,1.5,0.85),matB, 1.25,0.85,-1.15);
  addPart(g,new THREE.BoxGeometry(0.72,1.5,0.85),matB,-1.25,0.85,-1.15);
  for(let i=0;i<4;i++){ const s=addPart(g,new THREE.ConeGeometry(0.3,1.15,5),matH,0,3.3-i*0.05,-0.9-i*0.66); s.rotation.x=0.55; }
  const pl=new THREE.PointLight(0xff4422,0.55,32); pl.position.set(0,3,0); g.add(pl);
  const ringM=new THREE.Mesh(new THREE.RingGeometry(3.7,4.15,44),
    new THREE.MeshBasicMaterial({color:0xff5533, transparent:true, opacity:0.22, depthWrite:false, side:THREE.DoubleSide}));
  ringM.rotation.x=-Math.PI/2; ringM.position.y=0.08; g.add(ringM);
  g.position.set(0,0,-52); scene.add(g);
  /* логово: арка из валунов вокруг пещеры (проход остаётся на север, к линии) */
  const caveM=new THREE.MeshStandardMaterial({ color:0x4b4640, roughness:0.95 });
  const caveArc=new THREE.Group();
  for(let i=0;i<12;i++){
    const a=(i/11)*Math.PI*1.25+Math.PI*0.9;
    const r=rand(6.4,7.8), s=rand(1.0,2.4);
    const rk=new THREE.Mesh(new THREE.DodecahedronGeometry(s), caveM);
    rk.position.set(Math.cos(a)*r, s*0.62, Math.sin(a)*r);
    rk.rotation.set(rand(0,7),rand(0,7),0);
    rk.castShadow=true; rk.receiveShadow=true; caveArc.add(rk);
  }
  caveArc.position.set(0,0,-52); scene.add(caveArc);
  const caveFloor=new THREE.Mesh(new THREE.CircleGeometry(5.6,26),
    new THREE.MeshBasicMaterial({ color:0x201a17, transparent:true, opacity:0.5, depthWrite:false }));
  caveFloor.rotation.x=-Math.PI/2; caveFloor.position.set(0,0.03,-53.5);
  caveFloor.renderOrder=1; scene.add(caveFloor);
  roshan={ kind:'roshan', name:'Рошан', alive:true, hp:3200, maxHp:3200,
    dmg:150, atkInt:1.6, atkCd:0, atkRange:4.8, armor:6, radius:2.6, speed:7,
    hurtT:0, swingT:0, animT:0, moving:false, slowT:0, target:null, respT:0, streak:0,
    group:g, flash:[matB], npY:5.4, np:makeNP(256,40, 4.4,1.1,false) };
  g.traverse(o=>{ o.userData.ent=roshan; });
  addBlob(roshan, 5);
}
function updateRoshan(dt){
  const r=roshan; if(!r) return;
  if(!r.alive){
    r.respT-=dt;
    if(r.respT<=0){ r.alive=true; r.hp=r.maxHp; r.target=null; G(r).set(0,0,-52);
      r.group.visible=true; r.np.sprite.visible=true;
      spawnRing(0,-52,0xff5533,1,6.5,0.7); addMsg('Рошан вернулся в логово! Он охраняет Эгиду','bad');
      sfx('towerfall');
    }
    return;
  }
  r.atkCd=Math.max(0,r.atkCd-dt); if(r.slowT>0) r.slowT-=dt;
  if(r.target&&(!r.target.alive||dist2D(G(r),G(r.target))>16)) r.target=null;
  if(!r.target){
    let best=null,bd=8;
    for(const e of heroes) if(e.alive){ const d=dist2D(G(e),G(r)); if(d<bd){bd=d;best=e;} }
    for(const e of creeps) if(e.alive){ const d=dist2D(G(e),G(r)); if(d<bd){bd=d;best=e;} }
    r.target=best;
  }
  if(r.target){
    const d=dist2D(G(r),G(r.target));
    if(d>r.atkRange+(r.target.radius||0)) moveToward(r,G(r.target).x,G(r.target).z,dt);
    else { faceStep(r,G(r.target).x,G(r.target).z,dt); r.moving=false; if(r.atkCd<=0) performAttack(r,r.target); }
  } else {
    if(dist2D(G(r),{x:0,z:-52})>1) moveToward(r,0,-52,dt);
    else r.moving=false;
  }
  animEnt(r,dt);
}
function spawnRune(){
  const kind=['bounty','water','haste'][Math.floor(Math.random()*3)];
  const g=new THREE.Group();
  const core=new THREE.Mesh(new THREE.OctahedronGeometry(0.85),
    new THREE.MeshStandardMaterial({ color:RUNE_COLORS[kind], emissive:RUNE_COLORS[kind], emissiveIntensity:0.8, roughness:0.2 }));
  core.position.y=2.2; g.add(core);
  const pl=new THREE.PointLight(RUNE_COLORS[kind],0.8,20); pl.position.y=2.4; g.add(pl);
  const rr=new THREE.Mesh(new THREE.RingGeometry(1.9,2.15,32),
    new THREE.MeshBasicMaterial({ color:RUNE_COLORS[kind], transparent:true, opacity:0.5, depthWrite:false, side:THREE.DoubleSide }));
  rr.rotation.x=-Math.PI/2; rr.position.y=0.07; g.add(rr);
  g.position.set(rand(-3,3),0,rand(-22,22)); scene.add(g);
  runes.push({ kind, mesh:g, core, alive:true, t:rand(0,5) });
  addMsg('✨ В реке появилась руна '+RUNE_WORD[kind]+'!','good'); sfx('level');
}
function applyRune(h,kind){
  const col=RUNE_COLORS[kind];
  spawnRing(G(h).x,G(h).z,col,0.5,3.4,0.6,{op:0.9});
  spawnBurst(G(h).x,1.4,G(h).z,col,16,6,{life:0.7});
  sfx('level');
  if(kind==='bounty'){ giveGold(h,200); if(h.isPlayer){ addMsg('Бонусная руна: +200 золота!','good'); say('Руна золота'); }
    else addMsg('Моркус взял руну золота','bad'); }
  if(kind==='water'){ h.hp=h.maxHp; h.mana=h.maxMana; popText(G(h).x,2.4,G(h).z,'ПОЛНОЕ ЛЕЧЕНИЕ','#7dd0ff');
    if(h.isPlayer){ addMsg('Руна воды: полный отпив','good'); say('Руна воды'); } else addMsg('Моркус напился из руны…','bad'); }
  if(kind==='haste'){ h.hasteT=Math.max(h.hasteT||0,20); popText(G(h).x,2.4,G(h).z,'УСКОРЕНИЕ!','#ff9a3a');
    if(h.isPlayer){ addMsg('Руна ускорения: +45% скорости на 20 сек!','good'); say('Ускорение'); } else addMsg('Моркус мчится с руной!…','bad'); }
}
function updateRunes(dt){
  runeT-=dt; if(runeT<=0){ spawnRune(); runeT=120; }
  for(let i=runes.length-1;i>=0;i--){
    const r=runes[i];
    r.t+=dt; r.core.rotation.y+=dt*2.2;
    r.core.position.y=2.2+Math.sin(r.t*2)*0.25;
    let taken=false;
    for(const h of heroes){ if(!h.alive) continue;
      if(dist2D(G(h), {x:r.mesh.position.x, z:r.mesh.position.z}) < 2.8){
        applyRune(h,r.kind); r.alive=false; taken=true; break; } }
    if(!r.alive){ scene.remove(r.mesh); runes.splice(i,1); }
  }
}
function useTP(){
  if(!player||!player.alive||over) return;
  if((itemCounts.tp||0)>0 && !player.channel){
    itemCounts.tp--; player.dash=null; player.channel=2.2;
    player.order={type:'idle'};
    addMsg('📜 Сворачиваю свиток телепорта… (не двигайтесь!)','good'); sfx('meteor'); beep(520,0.5,'sine',0.1,800);
  } else {
    if((itemCounts.tp||0)<=0) flashMsg('Нет свитков ТП — купите в магазине');
  }
}

/* ============================ ВВОД ============================ */
let dragCam=false;
const raycaster=new THREE.Raycaster(), ndcV=new THREE.Vector2();
function eventNDC(ev){
  const r=renderer.domElement.getBoundingClientRect();
  return { x:(ev.clientX-r.left)/r.width*2-1, y:-((ev.clientY-r.top)/r.height)*2+1 };
}
function groundPointFor(ndc){
  ndcV.set(ndc.x,ndc.y); raycaster.setFromCamera(ndcV,camera);
  const o=raycaster.ray.origin, d=raycaster.ray.direction;
  if(Math.abs(d.y)<1e-4) return null;
  const t=-o.y/d.y; if(t<0) return null;
  return { x:o.x+d.x*t, z:o.z+d.z*t };
}
function pickEnemy(ndc){
  ndcV.set(ndc.x,ndc.y); raycaster.setFromCamera(ndcV,camera);
  const list=[];
  for(const e of heroes) if(e.alive&&e.team!==0) list.push(e.group);
  for(const e of creeps) if(e.alive&&e.team!==0) list.push(e.group);
  for(const e of jcamps) if(e.alive) list.push(e.group);
  for(const e of towers) if(e.alive&&e.team!==0) list.push(e.group);
  const a=ancients[1]; if(a.alive&&!a.protected) list.push(a.group);
  if(roshan&&roshan.alive) list.push(roshan.group);
  if(!list.length) return null;
  const hits=raycaster.intersectObjects(list,true);
  for(const hse of hits){
    let o=hse.object;
    while(o){ if(o.userData.ent) return o.userData.ent; o=o.parent; }
  }
  return null;
}
function initInput(){
  document.addEventListener('contextmenu', e=>e.preventDefault());
  const cv=renderer.domElement;
  cv.addEventListener('mousedown', e=>{
    if(document.activeElement && document.activeElement.blur &&
       (document.activeElement.tagName==='BUTTON')) document.activeElement.blur();
    if(e.button===1){ e.preventDefault(); dragCam=true;      // СКМ — тащим карту
      if(camLock){ camLock=false; addMsg('🎥 Камера свободная — тащите СКМ / края экрана','good'); }
      return; }
    if(e.button!==2 && e.button!==0) return; // ЛКМ и ПКМ — приказы
    if(!started||over||paused) return;
    ensureAudio();
    const ndc=eventNDC(e), sel=pickEnemy(ndc);
    if(sel){
      player.order={type:'attack', tgt:sel};
      spawnRing(G(sel).x,G(sel).z,0xff4d3a,0.5,1.5,0.35,{op:0.9});
    } else {
      const gp=groundPointFor(ndc);
      if(gp){ player.order={type:'move', x:gp.x, z:gp.z};
        spawnRing(gp.x,gp.z,0x5ee06a,0.5,1.4,0.4,{op:0.8}); }
    }
    sfx('order');
  });
  addEventListener('mouseup', e=>{ if(e.button===1) dragCam=false; });
  addEventListener('mousemove', e=>{
    mouse.px=e.clientX; mouse.py=e.clientY; mouse.inGame=true;
    const ndc=eventNDC(e); mouse.x=ndc.x; mouse.y=ndc.y;
    if(dragCam){                                  // граб-панорама: земля следует за мышью (мягко)
      const fx=camFwd.x, fz=camFwd.z, rx=-fz, rz=fx, s=camDist*0.0075;
      camPos.x=clamp(camPos.x+(-rx*e.movementX+fx*e.movementY)*s, -118, 118);
      camPos.z=clamp(camPos.z+(-rz*e.movementX+fz*e.movementY)*s, -90, 90);
    }
  });
  cv.addEventListener('mouseleave', ()=>{ mouse.inGame=false; });
  cv.addEventListener('mouseenter', ()=>{ mouse.inGame=true; });
  cv.addEventListener('wheel', e=>{ camDist=clamp(camDist+e.deltaY*0.02, 18, 62); }, { passive:true });
  const mm=$('mm');                                // клик по миникарте — камера туда
  if(mm) mm.addEventListener('mousedown', e=>{
    const r=mm.getBoundingClientRect();
    camLock=false;
    camPos.x=clamp((e.clientX-r.left)/r.width*240-120, -118, 118);
    camPos.z=clamp((e.clientY-r.top)/r.height*240-120, -90, 90);
    sfx('order');
  });
  addEventListener('keydown', e=>{
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','F1'].indexOf(e.code)>=0) e.preventDefault();
    if(document.activeElement && document.activeElement.tagName==='BUTTON') document.activeElement.blur();
    if(e.code==='KeyP'){ togglePause(); return; }
    if(e.code==='KeyM'){ muted=!muted;
      if(muted){ try{ speechSynthesis.cancel(); }catch(err){} }
      addMsg(muted?'🔇 Звук выключен (M)':'🔊 Звук включён (M)','good'); return; }
    if(!started){ if(e.code==='Enter') startGame(); return; }
    if(over) return;
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.code)>=0){
      if(!paused) keys.add(e.code);
    }
    if(paused) return;
    switch(e.code){
      case 'KeyQ': case 'Digit1': castAbil(player,0,groundPointFor(mouse)); break;
      case 'Space': case 'Digit2': castAbil(player,1,groundPointFor(mouse)); break;
      case 'KeyE': case 'Digit3': castAbil(player,2,groundPointFor(mouse)); break;
      case 'KeyR': case 'Digit4': castAbil(player,3,groundPointFor(mouse)); break;
      case 'KeyX': player.order={type:'idle'}; break;
      case 'F1':   camCenterOnHero(); break;
      case 'KeyF': camLock=!camLock;
                   addMsg(camLock?'📷 Камера закреплена за героем':'🎥 Камера свободная (края экрана / СКМ)','good');
                   break;
      case 'KeyT': useTP(); break;
      case 'KeyB': toggleShop(); break;
      case 'Escape': shopOpenEl.classList.remove('open'); break;
    }
  });
  addEventListener('keyup', e=>{ keys.delete(e.code); });
  addEventListener('blur', ()=>{ keys.clear(); dragCam=false; });
}

/* ============================ HUD ============================ */
const UI={};
function $(id){ return document.getElementById(id); }
let bannerTO=null;
function showBanner(text, cls){
  const b=document.getElementById('banner'); if(!b) return;
  b.textContent=text; b.className=cls||'';
  void b.offsetWidth; b.classList.add('show');
  clearTimeout(bannerTO); bannerTO=setTimeout(()=>b.classList.remove('show'), 2400);
}
function initHUD(){
  UI.timer=$('timer'); UI.score=$('score'); UI.lh=$('lh'); UI.gold=$('gold');
  UI.lvl=$('lvltag'); UI.hpfill=$('hpfill'); UI.mpfill=$('mpfill');
  UI.hptext=$('hptext'); UI.mptext=$('mptext'); UI.anc0=$('anc0'); UI.anc1=$('anc1');
  UI.msglog=$('msglog'); UI.death=$('deathoverlay'); UI.pause=$('pauseoverlay');
  UI.resptime=$('resptime'); UI.items=$('items');
  buildAbilHUD(HEROES[0]);
  // выбор героя на стартовом экране
  const hp=$('heropick');
  if(hp){
    hp.innerHTML=HEROES.filter(h=>h.id!=='morgus').map(d=>
      '<div class="hcard pe'+(heroSel===d.id?' sel':'')+'" data-h="'+d.id+'">'+
      '<div class="hic">'+d.icon+'</div><div class="hn">'+d.name+'</div>'+
      '<div class="ht">'+d.title+'</div><div class="hr">'+d.role+'</div>'+
      '<div class="ha">'+d.abils.map(a=>a.icon).join(' ')+'</div></div>').join('');
    hp.querySelectorAll('.hcard').forEach(c=>c.addEventListener('click',()=>{
      ensureAudio(); heroSel=c.dataset.h;
      hp.querySelectorAll('.hcard').forEach(x=>x.classList.toggle('sel', x.dataset.h===heroSel));
      sfx('order');
    }));
  }
  // предметы
  UI.itemSlots=[];
  for(let i=0;i<6;i++){ const d=document.createElement('div'); d.className='islot'; UI.items.appendChild(d); UI.itemSlots.push(d); }
  // магазин
  const sp=$('shopitems');
  sp.innerHTML=ITEMS.map(it=>
    '<div class="sitem"><div class="sic">'+it.icon+'</div><div class="sinfo">'+
    '<div class="sname">'+it.name+'</div><div class="sdesc">'+it.desc+'</div></div>'+
    '<div style="text-align:right"><div class="sprice">🪙 '+it.price+'</div>'+
    '<button class="btn small pe" data-buy="'+it.id+'">Купить</button></div></div>').join('');
  sp.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>buyItem(b.dataset.buy)));
  shopOpenEl=$('shop');
  $('shopbtn').addEventListener('click',toggleShop);
  $('shopclose').addEventListener('click',toggleShop);
  $('startbtn').addEventListener('click',()=>{ startGame(); $('startbtn').blur(); });
  $('againbtn').addEventListener('click',()=>location.reload());
  mmCtx=$('mm').getContext('2d');
}
function flashMsg(s){ addMsg(s,'bad'); }
function buildAbilHUD(def){
  const src=(def&&def.abils)&&def || (player&&player.def)||HEROES[0];
  ABIL=src.abils||HEROES[0].abils;
  const ab=$('abils');
  ab.innerHTML=ABIL.map((a,i)=>
    '<div class="slot pe" data-i="'+i+'" title="'+a.name+' — '+a.desc+'"><span class="icn">'+a.icon+'</span>'+
    '<span class="key">'+a.key+'</span><span class="cost">'+a.mana+'</span>'+
    '<div class="cdov"></div><span class="cdnum"></span><span class="lock">ур.'+a.minLvl+'</span></div>').join('');
  UI.slots=[...ab.querySelectorAll('.slot')];
  UI.cdovs=UI.slots.map(s=>s.querySelector('.cdov'));
  UI.cdn=UI.slots.map(s=>s.querySelector('.cdnum'));
  UI.slots.forEach((s,i)=>s.addEventListener('click',e=>{
    ensureAudio(); const ndc=eventNDC(e); castAbil(player,i,groundPointFor(ndc),true); }));
}
function slotFlash(i){
  const s=UI.slots[i]; if(!s) return;
  s.style.transform='scale(1.12)'; s.style.borderColor='#ff5a44';
  setTimeout(()=>{ s.style.transform=''; s.style.borderColor=''; },160);
}
function addMsg(text, cls){
  const d=document.createElement('div'); d.className='msg '+(cls||''); d.textContent=text;
  UI.msglog.prepend(d);
  while(UI.msglog.children.length>6) UI.msglog.lastChild.remove();
  setTimeout(()=>d.remove(),6200);
}
function toggleShop(){ shopOpenEl.classList.toggle('open'); }
function buyItem(id){
  const it=ITEMS.find(i=>i.id===id); if(!it) return;
  const owned=itemCounts[id]||0;
  if(it.once&&owned>0){ flashMsg('Уже куплено'); return; }
  if(player.gold<it.price){ flashMsg('Мало золота'); sfx('deny'); return; }
  player.gold-=it.price; itemCounts[id]=owned+1;
  switch(id){
    case 'sword': player.dmg+=10; break;
    case 'armor': player.armor+=4; break;
    case 'boots': player.speed+=2.2; break;
    case 'regen': player.hpRegen+=6; break;
    case 'elix': { player.hp=player.maxHp; player.mana=player.maxMana;
      spawnRing(G(player).x,G(player).z,0x5ee06a,0.4,2.6,0.5,{op:0.8});
      spawnBurst(G(player).x,1.2,G(player).z,0x7fd88f,14,5,{life:0.6});
      addMsg('Эликсир выпит: полная перезарядка','good'); break; }
    case 'vamp': player.lsPct=(player.lsPct||0)+0.12; break;
    case 'ring': player.maxMana+=80; player.mana+=80; player.manaRegen+=3;
      spawnRing(G(player).x,G(player).z,0x8fd0ff,0.4,2.6,0.5,{op:0.8}); break;
    case 'tome': giveXP(player,260);
      spawnBurst(G(player).x,1.6,G(player).z,0xffd766,16,6,{life:0.8});
      addMsg('📖 Фолиант прочитан: +260 опыта','good'); break;
  }
  sfx('buy'); if(id!=='elix') addMsg(it.name+' — куплено!','good');
  playerPedestalRefresh();
}
function playerPedestalRefresh(){} // визуал статов не требуется
function fmtTime(t){ const m=Math.floor(t/60), s=Math.floor(t%60); return m+':'+(s<10?'0':'')+s; }

function updateNight(dt){
  const cyc=gameTime%480, target=cyc<240?0:1;
  nightK+=(target-nightK)*Math.min(1, dt/5);
  const k=nightK;
  hemiL.intensity=0.45-0.26*k;
  sunL.intensity =1.35-1.27*k;
  ambL.intensity =0.12-0.07*k;
  sunL.color.setRGB(1-0.58*k, 0.85-0.35*k, 0.66+0.24*k);
  tmpCol.copy(dayCol).lerp(nightCol, k);
  scene.background.copy(tmpCol);
  scene.fog.color.copy(tmpCol);
  scene.fog.near=110-64*k; scene.fog.far=300-140*k;
  const phase=target?'night':'day';
  if(phase!==lastPhase && gameTime>5){
    lastPhase=phase;
    const tod=document.getElementById('tod'); if(tod) tod.textContent = phase==='night' ? '🌙 ночь' : '☀️ день';
    if(phase==='night'){ addMsg('🌙 Наступает ночь — видимость хуже','bad'); say('Наступает ночь'); }
    else { addMsg('🌅 Рассвет. Тьма отступает','good'); say('Рассвет'); }
  }
  // фонари вдоль линии: жизнь только ночью
  for(const l of lanterns){
    const f=nightK*(0.85+Math.sin(gameTime*11+l.seed)*0.16+Math.sin(gameTime*27+l.seed*2)*0.05);
    l.pl.intensity=f*1.5;
    l.lamp.material.color.setRGB(1, 0.72+f*0.24, 0.34);
  }
  // светлячки
  if(nightK>0.55 && Math.random()<dt*4){
    spawnBurst(rand(-100,100), rand(0.6,3.2), rand(-80,80), 0xbff5a6, 1, 0.4,
      { life:rand(1.2,2.4), grav:-0.6, size:0.5 });
  }
}

function updateHUD(){
  const p=player;
  UI.timer.textContent=fmtTime(gameTime);
  UI.hpfill.style.width=Math.max(0,p.hp/p.maxHp*100)+'%';
  UI.mpfill.style.width=Math.max(0,p.mana/p.maxMana*100)+'%';
  UI.hptext.textContent=Math.ceil(p.hp)+' / '+p.maxHp;
  UI.mptext.textContent=Math.ceil(p.mana)+' / '+p.maxMana;
  UI.lvl.textContent='ур. '+p.level; UI.gold.textContent=Math.floor(p.gold);
  UI.score.textContent=p.kills+' : '+bot.kills;
  UI.lh.textContent=p.creepsLH;
  UI.anc0.style.width=Math.max(0,ancients[0].hp/ancients[0].maxHp*100)+'%';
  UI.anc1.style.width=Math.max(0,ancients[1].hp/ancients[1].maxHp*100)+'%';
  for(let i=0;i<4;i++){
    const A=ABIL[i], cd=p.cds[i];
    UI.cdovs[i].style.height=(cd>0? cd/A.cd*100:0)+'%';
    UI.cdn[i].textContent=cd>0?(cd>10?Math.ceil(cd):cd.toFixed(1)):'';
    UI.slots[i].classList.toggle('noman', p.mana<A.mana && cd<=0);
    UI.slots[i].classList.toggle('locked', p.level<A.minLvl);
  }
  // предметы
  const owned=ITEMS.map(it=>({ it, n:itemCounts[it.id]||0 })).filter(o=>o.n>0);
  if(player.aegis>0) owned.push({ it:{icon:'🥚'}, n:player.aegis });
  UI.itemSlots.forEach((slot,i)=>{
    const o=owned[i];
    slot.innerHTML=o?o.it.icon+(o.n>1?'<span class="cnt">'+o.n+'</span>':''):'';
  });
  // смерть
  UI.death.style.display=(started&&!over&&!p.alive)?'flex':'none';
  // магазин — состояния кнопок
  if(shopOpenEl.classList.contains('open')){
    let idx=0;
    shopOpenEl.querySelectorAll('[data-buy]').forEach(b=>{
      const it=ITEMS.find(i=>i.id===b.dataset.buy), n=itemCounts[it.id]||0;
      b.disabled=(it.once&&n>0)||p.gold<it.price;
      b.textContent=(it.once&&n>0)?'Куплено':'Купить';
      idx++; });
  }
}
function drawMM(){
  const W=170,H=170,c=mmCtx;
  c.fillStyle='#22301f'; c.fillRect(0,0,W,H);
  const mx=v=>(v+120)/240*W, mz=v=>(v+120)/240*H;
  c.strokeStyle='rgba(0,0,0,.35)'; c.lineWidth=6;
  c.beginPath(); c.moveTo(mx(-78),mz(0)); c.lineTo(mx(78),mz(0)); c.stroke();
  c.fillStyle='rgba(46,134,200,.5)'; c.fillRect(mx(-6),0, mx(6)-mx(-6), H);
  for(const r of runes){
    c.fillStyle='#'+('00000'+RUNE_COLORS[r.kind].toString(16)).slice(-6);
    const x=mx(r.mesh.position.x), y=mz(r.mesh.position.z);
    c.save(); c.translate(x,y); c.rotate(Math.PI/4); c.fillRect(-2.5,-2.5,5,5); c.restore();
  }
  if(roshan&&roshan.alive){
    const x=mx(G(roshan).x), y=mz(G(roshan).z);
    c.fillStyle='#5a1a14'; c.fillRect(x-3.5,y-3.5,7,7);
    c.strokeStyle='#ff6a5a'; c.lineWidth=1.4; c.strokeRect(x-3.5,y-3.5,7,7);
  }
  for(const t of towers){ if(!t.alive) continue;
    c.fillStyle=t.team===0?'#58d874':'#ff5a44';
    c.fillRect(mx(t.group.position.x)-3, mz(t.group.position.z)-3, 6,6); }
  for(const cp of camps){                                         // нейтральные кемпы
    const x=mx(cp.x), y=mz(cp.z);
    c.strokeStyle=cp.dead?'rgba(150,140,110,.5)':'#d9c25f'; c.lineWidth=1.2;
    c.save(); c.translate(x,y); c.rotate(Math.PI/4);
    c.strokeRect(-3,-3,6,6); c.restore(); }
  for(const cr of creeps){ if(!cr.alive) continue;
    c.fillStyle=cr.team===0?'#8fe8a0':'#ff9b80';
    c.fillRect(mx(G(cr).x)-1.5, mz(G(cr).z)-1.5, 3,3); }
  for(let tm=0;tm<2;tm++){ const a=ancients[tm]; if(!a.alive) continue;
    const x=mx(G(a).x), y=mz(G(a).z);
    c.save(); c.translate(x,y); c.rotate(Math.PI/4);
    c.fillStyle=tm===0?'#7fd88f':'#ff7d6e'; c.fillRect(-4,-4,8,8);
    c.strokeStyle='#fff'; c.lineWidth=1.5; c.strokeRect(-4,-4,8,8); c.restore(); }
  for(const h of heroes){ if(!h.alive) continue;
    const x=mx(G(h).x), y=mz(G(h).z);
    c.beginPath(); c.arc(x,y,4,0,7);
    c.fillStyle=h.team===0?'#2f7ce0':'#d8442f'; c.fill();
    c.lineWidth=h.isPlayer?2:1.2; c.strokeStyle=h.isPlayer?'#ffd257':'#fff'; c.stroke(); }
}

/* ============================ СТАРТ / ФИНАЛ / ПАУЗА ============================ */
function startGame(){
  ensureAudio();
  // выбранный герой
  const selDef=heroDefBySel(heroSel), pi=HEROES.indexOf(selDef);
  if(player.def.id!==selDef.id){ player=rebuildHero(player, pi, true); }
  ABIL=player.def.abils; buildAbilHUD(player);
  $('pletter').textContent=player.def.letter;
  $('heroname').textContent=player.def.name+' · '+player.def.title;
  // бот — Моркус воплощается в случайном архетипе
  const picks=[0,1,2,3].filter(i=>i!==pi);
  const bi=picks[Math.floor(Math.random()*picks.length)];
  bot=rebuildHero(bot, bi, false); bot.name='Моркус';
  addMsg('('+player.def.name+' против '+bot.def.name+'!) Моркус берёт кит: «'+bot.def.name+'»','bad');
  say('Битва началась');
  started=true; waveTimer=15;
  startMusic();
  showBanner('⚔ БИТВА НАЧАЛАСЬ!');
  $('startscreen').style.display='none';
  addMsg('⚔️ Битва началась! Первая крипо-волна через 15 секунд','good');
  sfx('start');
  addMsg('⚔️ '+player.def.name+' ('+player.def.role+') — в бой! Смотри подсказки сверху справа','good');
}
function togglePause(){
  if(!started||over) return;
  paused=!paused; UI.pause.style.display=paused?'flex':'none';
}
function endGame(winner){
  over=true;
  UI.death.style.display='none';
  const win=winner===0;
  const t=$('endtitle');
  t.textContent=win?'ПОБЕДА':'ПОРАЖЕНИЕ';
  t.className=win?'win':'lose';
  $('endstats').innerHTML=
    'Трон сумрака '+(win?'разрушен — слава герою!':'устоял… Моркус оказался хитрее.')+'<br>'+
    'Время битвы: <b>'+fmtTime(gameTime)+'</b> · Счёт: <b>'+player.kills+' : '+bot.kills+'</b><br>'+
    'Крипы добиты: <b>'+player.creepsLH+'</b> · Уровень: <b>'+player.level+'</b>'+
    ((player.maxStreak||0)>1? ' · Лучшая серия: <b>×'+player.maxStreak+'</b>':'')+'<br>'+
    'Золота собрано всего: <b>'+Math.floor((player.earned||0)+650)+'</b> 🪙'+
    ((player.lsPct||0)>0? ' · 🩸 вампиризм '+Math.round(player.lsPct*100)+'%':'');
  $('endscreen').style.display='flex';
  sfx(win?'win':'lose'); say(win?'Победа':'Поражение');
}

function simulate(dt){
  gameTime+=dt;
  // пассивное золото
  giveGold(player, 1.1*dt);
  // волны
  waveTimer-=dt;
  if(waveTimer<=0){ spawnWave(0); spawnWave(1); waveTimer=30; }
  // скорость игрока (для предсказания у бота)
  if(player){
    const gp=G(player);
    if(pPrev){ pvS.x=pvS.x*0.75+((gp.x-pPrev.x)/Math.max(dt,0.001))*0.25;
               pvS.z=pvS.z*0.75+((gp.z-pPrev.z)/Math.max(dt,0.001))*0.25; }
    pPrev={x:gp.x,z:gp.z};
  }
  botThink(dt);
  for(const h of heroes) updateHero(h,dt);
  for(const c of creeps) updateCreep(c,dt);
  for(let i=creeps.length-1;i>=0;i--) if(!creeps[i].alive) creeps.splice(i,1);
  updateJungle(dt);
  for(const t of towers) updateTower(t,dt);
  updateAncients(dt);
  updateProjectiles(dt);
  updateMeteors(dt);
  updateRunes(dt);
  updateRoshan(dt);
  updateNight(dt);
  // лазер фонтана: врагам у чужой базы — больно
  fountainTick-=dt;
  if(fountainTick<=0){
    fountainTick=0.5;
    const all=heroes.concat(creeps);
    for(const e of all){ if(!e.alive) continue;
      const ea=ancients[1-e.team];
      if(dist2D(G(e),G(ea))<14){
        damage(e, 40, null, { magic:true, silent:true });
        if(Math.random()<0.5) spawnBurst(G(e).x,2,G(e).z, 0x66d9ff, 2, 3, {life:0.3, grav:2});
      }
    }
  }
  updateHUD();
  drawMM();
}
function animate(){
  requestAnimationFrame(animate);
  const rdt=Math.min(clock.getDelta(),0.05);
  const dt=(started&&!paused&&!over)?rdt:0;
  if(dt>0) simulate(dt);
  updateFX(dt);
  updateCamera(rdt);
  updateSky(rdt);
  if(waterTex) waterTex.offset.y-=rdt*0.05;
  // маяки фонтанов
  for(const f of fountains) f.beam.rotation.y+=rdt*0.8;
  // знамёна области: колышутся
  for(const f of flags) f.rotation.y=Math.sin(clock.elapsedTime*1.5+f.userData.ph)*0.26;
  // счётчик FPS (обновление дважды в сек)
  frames++; fpsT+=rdt;
  if(fpsT>=0.5){ fpsNow=Math.round(frames/fpsT); frames=0; fpsT=0;
    const fe=document.getElementById('fps'); if(fe) fe.textContent=fpsNow; }
  // блики на реке (днём)
  if(nightK<0.45 && Math.random()<rdt*4){
    spawnBurst(rand(-4.5,4.5), 0.35, rand(-70,70), 0xd6f2ff, 1, 0.22,
      { life:rand(0.5,1.1), grav:-1.1, size:0.38 });
  }
  // взвесь в воздухе тёплым днём
  if(nightK<0.3 && Math.random()<rdt*2){
    spawnBurst(rand(-40,40), rand(0.5,4), rand(-40,40), 0xfff2c8, 1, 0.16,
      { life:rand(1.4,2.6), grav:-0.25, size:0.35 });
  }
  renderer.render(scene,camera);
}

/* отладочный хук (QA) — доступен только на localhost, на публичном сайте скрыт */
if (location.hostname==='localhost' || location.hostname==='127.0.0.1'){
window.__D3 = {
  time: ()=>Math.floor(gameTime),
  pPos: ()=>[+G(player).x.toFixed(1), +G(player).z.toFixed(1)],
  bPos: ()=>[+G(bot).x.toFixed(1), +G(bot).z.toFixed(1)],
  pOrder: ()=> player.order.tgt? 'attack:'+(player.order.tgt.kind||'?') : player.order.type,
  bOrder: ()=> bot.order.tgt? 'attack:'+(bot.order.tgt.kind||'?') : bot.order.type,
  hp: ()=>[(player.hp|0), (bot.hp|0)],
  creeps: ()=>creeps.map(c=>[c.team, +G(c).x.toFixed(0)]),
  towersHP: ()=>towers.map(t=>[t.team, t.group.position.x|0, t.hp|0]),
  state: ()=>({ t:Math.floor(gameTime), nightK:+nightK.toFixed(2), bg:'#'+scene.background.getHexString(),
    runes:runes.length, roshAlive:!!(roshan&&roshan.alive), roshHP:roshan? (roshan.alive? roshan.hp|0 : 'dead resp'+(roshan.respT|0)) : 'none',
    mets:meteors.length, projs:projectiles.length }),
  gold: ()=>[player.gold|0, player.aegis|0, Math.round(player.hasteT||0)],
  cam: ()=>[camLock?1:0, camPos.x===null?-1:+camPos.x.toFixed(1), camPos.z===null?-1:+camPos.z.toFixed(1)],
  hero: ()=>({ p: player.def? player.def.id:'?', b: bot.def? bot.def.id:'?', bname:bot.name,
    hp:player.maxHp|0, mp:player.maxMana|0, sp:+player.speed.toFixed(2), rng:player.atkRange,
    abi:ABIL.map(a=>a.name), cd:player.cds.map(c=>+c.toFixed(1)),
    absorb:player.absorb|0, alive:player.alive }),
  abil: ()=> ABIL.map(a=>a.name),
  pick: (id)=>{ heroSel=id; return heroSel; },
  picked: ()=>heroSel,
  pickCard: (id)=>{ const c=document.querySelector('.hcard[data-h="'+id+'"]'); if(c) c.click(); return heroSel; },
  castAt: (i,x,z)=>{ castAbil(player, i, { x:x||0, z:z||0 }, true); return { cds: player.cds.map(c=>+c.toFixed(1)), mana: player.mana|0 }; },
  lvln: (n)=>{ while(player.level<n) giveXP(player,1000); return player.level; },
  hitMe: (n)=>{ if(player.absorb===undefined) player.absorb=0; damage(player, n||300, bot, {}); return [player.hp|0, player.absorb|0]; },
  boot: ()=>({ slots:(UI.slots&&UI.slots.length)||0, msg:!!UI.msglog, itemSlots:(UI.itemSlots&&UI.itemSlots.length)||0,
    screen: document.getElementById('startscreen')? document.getElementById('startscreen').style.display : 'NO-EL',
    btn: !!document.getElementById('startbtn') }),
  go: ()=>{ if(!started){ try{ startGame(); }catch(e){ return { THROWN: e.message, pdef: player.def? player.def.id:'NO-DEF',
    pab: player.def? (player.def.abils? player.def.abils.length:'NO-ABILS') : 'NO-DEF-ABILS', hs: heroSel, pi: HEROES.indexOf(heroDefBySel(heroSel)) }; } }
    return { started: !!started, screen: document.getElementById('startscreen').style.display }; },
  // --- QA helpers ---
  runetest: ()=>{ spawnRune(); const r=runes[runes.length-1]; if(!r) return 'none';
    G(player).set(r.mesh.position.x,0,r.mesh.position.z); return r.kind; },
  hurtRosh: (n)=>{ damage(roshan, n||150, player, {}); return roshan.hp|0; },
  killRosh: ()=>{ die(roshan, player); return { aegis:player.aegis, gold:player.gold|0, respT:roshan.respT|0 }; },
  night: (sec)=>{ gameTime=sec; updateNight(60); return { nightK:+nightK.toFixed(2), bg:'#'+scene.background.getHexString() }; },
  tp: (n)=>{ if(!player.channel){ itemCounts.tp=n; useTP(); } return { channel:player.channel, left:itemCounts.tp }; },
  tpbreak: ()=>{ if(player.channel){ player.channel=0.01; window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'})); setTimeout(()=>window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'})),50); } },
  aegisDie: ()=>{ player.hp=1; damage(player, 50, bot, {}); return { aegis:player.aegis, alive:player.alive, hp:player.hp|0 }; },
  tpDie: ()=>{ if(player.channel) player.channel=0; return 'reset'; },
  camps: ()=>camps.map(c=>({ x:c.x, z:c.z, alive:c.members.filter(m=>m.alive).length, dead:c.dead, resp:Math.ceil(c.respT)||0 })),
  goCamp: (idx)=>{ const c=camps[idx||0]; if(!c) return 'no camp';
    c.members.forEach(m=>{ m.target=player; }); G(player).set(c.x,0,c.z); return '_aggro'; },
  waveN: ()=>waveCount,
  juice: ()=>{ player.gold=9000; ['sword','armor','boots','regen','vamp','ring','tome'].forEach(id=>buyItem(id));
    return { ls:+(player.lsPct||0).toFixed(2), mr:+player.manaRegen.toFixed(1), mmp:player.maxMana|0, lvl:player.level, gold:player.gold|0 }; },
  lsTest: ()=>{ const t=enemiesOf(0)[0]; if(!t) return 'nt'; const hp0=player.hp|0;
    performAttack(player,t); return [hp0, player.hp|0]; },
  mus: ()=>musOn,
  lit: ()=>({ hemi:+hemiL.intensity.toFixed(2), sun:+sunL.intensity.toFixed(2), amb:+ambL.intensity.toFixed(2),
    k:+nightK.toFixed(2), fog:[scene.fog.near|0, scene.fog.far|0] }),
  render: ()=>{ renderer.render(scene,camera); return 'ok'; },
  fps: ()=>fpsNow,
  advance: (sec)=>{ const steps=Math.min(900, Math.max(1, Math.ceil((sec||1)/0.033)));
    for(let i=0;i<steps;i++) simulate(0.033);
    renderer.render(scene,camera); return { t:gameTime|0, k:+nightK.toFixed(2), wc:waveCount }; },
  jpos: ()=>jcamps.filter(j=>j.alive).slice(0,2).map(j=>[j.name, +G(j).x.toFixed(1), +G(j).z.toFixed(1)]),
  killJ: (idx)=>{ const arr=jcamps.filter(j=>j.alive); const j=arr[idx===undefined?0:idx]; if(!j) return 'none';
    die(j, player); return camps.map(c=>({ n:c.members.filter(m=>m.alive).length, dead:c.dead, resp:+c.respT.toFixed(1) })); },
  respCamp: (idx)=>{ const c=camps[idx||0]; if(c){ c.dead=true; c.respT=0.02; } return 'ok'; },
  waveT: (v)=>{ if(v!==undefined) waveTimer=v; return +waveTimer.toFixed(2); },
  goto: (x,z)=>{ G(player).set(x,0,z); return '_ok'; },
  fx: ()=>({ dec:decalsP.filter(d=>d.life>0).length, beams:beamsP.filter(b=>b.life>0).length,
    met:meteors.length, prj:projectiles.length, parts:partsP.filter(p=>p.life>0).length,
    shield: !!(player.shieldFx&&player.shieldFx.visible) }),
  gfx: ()=>({
    stoneTower: (()=>{ let f='no-stone'; towers[0].group.traverse(o=>{ if(!f.includes('map')&&o.material&&o.material.isMeshStandardMaterial&&o.material.map) f='stone-map'; }); return f; })(),
    ancMapRepeat: (()=>{ let r=0; ancients[0].group.traverse(o=>{ if(o.material&&o.material.isMeshStandardMaterial&&o.material.map) r=o.material.map.repeat.x; }); return r; })(),
    blobs: { hero:!!(player&&player.blob), creep:!!(creeps[0]&&creeps[0].blob), jc:!!(jcamps[0]&&jcamps[0].blob),
      tower:!!(towers[0]&&towers[0].blob), rosh:!!(roshan&&roshan.blob),
      playerVisible: !!(player&&player.blob&&player.blob.visible),
      playerAt: (player&&player.blob)? [player.blob.position.x.toFixed(1), player.blob.position.z.toFixed(1)] : null,
      heroAt: [G(player).x.toFixed(1), G(player).z.toFixed(1)] },
    fpsNow,
  }),
  nwave: (n)=>{ for(let k=0;k<(n||1);k++){ spawnWave(0); spawnWave(1); } return waveCount; },
  sfx, say,
};
}

})();

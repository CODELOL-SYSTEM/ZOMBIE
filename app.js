import * as THREE from 'three';
const $=i=>document.getElementById(i),V3=THREE.Vector3,PI=Math.PI;
// Touches physiques (event.code) : ZQSD sur AZERTY = WASD sur QWERTY
const K={fwd:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',run:'ShiftLeft',sprint:'KeyF',crouch:'KeyC',prone:'KeyX',jump:'Space',roll:'KeyB',use:'KeyE',night:'KeyN',view:'KeyV',phone:'KeyP'};
const wrap=a=>((a+PI)%(2*PI)+2*PI)%(2*PI)-PI;
const canvas=$('c'),R=new THREE.WebGLRenderer({canvas,antialias:true});
R.setPixelRatio(Math.min(devicePixelRatio,2));R.shadowMap.enabled=true;
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(70,1,.1,300);
const resize=()=>{R.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};
addEventListener('resize',resize);resize();
const hemi=new THREE.HemisphereLight(0xbcd0ff,0x445533,1),sun=new THREE.DirectionalLight(0xffffff,1.6);
sun.position.set(30,50,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-60,right:60,top:60,bottom:-60,far:160});
scene.add(hemi,sun);
const torch=new THREE.PointLight(0xffd9a0,0,14);scene.add(torch);
const M=(c,r=.9,e=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,emissive:e});
const gBox=new THREE.BoxGeometry(1,1,1),gBall=new THREE.SphereGeometry(1,10,8),gWheel=new THREE.CylinderGeometry(.34,.34,.24,18),glassM=M(0x16222e,.1,0x05080c);

/* ============ JALON 2 : MONDE ============ */
const cols=[],walls=[],occ=[];
function box(x,y,z,w,h,d,mat,col=true){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;scene.add(m);
  if(col){const c={x1:x-w/2,x2:x+w/2,z1:z-d/2,z2:z+d/2};cols.push(c);if(h>2){walls.push(c);occ.push(m)}}
  return m;
}
const mWall=M(0xd8c9a8),mFloor=M(0x8a6a48),mWood=M(0x6b4a2b),mDark=M(0x2c2c32);
function seg(h,f,a,b){const l=b-a,c=(a+b)/2;h?box(c,1.45,f,l,2.9,.25,mWall):box(f,1.45,c,.25,2.9,l,mWall)}
function wall(h,f,a,b,gaps=[]){let cur=a;for(const[g0,g1]of gaps.slice().sort((p,q)=>p[0]-q[0])){if(g0>cur)seg(h,f,cur,g0);cur=g1}if(b>cur)seg(h,f,cur,b)}
const gr=new THREE.Mesh(new THREE.PlaneGeometry(400,400),M(0x3d5a30));gr.rotation.x=-PI/2;gr.receiveShadow=true;scene.add(gr);
const road=new THREE.Mesh(new THREE.PlaneGeometry(400,10),M(0x2a2a2e));road.rotation.x=-PI/2;road.position.set(0,.02,14);road.receiveShadow=true;scene.add(road);
box(0,.05,8.4,400,.1,1.4,M(0x888888),false);
for(let x=-60;x<=60;x+=6)box(x,.04,14,2,.02,.15,M(0xcccccc),false);
// Maison de la grand-mère (x -8..8, z -6..6), garage (x 8..14, z -6..2)
box(0,.05,0,16,.1,12,mFloor,false);box(11,.05,-2,6,.1,8,M(0x777777),false);
wall(true,6,-8,8,[[-7.5,-5.5],[-1,1],[3.5,5.5]]);wall(true,-6,-8,8,[[4,6]]);wall(false,-8,-6,6);wall(false,8,-6,6,[[-2,0]]);
wall(true,0,-8,8,[[-5,-3],[-1,1],[3,5]]);wall(false,-2,-6,0);wall(false,2,-6,0);wall(true,-3,-2,2,[[-1,1]]);
wall(true,2,8,14,[[10,12]]);wall(true,-6,8,14);wall(false,14,-6,2);
// Meubles
const F=(x,z,w,d,h,c,y)=>box(x,y??h/2,z,w,h,d,M(c));
F(-7.3,3,1,3,.8,0x553322);F(-5.8,3.2,1.2,.8,.5,0x4a3a2a);F(-4,5.5,1.8,.4,1,0x2a2a2a);
box(-4,1.35,5.5,1.6,.9,.1,M(0x111111,.2,0x14284a),false);   // télévision (boutique au jalon 5)
F(6.5,5.3,2.4,.8,1,0xaaaaaa);F(7.4,1.5,.8,.8,2,0xdddddd);F(4,3,1.6,1.2,.8,0x7a5a3a);
F(-6.5,-4.8,2,2.2,.7,0x8a5a6a);F(-7.5,-1.5,.8,1.6,2,0x5a3a22);F(-4,-3,.8,.8,.6,0x6b4a2b);
F(0,-5.3,3.4,1,.6,0xeeeeee);F(6.5,-4.8,2,2.2,.7,0x4a6a8a);F(3,-1.2,.8,1.6,.8,0x6b4a2b);
F(13.3,-3,.8,3,1,0x6b4a2b);F(11,-5.2,1,1,.6,0x8a6a3a);
// Voisins : visibles mais inaccessibles (toit à deux pans, fenêtres à cadres, porte, perron, cheminée)
function prism(x,y,z,w,h,d,mat){const sh=new THREE.Shape();sh.moveTo(-w/2,0);sh.lineTo(w/2,0);sh.lineTo(0,h);sh.closePath();
  const g=new THREE.ExtrudeGeometry(sh,{depth:d,bevelEnabled:false});g.translate(0,0,-d/2);const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);m.castShadow=true;scene.add(m)}
function win(x,y,z){box(x,y,z,1.9,1.6,.12,M(0xf0f0f0),false);box(x,y,z+.07,1.6,1.3,.05,glassM,false);box(x,y,z+.1,.06,1.3,.04,M(0xf0f0f0),false);box(x,y,z+.1,1.6,.06,.04,M(0xf0f0f0),false);box(x,y-.85,z+.1,2.2,.1,.25,M(0xcccccc),false)}
[-36,-22,22,36].forEach((x,i)=>{
  box(x,3,0,12,6,10,M([0xb8a58a,0x9aa7b0,0xc4b098,0xa89aa0][i],.95));box(x,.15,0,12.4,.3,10.4,M(0x777777),false);
  prism(x,6,0,13.6,3.4,11,M([0x5a2e2a,0x3a3f4a,0x4a3a30,0x2e3a2e][i],.8));box(x+3.5,8.6,-1.5,1,2.6,1,M(0x7a4a3a));
  win(x-3.6,1.9,5.06);win(x+3.6,1.9,5.06);[-3.6,0,3.6].forEach(wx=>win(x+wx,4.7,5.06));
  box(x,1.15,5.08,1.3,2.3,.14,M(0x3a2a1c,.7),false);box(x,1.15,5.04,1.6,2.45,.1,M(0xf0f0f0),false);box(x+.4,1.1,5.18,.08,.08,.08,M(0xc9a23a,.3),false);
  box(x,.1,6.2,3,.2,2.4,M(0x999999),false);box(x,2.9,6.2,2.6,.12,2.2,M(0x3a2a1c),false);
});
// Fond de jardin et clôtures
[[0,-16,20,.2],[-10,-11,.2,10],[10,-11,.2,10]].forEach(([x,z,w,d])=>box(x,.6,z,w,1.2,d,mWood));
// Voitures, poubelles, barrières, lampadaires, débris
function car(x,z,vert,c){
  const g=new THREE.Group(),b=(w,h,d,col,px,py,pz,mt)=>{const m=new THREE.Mesh(gBox,mt||M(col,.35));m.scale.set(w,h,d);m.position.set(px,py,pz);m.castShadow=true;g.add(m);return m};
  b(4.2,.5,1.8,c,0,.58,0);b(4.3,.14,1.7,0x111111,0,.3,0);b(1.3,.1,1.76,c,1.45,.86,0);b(1.1,.1,1.76,c,-1.55,.86,0);
  b(1.9,.46,1.5,c,-.1,1.1,0);b(1.95,.36,1.56,0,-.1,1.12,0,glassM);b(1.7,.06,1.56,c,-.1,1.36,0);
  for(const s of[-1,1]){b(.05,.14,.4,0,2.1,.66,s*.62,M(0xfff2c0,.3,0x887744));b(.05,.14,.4,0,-2.1,.66,s*.62,M(0xaa1111,.4,0x330000));
    for(const f of[-1,1]){const w=new THREE.Mesh(gWheel,M(0x151515));w.rotation.x=PI/2;w.position.set(f*1.3,.34,s*.9);w.castShadow=true;g.add(w);
      const hub=new THREE.Mesh(gWheel,M(0xaaaaaa,.3));hub.scale.set(.5,1.05,.5);hub.rotation.x=PI/2;hub.position.copy(w.position);g.add(hub)}}
  b(.12,.18,1.9,0x333333,2.15,.4,0);b(.12,.18,1.9,0x333333,-2.15,.4,0);
  g.position.set(x,0,z);if(vert)g.rotation.y=PI/2;scene.add(g);
  const w=vert?1.9:4.3,d=vert?4.3:1.9;cols.push({x1:x-w/2,x2:x+w/2,z1:z-d/2,z2:z+d/2});
}
car(-14,12,false,0x8a2a2a);car(9,16.5,true,0x3a4a6a);car(-30,11.5,false,0x666666);car(24,12,false,0x3a5a3a);car(-6,17,false,0xcfcfcf);car(38,16.5,true,0x7a6a2a);
function bin(x,z){const m=new THREE.Mesh(new THREE.CylinderGeometry(.35,.3,.9,10),M(0x2e4a34));m.position.set(x,.45,z);m.castShadow=true;scene.add(m);cols.push({x1:x-.35,x2:x+.35,z1:z-.35,z2:z+.35})}
[[-9,8.6],[9,8.6],[-26,8.6],[28,8.6],[-40,8.6]].forEach(p=>bin(...p));
[[-5,10.3],[5,10.3],[18,10.3]].forEach(([x,z])=>box(x,.5,z,2.4,1,.2,M(0xd8832a)));
const lampL=[];
[-20,0,20].forEach(x=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,5,8),mDark);p.position.set(x,2.5,8.3);scene.add(p);
  box(x,5,8.3,.5,.2,.5,M(0xffe9b0,.5,0xffd080),false);const l=new THREE.PointLight(0xffd9a0,0,24);l.position.set(x,4.6,9);scene.add(l);lampL.push(l)});
for(let i=0;i<28;i++){const s=.2+Math.random()*.5,m=box(-45+Math.random()*90,s/2,10+Math.random()*8,s,s,s,M(0x4a4a44),false);m.rotation.y=Math.random()*PI}

/* ============ JALON 1 : PERSONNAGES ============ */
function hand(par,skin){const h=new THREE.Group();h.position.y=-.31;par.add(h);h.f=[];
  const bx=(par2,sx,sy,sz,x,y,z)=>{const o=new THREE.Mesh(gBox,M(skin));o.scale.set(sx,sy,sz);o.position.set(x,y,z);par2.add(o);return o};
  bx(h,.075,.09,.035,0,-.045,0);
  [-.027,-.009,.009,.027].forEach((x,i)=>{const f=new THREE.Group();f.position.set(x,-.09,0);h.add(f);bx(f,.016,i%3?.06:.052,.016,0,-.03,0);h.f.push(f)});
  const t=new THREE.Group();t.position.set(.042,-.03,.012);t.rotation.z=.5;h.add(t);bx(t,.019,.05,.019,0,-.025,0);return h}
const curl=(h,v)=>h.f.forEach(f=>f.rotation.x=-v);
function human(shirt,pants,skin,hair,o={}){
  const g=new THREE.Group(),mk=(geo,c,par=g)=>{const m=new THREE.Mesh(geo,M(c));par.add(m);return m};
  const sc=(m,sx,sy,sz,x,y,z)=>{m.scale.set(sx,sy,sz);m.position.set(x,y,z);return m};
  const gT=new THREE.CapsuleGeometry(.19,.4,4,12),gL=new THREE.CapsuleGeometry(.075,.55,4,8),gH=new THREE.SphereGeometry(.14,18,14);
  sc(mk(gT,shirt),1,1,.7,0,1.15,0);sc(mk(gBox,pants),.4,.14,.26,0,.86,0);sc(mk(gBox,0x2a1a10),.41,.03,.27,0,.93,0);
  sc(mk(gL,skin),.9,.22,.9,0,1.5,0);sc(mk(gBox,shirt),.3,.03,.2,0,1.52,.02);
  if(o.skirt){const k=new THREE.Mesh(new THREE.CylinderGeometry(.22,.34,.55,14),M(o.skirt));k.position.y=.66;g.add(k)}
  const hd=new THREE.Group();hd.position.y=1.64;g.add(hd);
  sc(mk(gH,skin,hd),1,1.12,1.05,0,0,0);sc(mk(gBall,skin,hd),.022,.04,.04,0,-.012,.152);
  for(const s of[-1,1]){sc(mk(gBall,0xffffff,hd),.022,.014,.01,s*.055,.03,.138);sc(mk(gBall,o.eye||0x2a3a4a,hd),.011,.011,.01,s*.055,.03,.146);
    sc(mk(gBox,hair,hd),.04,.008,.01,s*.055,.057,.142);sc(mk(gBall,skin,hd),.014,.035,.025,s*.14,0,0)}
  sc(mk(gBox,o.mouth||0x8a3a3a,hd),.05,.01,.01,0,-.07,.142);
  sc(mk(gH,hair,hd),1.04,.88,1.0,0,.045,-.03);sc(mk(gH,hair,hd),1.02,.8,.6,0,-.01,-.11);
  if(o.bun)sc(mk(gBall,hair,hd),.07,.07,.07,0,.14,-.12);
  if(o.glasses){for(const[w,h,x,y]of[[.12,.006,0,.055],[.12,.006,0,.005],[.006,.05,-.06,.03],[.006,.05,.06,.03],[.006,.05,0,.03]])sc(mk(gBox,0x222222,hd),w,h,.006,x,y,.147)}
  const limb=(c,c2,x,y,L,w)=>{const p=new THREE.Group();p.position.set(x,y,0);g.add(p);
    const a=mk(gL,c,p);a.scale.set(w,L/1.4,w);a.position.y=-L/4;
    const j=new THREE.Group();j.position.y=-L/2;p.add(j);const b=mk(gL,c2,j);b.scale.set(w*.9,L/1.4,w*.9);b.position.y=-L/4;return[p,j]};
  const[legL,kneeL]=limb(pants,pants,-.1,.8,.8,1.05),[legR,kneeR]=limb(pants,pants,.1,.8,.8,1.05),
        [armL,elbL]=limb(shirt,o.long?shirt:skin,-.28,1.4,.6,.8),[armR,elbR]=limb(shirt,o.long?shirt:skin,.28,1.4,.6,.8);
  for(const k of[kneeL,kneeR]){sc(mk(gBox,o.shoe||0x222222,k),.11,.07,.27,0,-.37,.06);sc(mk(gBox,0xeeeeee,k),.115,.025,.275,0,-.405,.06)}
  const handL=hand(elbL,skin),handR=hand(elbR,skin);
  g.userData={legL,legR,armL,armR,kneeL,kneeR,elbL,elbR,handL,handR,head:hd};return g;
}
function actor(g,shadow){ // holder(cap) > piv(pivot hanche, bascule) > g
  const h=new THREE.Group(),p=new THREE.Group();p.position.y=.8;g.position.y=-.8;p.add(g);h.add(p);scene.add(h);
  g.traverse(o=>{if(o.isMesh)o.castShadow=shadow});h.userData={...g.userData,g,p};return h;
}
function walkAnim(u,sp,t){const a=Math.sin(t*sp*2.2)*Math.min(sp/4,1)*.9;u.legL.rotation.x=a;u.legR.rotation.x=-a;u.armL.rotation.x=-a;u.armR.rotation.x=a;u.kneeL.rotation.x=Math.max(0,a)*.9;u.kneeR.rotation.x=Math.max(0,-a)*.9;u.elbL.rotation.x=u.elbR.rotation.x=-.3}
const pm=actor(human(0x2a5a8a,0x333a44,0xe0b090,0x3a2a1a,{shoe:0xf2f2f2}),true);
const grandma=actor(human(0x9a6a8a,0x5a4a5a,0xe3c0a8,0xdddddd,{bun:1,glasses:1,skirt:0x5a4a5a,long:1,shoe:0x333333}),true);
grandma.position.set(-4,.0,-3);grandma.userData.g.position.y=-.8-.2;grandma.userData.legL.rotation.x=grandma.userData.legR.rotation.x=-1.5;grandma.rotation.y=0;
grandma.userData.armL.rotation.x=grandma.userData.armR.rotation.x=-.5;grandma.userData.kneeL.rotation.x=grandma.userData.kneeR.rotation.x=1.5;grandma.userData.elbL.rotation.x=grandma.userData.elbR.rotation.x=-.8;

/* ============ ÉTAT ============ */
const keys={},P={pos:new V3(0,0,7.5),vy:0,cam:0,pit:.35,face:PI,hp:100,st:100,crouch:false,prone:false,slide:0,roll:0,punch:0,pcd:0,n:0,nImp:0,dx:0,dz:0,spd:0,moving:false,inv:0,kills:0,time:0,nights:0,sprint:false};
let playing=false,paused=false,dead=false,fp=false,night=false,tm=0,msgT=0,bubT=0;
const W={n:0,active:false,queue:0,spawnT:0},Z=[];
const msg=(t,ms=3500)=>{$('msg').textContent=t;msgT=ms/1000};
const say=t=>{if(bubT>0)return;$('bubble').textContent='Mamie : '+t;bubT=5};
function setNight(b){night=b;scene.background=new THREE.Color(b?0x070a12:0x8fb4d9);scene.fog=b?new THREE.Fog(0x070a12,6,55):new THREE.Fog(0x8fb4d9,40,150);
  hemi.intensity=b?.3:1;sun.intensity=b?.12:1.6;torch.intensity=b?22:0;lampL.forEach(l=>l.intensity=b?70:0)}
setNight(false);

/* ============ COLLISIONS ET NAVIGATION ============ */
function resolve(p,r){for(const c of cols){const cx=Math.max(c.x1,Math.min(p.x,c.x2)),cz=Math.max(c.z1,Math.min(p.z,c.z2)),dx=p.x-cx,dz=p.z-cz,d2=dx*dx+dz*dz;
  if(d2>=r*r)continue;
  if(d2>1e-6){const d=Math.sqrt(d2),k=(r-d)/d;p.x+=dx*k;p.z+=dz*k}
  else{const l=p.x-c.x1,rr=c.x2-p.x,t=p.z-c.z1,b=c.z2-p.z,m=Math.min(l,rr,t,b);if(m===l)p.x=c.x1-r;else if(m===rr)p.x=c.x2+r;else if(m===t)p.z=c.z1-r;else p.z=c.z2+r}}}
function blocked(a,b,r,L=cols){const d=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(d/.4));
  for(let i=0;i<=n;i++){const x=a.x+(b.x-a.x)*i/n,z=a.z+(b.z-a.z)*i/n;for(const c of L)if(x>c.x1-r&&x<c.x2+r&&z>c.z1-r&&z<c.z2+r)return true}return false}
const nodes=[[-12,11],[-4,10.5],[0,10.5],[4,10.5],[12,11],[0,7.5],[-6,7.5],[6,7.5],[11,5],[0,4.5],[-4.5,4.2],[5,4.2],[5.6,2.2],[-4,0],[0,0],[4,0],[0,-1.5],[0,-4],
  [-4,-1.2],[-2.7,-2.5],[-3,-4.5],[5,-1.5],[5,-6],[5,-9],[11,3],[11,0],[9.5,-1],[7,-1],[-6.5,7.3],[4.5,7.3],[-5.8,4.6]].map(([x,z])=>({x,z}));
const adj=nodes.map((a,i)=>nodes.map((b,j)=>j!==i&&Math.hypot(a.x-b.x,a.z-b.z)<14&&!blocked(a,b,.25)?j:-1).filter(j=>j>=0));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function findPath(a,b){
  if(!blocked(a,b,.3))return[{x:b.x,z:b.z}];
  const g={},prev={},closed={},open=[];
  nodes.forEach((n,i)=>{if(!blocked(a,n,.3)){g[i]=dist(a,n);prev[i]=-1;open.push(i)}});
  const goal=new Set();nodes.forEach((n,i)=>{if(!blocked(n,b,.3))goal.add(i)});
  let best=null,bc=1e9;
  while(open.length){open.sort((p,q)=>g[p]-g[q]);const i=open.shift();if(closed[i])continue;closed[i]=1;if(g[i]>=bc)break;
    if(goal.has(i)){const c=g[i]+dist(nodes[i],b);if(c<bc){bc=c;best=i}}
    for(const j of adj[i]){const c=g[i]+dist(nodes[i],nodes[j]);if(g[j]===undefined||c<g[j]){g[j]=c;prev[j]=i;if(!closed[j])open.push(j)}}}
  if(best===null)return[{x:b.x,z:b.z}];
  const path=[{x:b.x,z:b.z}];for(let i=best;i!==-1;i=prev[i])path.unshift(nodes[i]);return path;
}

/* ============ RÉGLAGES SANG / GORE ============ */
const G={blood:3,vol:1,gore:false,bones:false,org:false};
try{Object.assign(G,JSON.parse(localStorage.getItem('pg_set'))||{})}catch(e){}
if(!G.gore)G.bones=G.org=false;
function saveG(){try{localStorage.setItem('pg_set',JSON.stringify(G))}catch(e){}}
const mBl=M(0x8a0f0f,.5),mBn=M(0xeeeeee,.6),mOr=M(0x7a2a3a,.5),gibL=[];
const LN={armL:'bras gauche',armR:'bras droit',legL:'jambe gauche',legR:'jambe droite'};

/* ============ JALONS 4-6 : PORTES, BARRICADES, ARMES ============ */
Object.assign(P,{money:50,earned:50,spent:0,planks:0,bandages:1,legLost:0,own:{},ammo:{},res:{},cur:'Poings',xp:0,rel:0,dmgTaken:0,aim:false,mouse:false,notif:true,log:[],work:null,sens:1});
const lvl=()=>1+Math.floor(P.xp/100);
const WP={Poings:{n:'Poings',dmg:20,rate:.5,noise:8,rng:1.8},Marteau:{n:'Marteau',dmg:35,rate:.6,noise:8,rng:2},
  Couteau:{n:'Couteau',dmg:60,rate:.4,noise:6,rng:1.9,lvl:1,price:500},
  Revolver:{n:'Revolver',dmg:70,rate:.7,noise:22,mag:6,lvl:3,price:1200,len:.22},
  'Glock 17':{n:'Glock 17',dmg:38,rate:.22,noise:20,mag:17,lvl:5,price:1500,len:.2},
  'SPAS-12':{n:'SPAS-12',dmg:130,rate:.9,noise:26,mag:8,lvl:10,price:3000,len:.7},
  AK:{n:'AK',dmg:42,rate:.1,noise:24,mag:30,auto:1,lvl:15,price:4000,len:.8},
  SCAR:{n:'SCAR',dmg:48,rate:.11,noise:24,mag:30,auto:1,lvl:20,price:5000,len:.75}};
const SL=['Marteau','Couteau','Revolver','Glock 17','SPAS-12','AK','SCAR'];
const B=[],mPl=M(0x8a6a3a),fxs=[],impacts=[];let uiOpen=false,tab='stats',shopMsg='',lastSave='';
const WM={},hR=pm.userData.handR,part=(par,w,h,d,x,y,z,c)=>{const m=new THREE.Mesh(gBox,M(c,.5));m.scale.set(w,h,d);m.position.set(x,y,z);par.add(m)};
for(const n of SL){const g=new THREE.Group();g.visible=false;hR.add(g);WM[n]=g;
  if(n==='Marteau'){part(g,.035,.38,.035,0,-.12,0,0x6b4a2b);part(g,.06,.08,.16,0,-.3,0,0x666666)}
  else if(n==='Couteau'){part(g,.02,.22,.045,0,-.15,0,0xcccccc);part(g,.03,.08,.04,0,-.02,0,0x222222)}
  else{const L=WP[n].len;part(g,.05,L,.07,0,-L/2-.02,0,0x1a1a1a);part(g,.045,.1,.05,0,-.06,-.07,0x2a2a2a);if(L>.5)part(g,.04,.14,.05,0,-.35,-.08,0x2a2a2a)}}
const plk=new THREE.Mesh(gBox,mPl);plk.scale.set(.5,.12,.04);plk.position.set(0,-.1,.05);plk.visible=false;pm.userData.handL.add(plk);
function mkB(kind,cx,z,w){
  const g=new THREE.Group();g.position.set(cx,0,z);scene.add(g);
  const c={x1:cx-w/2,x2:cx+w/2,z1:z-.2,z2:z+.2};cols.push(c);
  const b={kind,cx,z,w,g,c,open:false,locked:false,dead:false,planks:0,pl:[],hp:kind==='door'?150:60};
  if(kind==='door'){b.hinge=new THREE.Group();b.hinge.position.x=-w/2;g.add(b.hinge);
    b.dm=new THREE.Mesh(gBox,M(0x4a3020,.7));b.dm.scale.set(w,2.4,.1);b.dm.position.set(w/2,1.2,0);b.dm.castShadow=true;b.hinge.add(b.dm);
    const k=new THREE.Mesh(gBall,M(0xc9a23a,.3));k.scale.setScalar(.05);k.position.set(w-.2,1.1,.08);b.hinge.add(k);box(cx,2.65,z,w,.5,.25,mWall,false)}
  else{b.gl=new THREE.Mesh(gBox,M(0x16222e,.1,0x05080c));b.gl.scale.set(w,1.1,.04);b.gl.position.y=1.55;g.add(b.gl);
    b.cr=new THREE.Group();b.cr.visible=false;g.add(b.cr);
    [[.9,.5],[-.7,-.4],[.2,1.2]].forEach(([r,x])=>{const l=new THREE.Mesh(gBox,M(0xdddddd));l.scale.set(.02,.9,.01);l.position.set(x*.5,1.55,.03);l.rotation.z=r;b.cr.add(l)});
    box(cx,.5,z,w,1,.25,mWall,false);box(cx,2.5,z,w,.8,.25,mWall,false)}
  B.push(b);return b}
mkB('door',0,6,2);mkB('win',-6.5,6,2);mkB('win',4.5,6,2);mkB('door',11,2,2);
const base=b=>b.kind==='door'?150:60;
function addPlank(b){const y=.55+b.planks*.55,m=new THREE.Mesh(gBox,mPl);m.scale.set(b.w*.95,.16,.05);m.position.set(0,y,.2);m.rotation.z=(Math.random()-.5)*.08;m.castShadow=true;b.g.add(m);m.userData.n=[];
  for(const sx of[-1,1])for(const dy of[-.04,.04]){const n=new THREE.Mesh(gBox,M(0x222222));n.scale.setScalar(.035);n.position.set(sx*b.w*.42,y+dy,.23);b.g.add(n);m.userData.n.push(n)}
  b.pl.push(m);b.planks++;b.hp+=60}
function removePlank(b){const m=b.pl.pop();if(!m)return;m.userData.n.forEach(n=>b.g.remove(n));b.g.remove(m);b.planks--}
function setOpen(b,v){if(b.dead||b.kind!=='door')return;b.open=v;const i=cols.indexOf(b.c);if(v&&i>=0)cols.splice(i,1);if(!v&&i<0)cols.push(b.c);b.hinge.rotation.y=v?1.6:0}
function destroyB(b){b.dead=true;const i=cols.indexOf(b.c);if(i>=0)cols.splice(i,1);while(b.planks)removePlank(b);if(b.kind==='door'){b.dm.visible=false;b.hinge.rotation.y=0}else{b.gl.visible=false;b.cr.visible=false}puff(b.cx,1.2,b.z,10)}
function hitB(b,d){if(b.dead)return;b.hp-=d;while(b.planks>0&&b.hp<=base(b)+(b.planks-1)*60)removePlank(b);if(b.cr)b.cr.visible=b.hp<base(b)*.6;if(b.hp<=0)destroyB(b)}
const nearB=()=>{let r=null,bd=2.4;for(const b of B){if(b.dead)continue;const d=Math.hypot(P.pos.x-b.cx,P.pos.z-b.z);if(d<bd){bd=d;r=b}}return r};
function startWork(k){if(P.work||P.roll>0)return;const b=nearB();if(!b||b.open)return;
  if(k==='plank'){if(P.planks<1)return msg('Aucune planche : achetez-en à la télévision.',2500);if(b.planks>=3)return msg('Barricade au maximum.',2000)}
  else if(b.hp>=base(b)+b.planks*60)return msg('Rien à réparer.',1500);
  P.work={k,b,t:.9,d:0}}
function workDone(){const{k,b}=P.work;P.work=null;if(b.dead)return;if(k==='plank'){P.planks--;addPlank(b)}else{b.hp=base(b)+b.planks*60;if(b.cr)b.cr.visible=false}puff(b.cx,1.2,b.z+.5,6)}
function puff(x,y,z,n=6){for(let i=0;i<n;i++){const m=new THREE.Mesh(gBox,M(0xbbaa88));m.scale.setScalar(.05+Math.random()*.05);m.position.set(x,y,z);scene.add(m);fxs.push({m,t:.7,v:new V3((Math.random()-.5)*1.5,Math.random()*1.5,(Math.random()-.5)*1.5)})}}
function updFx(dt){for(let i=fxs.length-1;i>=0;i--){const f=fxs[i];f.t-=dt;if(f.v){f.m.position.addScaledVector(f.v,dt);f.v.y-=(f.bl?9:3)*dt;if(f.bl&&f.m.position.y<.03){f.m.position.y=.03;f.v.set(0,0,0)}}if(f.t<=0){scene.remove(f.m);if(f.line)f.m.geometry.dispose();fxs.splice(i,1)}}}
function tracer(a,b){const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),new THREE.LineBasicMaterial({color:0xffe9a0}));scene.add(l);fxs.push({m:l,t:.05,line:1})}
function impact(p){const m=box(p.x,p.y,p.z,.08,.08,.08,M(0x111111),false);impacts.push(m);if(impacts.length>60)scene.remove(impacts.shift())}

/* ============ SANG, GORE, MORSURE, BANDAGE, GARROT ============ */
const GM=()=>G.gore?Math.max(2,G.blood)*5:G.blood;
function keep(m){gibL.push(m);if(gibL.length>160)scene.remove(gibL.shift())}
function decal(x,z,k=1){const m=new THREE.Mesh(gBox,mBl);m.scale.set((.3+Math.random()*.4)*k,.01,(.3+Math.random()*.4)*k);m.position.set(x+(Math.random()-.5),.03,z+(Math.random()-.5));scene.add(m);keep(m)}
function blood(x,y,z,n,dir){const k=GM();if(!k||fxs.length>700)return;const c=Math.min(n*k,90);
  for(let i=0;i<c;i++){const m=new THREE.Mesh(gBox,mBl);m.scale.set(.04+Math.random()*.07,.04+Math.random()*.07,.04+Math.random()*.1);m.position.set(x,y,z);scene.add(m);
    const v=new V3((Math.random()-.5)*4,1+Math.random()*4,(Math.random()-.5)*4);if(dir)v.addScaledVector(dir,4);fxs.push({m,t:1.1,v,bl:1})}
  if(n>1&&(G.gore||G.blood>1))decal(x,z,G.gore?1.4:.8)}
function gibs(z){const p=z.a.position;blood(p.x,1,p.z,10);if(!G.gore)return}
const ZL=['armL','armR','legL','legR'];
function dismember(z){}
function corpse(z){const u=z.a.userData;u.p.rotation.x=-PI/2;u.p.position.y=.22;keep(z.a)}
function bitesUpd(dt){P.food=Math.max(0,P.food-dt*.35);P.water=Math.max(0,P.water-dt*.5);if((P.food<=0||P.water<=0)&&!dead){P.hp-=dt*2;if(P.hp<=0)die()}const b=P.bite;if(!b)return;b.t-=dt;if(b.t<=0){P.bite=null;msg('L\'infection vous a submergé.',3000);P.inv=0;hurt(999)}}
function bandage(){if(!P.bite)return msg('Aucune morsure à soigner.',1500);if(P.bite.band)return msg('Déjà bandé : T pour le garrot.',1800);
  if(P.bandages<1)return msg('Aucun bandage : achetez-en à la télévision.',2500);P.bandages--;P.bite.band=true;msg('Bandage posé. Maintenant le garrot (T).',2500)}
function tourniquet(){if(!P.bite)return msg('Rien à soigner.',1500);if(!P.bite.band)return msg('D\'abord le bandage (Y) !',2500);
  const l=P.bite.limb;P.bite=null;if(G.gore)amputate(l);else msg('Garrot posé : infection stoppée.',3000)}
function amputate(l){const u=pm.userData,p=u[l],leg=l[0]==='l';p.visible=false;
  const s=new THREE.Group();s.position.copy(p.position);u.g.add(s);
  const r=new THREE.Mesh(gBox,mBl);r.scale.set(.1,.05,.1);r.position.y=-.02;s.add(r);
  if(G.bones){const bn=bone(.14);bn.position.y=-.1;s.add(bn)}
  if(G.org){const o=new THREE.Mesh(gBall,mOr);o.scale.set(.06,.04,.06);o.position.set(.03,-.04,.02);s.add(o)}
  const d=new THREE.Group(),a=new THREE.Mesh(new THREE.CapsuleGeometry(.07,.5,4,8),M(leg?0x333a44:0x2a5a8a));a.rotation.z=PI/2;d.add(a);
  if(G.bones){const e=new THREE.Mesh(gBox,mBn);e.scale.set(.1,.04,.04);e.position.x=.34;d.add(e)}
  d.position.set(P.pos.x+Math.sin(P.face)*.8,.08,P.pos.z+Math.cos(P.face)*.8);d.rotation.y=Math.random()*6;scene.add(d);keep(d);
  blood(P.pos.x,1,P.pos.z,10);if(leg)P.legLost++;if(l==='armR')P.armRLost=1;msg('Membre amputé : '+LN[l]+'.',3500)}

/* ============ COMBAT ============ */
function dmgZ(z,d){const p=z.a.position,dir=new V3(p.x-P.pos.x,0,p.z-P.pos.z).normalize();blood(p.x,1.2,p.z,4,dir);z.hp-=d;
  if(G.gore&&!z.boss&&z.hp>0&&Math.random()<.2+d/300)dismember(z);
  if(!z.crawl&&!z.boss&&z.hp>0&&z.hp<z.max*.35)z.crawl=true}
function killZ(z){gibs(z);const l0=lvl();P.kills++;P.xp+=z.boss?100:10;if(Math.random()<.6){const m=(z.boss?200:10)+(Math.random()*30|0);P.money+=m;P.earned+=m}
  if(lvl()>l0){const ul=SL.filter(n=>WP[n].lvl===lvl());notif('Niveau '+lvl()+(ul.length?' : '+ul.join(', ')+' débloqué':''))}}
function notif(t){P.log.unshift(t);if(P.log.length>20)P.log.pop();if(P.notif)msg(t,3500)}
function firstBlock(o,dir,max){for(let d=.5;d<max;d+=.3){const x=o.x+dir.x*d,y=o.y+dir.y*d,z=o.z+dir.z*d;if(y<0)return{d,hit:1};
  for(const b of B)if(!b.dead&&!b.open&&x>b.c.x1&&x<b.c.x2&&z>b.c.z1&&z<b.c.z2&&y<2.6)return{d,hit:1,b};
  if(y<6)for(const c of walls)if(x>c.x1&&x<c.x2&&z>c.z1&&z<c.z2)return{d,hit:1,wall:1}}return{d:max}}
function shoot(w){const n=w.n;if(P.ammo[n]<=0){P.pcd=.3;msg('Chargeur vide : R pour recharger',1200);return}
  P.ammo[n]--;P.pcd=w.rate;P.nImp=Math.max(P.nImp,w.noise);
  const dir=new V3();cam.getWorldDirection(dir);const o=cam.position.clone();let zh=null,zd=70;
  for(const z of Z){if(z.down>0)continue;const t=new V3(z.a.position.x-o.x,(z.boss?1.4:1)-o.y+.1,z.a.position.z-o.z),d=t.dot(dir);if(d<0||d>zd)continue;if(t.addScaledVector(dir,-d).length()<(z.boss?.8:.4)){zh=z;zd=d}}
  const fb=firstBlock(o,dir,zd);const end=o.clone().addScaledVector(dir,fb.d);
  if(fb.hit){if(fb.b){hitB(fb.b,45);puff(end.x,end.y,end.z,4)}else if(fb.wall)impact(end)}else if(zh)dmgZ(zh,w.dmg);
  tracer(new V3(P.pos.x,P.pos.y+1.3,P.pos.z).addScaledVector(dir,.7),end)}
function attack(){if(P.armRLost&&WP[P.cur].mag)return msg('Bras droit perdu : plus d\'arme à feu.',1500);
  if(P.pcd>0||!playing||dead||P.roll>0||P.rel>0||P.work||paused)return;const w=WP[P.cur];
  if(w.mag){shoot(w);P.punch=.12;return}
  P.pcd=w.rate;P.punch=.3;P.nImp=Math.max(P.nImp,w.noise);const fx=-Math.sin(P.cam),fz=-Math.cos(P.cam);
  for(const z of Z){const dx=z.a.position.x-P.pos.x,dz=z.a.position.z-P.pos.z,d=Math.hypot(dx,dz);
    if(d<w.rng&&(dx*fx+dz*fz)/(d||1)>.3){dmgZ(z,w.dmg);slash(z,w);z.a.position.x+=fx*.7;z.a.position.z+=fz*.7;resolve(z.a.position,.32);if(Math.random()<.15&&!z.boss)z.down=2}}}

/* ============ INTERFACE : BOUTIQUE TV, TÉLÉPHONE, HOTBAR, PARAMÈTRES ============ */
const st=document.createElement('style');st.textContent='.ui{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#05070bcc;z-index:6}.ui.hide{display:none}.ui .panel,#settings .panel{max-height:88vh;overflow:auto;min-width:420px;box-shadow:0 0 40px #c9553d33}.ui button,#settings button{font-size:14px;padding:6px 12px;margin:3px;transition:transform .12s}.ui button:active,#settings button:active{transform:scale(.95)}.row{display:flex;justify-content:space-between;align-items:center;gap:20px;border-bottom:1px solid #2a2f3a;padding:6px 0}#wbar{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:6px}.slot{width:84px;padding:4px;background:#0009;border:1px solid #fff3;text-align:center;font-size:11px}.slot.on{border-color:#d8c9a8}.g{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.cd{background:#161b26;border:1px solid #3a2a24;padding:10px;text-align:center}.cd b{color:#d8c9a8;display:block}.cd.lk{filter:brightness(.45)}.cd small{margin:2px 0 6px}select{font:inherit;background:#161b26;color:#e8e4da;border:1px solid #3a2a24;padding:4px}';document.head.append(st);
['shop','phone'].forEach(id=>{const d=document.createElement('div');d.id=id;d.className='ui hide';d.innerHTML='<div class="panel"></div>';document.body.append(d)});
const wb=document.createElement('div');wb.id='wbar';$('hud').append(wb);$('prompt').style.bottom='110px';
let wbC='';function wbarUpd(){let h='';SL.forEach((n,i)=>{const w=WP[n],ok=n==='Marteau'||P.own[n];h+='<div class="slot'+(P.cur===n?' on':'')+'">'+(ok?'<b>'+(i+1)+' '+n+'</b><br>'+(w.mag?P.ammo[n]+' / '+P.res[n]:'—'):'<span style="font-size:20px">?</span><br>niv. '+w.lvl)+'</div>'});if(h!==wbC){wbC=h;wb.innerHTML=h}}
function hintText(dg,dt){if(dt<2.8)return'E : boutique TV';if(dg<2.8)return'E : parler à Mamie';const b=nearB();if(!b)return'';return(b.kind==='door'?'E ouvrir/fermer · L verrouiller · ':'')+'H barricader ('+P.planks+' planche) · J réparer'}
function openUI(id){uiOpen=id;$(id).classList.remove('hide');document.exitPointerLock();id==='shop'?renderShop():renderPhone()}
function closeUI(){if(uiOpen)$(uiOpen).classList.add('hide');uiOpen=false;canvas.requestPointerLock()}
function renderShop(){const p=$('shop').firstChild;let h='<h2>Boutique TV</h2><p class="sub">Cagnotte : '+P.money+' $ · niveau '+lvl()+' · planches : '+P.planks+' · bandages : '+P.bandages+'</p><div class="g"><div class="cd"><b>Planche</b><small>Barricade</small><button data-k="plank">50 $</button></div><div class="cd"><b>Repas ('+P.meals+')</b><small>+40 faim</small><button data-k="meal">30 $</button></div><div class="cd"><b>Eau ('+P.drinks+')</b><small>+40 soif</small><button data-k="drink">20 $</button></div><div class="cd"><b>Bandage</b><small>Morsure : à poser avant le garrot</small><button data-k="band">60 $</button></div>';
  SL.slice(1).forEach(n=>{const w=WP[n],lk=!P.own[n]&&lvl()<w.lvl;h+='<div class="cd'+(lk?' lk':'')+'"><b>'+(lk?'? ':'')+n+'</b><small>'+(w.mag?'Chargeur '+w.mag+' · dégâts '+w.dmg:'Mêlée · dégâts '+w.dmg)+'</small>'+(P.own[n]?(w.mag?'<button data-k="mag:'+n+'">+ chargeur 100 $</button>':'<b>Possédé</b>'):lk?'<b>niveau '+w.lvl+'</b>':'<button data-k="buy:'+n+'">'+w.price+' $</button>')+'</div>'});
  p.innerHTML=h+'</div><button data-k="close">Fermer</button><p class="sub">'+shopMsg+'</p>'}
$('shop').onclick=e=>{const b=e.target.closest('button');if(!b)return;const[k,n]=b.dataset.k.split(':');
  const pay=c=>{if(P.money<c){shopMsg='Pas assez d\'argent.';return false}P.money-=c;P.spent+=c;return true};
  if(k==='close')return closeUI();
  if(k==='meal'){if(pay(30)){P.meals++;shopMsg='Repas acheté.'}}else if(k==='drink'){if(pay(20)){P.drinks++;shopMsg='Eau achetée.'}}else if(k==='band'){if(pay(60)){P.bandages++;shopMsg='Bandage acheté.'}}
  else if(k==='plank'){if(pay(50)){P.planks++;shopMsg='Planche achetée.'}}
  else if(k==='buy'){const w=WP[n];if(lvl()>=w.lvl&&!P.own[n]&&pay(w.price)){P.own[n]=1;if(w.mag){P.ammo[n]=w.mag;P.res[n]=0}shopMsg=n+' acheté.'}}
  else if(k==='mag'){if((P.res[n]||0)>=10)shopMsg='Maximum de chargeurs.';else if(pay(100)){P.res[n]++;shopMsg='Chargeur acheté.'}}
  renderShop()};
const BLN=['Désactivé','Faible','Moyen','Élevé'];
function renderPhone(){const p=$('phone').firstChild,r=(a,b)=>'<div class="row"><span>'+a+'</span><b>'+b+'</b></div>';
  let h='<h2>Téléphone</h2><div>'+[['stats','Statistiques'],['msgs','Messages'],['set','Paramètres'],['act','Partie']].map(([k,n])=>'<button data-t="'+k+'">'+n+'</button>').join('')+'</div><br>';
  if(tab==='stats')h+=r('Zombies éliminés (vous)',P.kills)+r('Nuits survécues',P.nights)+r('Temps de survie',Math.floor(P.time/60)+' min '+Math.floor(P.time%60)+' s')+r('Niveau / expérience',lvl()+' · '+P.xp%100+'/100')+r('Argent gagné',P.earned+' $')+r('Argent dépensé',P.spent+' $')+r('Dégâts reçus',Math.round(P.dmgTaken))+r('Équipe',P.kills+' éliminés (solo)');
  else if(tab==='msgs')h+=P.log.length?P.log.map(t=>'<div class="row">'+t+'</div>').join(''):'<p class="sub">Aucune notification.</p>';
  else if(tab==='set')h+='<div class="row"><label><input type="checkbox" id="nt" '+(P.notif?'checked':'')+'> Notifications</label></div><div class="row"><span>Sensibilité souris</span><input type="range" id="sens" min=".3" max="2.5" step=".1" value="'+P.sens+'"></div><div class="row"><span>Champ de vision</span><input type="range" id="fov" min="55" max="100" value="'+cam.fov+'"></div><div class="row"><span>Intensité du sang</span><select id="blP">'+BLN.map((n,i)=>'<option value="'+i+'"'+(G.blood===i?' selected':'')+'>'+n+'</option>').join('')+'</select></div><p class="sub">Le gore, les os et les organes se règlent dans le menu principal (Paramètres).</p>';
  else h+='<div class="row"><span>Lancer la nuit (hôte)</span><button data-a="night">Lancer</button></div><div class="row"><span>Sauvegarde manuelle</span><button data-a="save">Sauvegarder</button></div><p class="sub">'+lastSave+'</p>';
  p.innerHTML=h+'<br><button data-a="close">Fermer (P)</button>'}
$('phone').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.t){tab=b.dataset.t;renderPhone()}else if(b.dataset.a==='close')closeUI();else if(b.dataset.a==='night'){closeUI();startNight()}else if(b.dataset.a==='save'){save();renderPhone()}};
$('phone').oninput=e=>{if(e.target.id==='sens')P.sens=+e.target.value;else if(e.target.id==='fov'){cam.fov=+e.target.value;cam.updateProjectionMatrix()}else if(e.target.id==='nt')P.notif=e.target.checked;else if(e.target.id==='blP'){G.blood=+e.target.value;saveG()}};
// Paramètres sang / gore (double confirmation pour le gore)
function askConfirm(t,p){return new Promise(r=>{$('confT').textContent=t;$('confP').textContent=p;$('conf').classList.remove('hide');const f=v=>{$('conf').classList.add('hide');r(v)};$('confYes').onclick=()=>f(1);$('confNo').onclick=()=>f(0)})}
// CORRECTIF : le panneau est trouvé par sa classe (firstChild était un noeud texte)
const setPanel=()=>$('settings').querySelector('.panel');
function renderSet(){const ck=(id,v,l,dis)=>'<div class="row"><label><input type="checkbox" id="'+id+'"'+(v?' checked':'')+(dis?' disabled':'')+'> '+l+'</label></div>';
  setPanel().innerHTML='<h2>Paramètres</h2><div class="row"><span>Intensité du sang</span><select id="blSel">'+BLN.map((n,i)=>'<option value="'+i+'"'+(G.blood===i?' selected':'')+'>'+n+'</option>').join('')+'</select></div>'+'<div class="row"><span>Volume général</span><input type="range" id="volR" min="0" max="1" step=".05" value="'+(G.vol??1)+'"></div>'+ck('goreCk',G.gore,'Gore (amputation, sang abondant, plaies, hématomes)')+ck('boneCk',G.bones,'Os visibles',!G.gore)+ck('orgCk',G.org,'Organes et cerveau visibles',!G.gore)+'<p class="sub">Le gore est réservé aux adultes (double confirmation).</p><button id="setClose">Retour</button><button id="setReset" style="background:#3a3f4a">Réinitialiser</button>'}
$('setBtn').onclick=()=>{renderSet();$('settings').classList.remove('hide')};
$('settings').onclick=e=>{if(e.target.id==='setClose')$('settings').classList.add('hide');else if(e.target.id==='setReset'){Object.assign(G,{blood:1,gore:false,bones:false,org:false});saveG();renderSet()}};
$('settings').onchange=async e=>{const id=e.target.id,c=e.target.checked;
  if(id==='volR')G.vol=+e.target.value;else if(id==='blSel')G.blood=+e.target.value;
  else if(id==='goreCk'){if(!c){G.gore=G.bones=G.org=false}else{e.target.checked=false;if(await askConfirm('Êtes-vous sûr ?','Le gore est violent et réservé aux adultes.')&&await askConfirm('Vraiment sûr ?','Dernière confirmation.'))G.gore=true}}
  else if(id==='boneCk')G.bones=c;else if(id==='orgCk')G.org=c;
  saveG();renderSet()};
// Sauvegarde (navigateur ; Firebase au groupe 3)
function save(quiet){try{localStorage.setItem('pg_save',JSON.stringify({m:P.money,e:P.earned,s:P.spent,own:P.own,ammo:P.ammo,res:P.res,pl:P.planks,bd:P.bandages,xp:P.xp,k:P.kills,n:P.nights,t:P.time,dmg:P.dmgTaken,w:W.n,b:B.map(b=>({p:b.planks,h:b.hp,d:b.dead,o:b.open,l:b.locked}))}));lastSave='Sauvegarde réussie.';if(!quiet)msg(lastSave,2500);return true}catch(e){lastSave='ÉCHEC de la sauvegarde : '+e.message;if(!quiet)msg(lastSave,4000);return false}}
function loadSave(){try{const d=JSON.parse(localStorage.getItem('pg_save'));if(!d)return;
  Object.assign(P,{money:d.m,earned:d.e,spent:d.s,own:d.own,ammo:d.ammo,res:d.res,planks:d.pl,bandages:d.bd??1,xp:d.xp,kills:d.k,nights:d.n,time:d.t,dmgTaken:d.dmg});W.n=d.w;
  d.b.forEach((q,i)=>{const b=B[i];if(!b)return;for(let k=0;k<q.p;k++)addPlank(b);b.hp=q.h;b.locked=q.l;if(q.d)destroyB(b);else if(q.o)setOpen(b,true);if(b.cr)b.cr.visible=!b.dead&&b.hp<base(b)*.6});
  msg('Partie chargée : '+W.n+' nuit(s) terminée(s).',4000)}catch(e){msg('Chargement impossible : '+e.message)}}

/* ============ JOUEUR ============ */
function updPlayer(dt){bitesUpd(dt);if(P.mouse&&WP[P.cur].auto)attack();if(P.rel>0){P.rel-=dt;if(P.rel<=0){const w=WP[P.relW];P.ammo[w.n]=w.mag;P.res[w.n]--}}if(P.work){P.work.t-=dt;P.work.d-=dt;if(P.work.d<=0){P.work.d=.22;P.nImp=Math.max(P.nImp,12);puff(P.work.b.cx,1.1,P.work.b.z+.4,2)}if(P.work.t<=0)workDone()}
  const f=(keys[K.fwd]?1:0)-(keys[K.back]?1:0),s=(keys[K.right]?1:0)-(keys[K.left]?1:0),sy=Math.sin(P.cam),cy=Math.cos(P.cam);
  let dx=-sy*f+cy*s,dz=-cy*f-sy*s;const l=Math.hypot(dx,dz);if(l>0){dx/=l;dz/=l}
  P.moving=l>0;if(P.moving){P.dx=dx;P.dz=dz}
  let sp=0,noise=0;P.sprint=false;
  if(P.roll>0){sp=6;dx=P.rdir[0];dz=P.rdir[1];noise=8;P.roll-=dt;P.inv=.1}
  else if(P.slide>0){sp=6.5;dx=P.sdir[0];dz=P.sdir[1];noise=10;P.slide-=dt}
  else if(P.prone){sp=P.moving?.9:0;noise=P.moving?1:0}
  else if(P.crouch){sp=P.moving?1.6:0;noise=P.moving?2:0}
  else if(P.moving){
    if(keys[K.sprint]&&P.st>5){sp=7;noise=22;P.sprint=true;P.st-=22*dt}
    else if(keys[K.run]){sp=4.6;noise=12}else{sp=2.6;noise=6}}
  if(!P.sprint)P.st=Math.min(100,P.st+10*dt);
  if(P.legLost)sp*=.55;
  P.spd=sp;P.pos.x+=dx*sp*dt;P.pos.z+=dz*sp*dt;resolve(P.pos,.35);
  P.vy-=15*dt;P.pos.y+=P.vy*dt;if(P.pos.y<=0){P.pos.y=0;P.vy=0}
  P.nImp=Math.max(0,P.nImp-25*dt);P.n=Math.max(noise,P.nImp);if(P.pcd>0)P.pcd-=dt;if(P.inv>0)P.inv-=dt;
  if(!night)P.hp=Math.min(100,P.hp+1.5*dt);
  const u=pm.userData;pm.position.copy(P.pos);
  const tgt=P.punch>0||fp||P.aim?P.cam+PI:(sp>0?Math.atan2(dx,dz):P.face);P.face+=wrap(tgt-P.face)*Math.min(1,dt*12);pm.rotation.y=P.face;
  u.g.scale.y=P.crouch&&!P.prone?.72:1;u.p.rotation.x=0;u.p.position.y=.8;
  if(P.roll>0){u.p.rotation.x=(1-P.roll/.55)*2*PI;u.p.position.y=.6}
  else if(P.prone){u.p.rotation.x=PI/2;u.p.position.y=.22}
  else if(P.slide>0){u.p.rotation.x=-.9;u.p.position.y=.55}
  if(P.pos.y<.01)walkAnim(u,sp,tm);else{u.legL.rotation.x=-.6;u.legR.rotation.x=.4}
  if(P.punch>0){P.punch-=dt;u.armR.rotation.x=-1.8*Math.sin((1-P.punch/.3)*PI)}
  const w0=WP[P.cur];P.aim=!!w0.mag&&!P.work;
  if(P.aim){u.armR.rotation.x=-1.45;u.elbR.rotation.x=0;u.armL.rotation.x=-1.2;u.elbL.rotation.x=-.5}
  if(P.work){u.armR.rotation.x=-1.1+Math.sin(tm*20)*.5;u.elbR.rotation.x=-.9;u.armL.rotation.x=-1.2;u.elbL.rotation.x=-.6}
  const show=P.work?'Marteau':P.cur;for(const k in WM)WM[k].visible=k===show;plk.visible=!!P.work;
  curl(u.handR,P.aim?.6:P.punch>0?1.6:.25);curl(u.handL,.25);pm.visible=!fp;
  const head=new V3(P.pos.x,P.pos.y+(P.prone?.4:P.crouch?1.2:1.65),P.pos.z);
  if(fp){cam.position.copy(head);cam.rotation.set(-P.pit,P.cam,0,'YXZ')}
  else{const rx=Math.cos(P.cam)*.6,rz=-Math.sin(P.cam)*.6,cp=Math.cos(P.pit),D=3.4,
    tgtv=new V3(head.x+rx,head.y,head.z+rz),want=new V3(head.x+rx+Math.sin(P.cam)*cp*D,head.y+Math.sin(P.pit)*D,head.z+rz+Math.cos(P.cam)*cp*D),
    dir=want.clone().sub(head),len=dir.length();dir.normalize();
    const rc=new THREE.Raycaster(head,dir,0,len),hit=rc.intersectObjects(occ,false)[0];
    if(hit)want.copy(head).addScaledVector(dir,Math.max(.4,hit.distance-.25));
    if(want.y<.3)want.y=.3;cam.position.copy(want);cam.lookAt(tgtv)}
  torch.position.set(P.pos.x,P.pos.y+2.2,P.pos.z);
}
function hurt(d,bite){if(P.inv>0||dead)return;P.hp-=d;P.dmgTaken+=d;blood(P.pos.x,1.2,P.pos.z,2);
  if(bite&&!P.bite&&Math.random()<.35){const l=Object.keys(LN)[Math.random()*4|0];P.bite={limb:l,t:40,band:false};msg('Morsure : '+LN[l]+' ! Bandage (Y) puis garrot (T) en moins de 40 s.',5000)}
  $('flash').style.opacity=.8;say(['Fais attention !','Oh mon dieu...','Ça va ?'][Math.random()*3|0]);if(P.hp<=0)die()}
function interact(){const dg=Math.hypot(P.pos.x+4,P.pos.z+3),dt=Math.hypot(P.pos.x+4,P.pos.z-5.5);
  if(dt<2.8){TUT.shop=1;openUI('shop');return}
  if(dg<2.8){TUT.talk=1;msg('Mamie : « Ne t\'inquiète pas pour moi, mon petit. Protège la maison. »');return}
  const b=nearB();if(!b)return;
  if(b.kind!=='door')msg('Fenêtre : H pour la barricader.',1800);
  else if(b.planks)msg('Porte barricadée : impossible de l\'ouvrir.',1800);
  else if(b.locked)msg('Porte verrouillée (L pour déverrouiller).',1800);
  else{setOpen(b,!b.open);P.nImp=Math.max(P.nImp,8)}}

/* ============ ZOMBIES ============ */
const ZT={n:{hp:60,sp:1.7,dmg:8,s:1},f:{hp:40,sp:3.6,dmg:6,s:.95},b:{hp:500,sp:2.1,dmg:20,s:1.45}};
const rc3=['#4a5a44','#5a4a3a','#3a3f4a','#4a3a3a'];
function spawnZ(type){
  const t=ZT[type],col=new THREE.Color(rc3[Math.random()*4|0]),a=actor(human(col.getHex(),0x2a2a30,0x7d8c72,0x1a1a1a,{mouth:0x401a1a,eye:0x9a9a60,long:1,shoe:0x2a2a2a}),false);
  let x,z;do{x=P.pos.x+(Math.random()-.5)*70;z=11+Math.random()*6}while(Math.hypot(x-P.pos.x,z-P.pos.z)<22);
  a.position.set(Math.max(-45,Math.min(45,x)),0,z);a.scale.setScalar(t.s);
  Z.push({a,hp:t.hp,max:t.hp,sp:t.sp*(.9+Math.random()*.2),dmg:t.dmg,boss:type==='b',h:Math.random()*6,state:'idle',tx:x,tz:z,path:[],think:Math.random()*.3,pt:0,atk:1,down:0,crawl:false,ph:Math.random()*6});
}
function updZ(z,dt){
  const a=z.a,p=a.position,u=a.userData,dxp=P.pos.x-p.x,dzp=P.pos.z-p.z,dp=Math.hypot(dxp,dzp);
  if(z.down>0){z.down-=dt;u.p.rotation.x=-PI/2;u.p.position.y=.22;if(z.down<=0){u.p.rotation.x=z.crawl?PI/2:0;u.p.position.y=z.crawl?.22:.8}return}
  z.think-=dt;
  if(z.think<=0){z.think=.3+Math.random()*.2;
    const clear=!blocked(p,P.pos,.05,walls),da=Math.abs(wrap(Math.atan2(dxp,dzp)-z.h)),
      vis=clear&&dp<(night?15:25)&&da<1.2,hear=P.n*(clear?1:.5)>dp;
    if(P.hp>0&&(vis||hear)){z.tx=P.pos.x;z.tz=P.pos.z;z.state=vis?'chase':'invest'}
    else if(z.state!=='idle'&&Math.hypot(z.tx-p.x,z.tz-p.z)<1.2)z.state='idle';
    if(z.state==='idle'&&p.z>9.5&&Math.random()<.3){z.tx=p.x+(Math.random()-.5)*10;z.tz=10+Math.random()*8}
  }
  z.pt-=dt;if(z.pt<=0){z.pt=.7+Math.random()*.3;z.path=findPath(p,{x:z.tx,z:z.tz})}
  let sp=(z.state==='chase'?z.sp:z.state==='invest'?z.sp*.8:z.sp*.3)*(z.crawl?.4:1)*(night?1.1:1);
  const tg=z.path[0]||{x:z.tx,z:z.tz},mx=tg.x-p.x,mz=tg.z-p.z,md=Math.hypot(mx,mz);
  if(md<.5&&z.path.length)z.path.shift();
  if(dp<1.15&&z.state==='chase')sp=0;
  if(md>.1&&sp>0){p.x+=mx/md*sp*dt;p.z+=mz/md*sp*dt;z.h+=wrap(Math.atan2(mx,mz)-z.h)*Math.min(1,dt*6)}
  else if(dp<1.5)z.h+=wrap(Math.atan2(dxp,dzp)-z.h)*Math.min(1,dt*8);
  for(const o of Z)if(o!==z){const ox=p.x-o.a.position.x,oz=p.z-o.a.position.z,d=Math.hypot(ox,oz);if(d<.6&&d>.001){p.x+=ox/d*.6*dt*3;p.z+=oz/d*.6*dt*3}}
  resolve(p,.32);a.rotation.y=z.h;
  if(dp<1.35&&z.state==='chase'&&P.hp>0){z.atk-=dt;if(z.atk<=0){z.atk=1.1;hurt(z.dmg,1)}}else z.atk=Math.min(1,z.atk+dt);
  u.p.rotation.x=z.crawl?PI/2:0;u.p.position.y=z.crawl?.22:.8;
  if(z.state!=='idle')for(const b of B){if(b.dead||b.open||p.z<b.z||Math.abs(p.x-b.cx)>b.w/2+.5||p.z-b.z>1.4)continue;
    if(b.kind==='door'&&!b.locked&&!b.planks){z.od=(z.od||0)+dt;if(z.od>.9){z.od=0;setOpen(b,true)}}else hitB(b,(z.crawl?6:12)*(z.boss?3:1)*dt);break}
  walkAnim(u,sp*.9,tm+z.ph);u.armL.rotation.x=u.armR.rotation.x=-1.4+Math.sin(tm*3+z.ph)*.12;
}
function startNight(){if(W.active||!playing||dead)return;W.n++;W.active=true;W.queue=Math.min(6+W.n*4,40)+(W.n%5===0?1:0);W.bossLeft=W.n%5===0;setNight(true);msg('Nuit '+W.n+' : les zombies arrivent dans la rue !',4500)}
function updWave(dt){
  if(!W.active)return;
  W.spawnT-=dt;if(W.queue>0&&Z.length<22&&W.spawnT<=0){W.spawnT=1;W.queue--;spawnZ(W.bossLeft&&W.queue===0?(W.bossLeft=false,'b'):Math.random()<.2+W.n*.03?'f':'n')}
  if(W.queue<=0&&Z.length===0){W.active=false;P.nights++;setNight(false);P.hp=Math.min(100,P.hp+30);msg('L\'aube se lève. Nuit '+W.n+' survécue'+(save(true)?' · sauvegarde auto OK':' · SAUVEGARDE ÉCHOUÉE')+'. N pour la suivante.',5500)}
}
function die(){dead=true;document.exitPointerLock();$('ovStats').innerHTML='Zombies éliminés : '+P.kills+'<br>Nuits survécues : '+P.nights+'<br>Temps de survie : '+Math.floor(P.time/60)+' min '+Math.floor(P.time%60)+' s';$('over').classList.remove('hide');$('hud').classList.add('hide')}

/* ============ BOUCLE ET ENTRÉES ============ */
function hud(dt){
  $('hpBar').firstChild.style.width=Math.max(0,P.hp)+'%';$('stBar').firstChild.style.width=P.st+'%';$('nsBar').firstChild.style.width=Math.min(100,P.n/22*100)+'%';
  $('info').innerHTML=(night?'Nuit '+W.n+' · '+(Z.length+W.queue)+' zombies restants':'Jour '+(W.n+1)+' · N pour lancer la nuit')+'<br>Niveau '+lvl()+' ('+P.xp%100+'/100 XP) · Éliminés : '+P.kills+'<br>Cagnotte : '+P.money+' $ · Planches : '+P.planks+(P.rel>0?'<br>Rechargement...':'')+(P.bite?'<br>INFECTÉ ('+(P.bite.band?'bandé : T garrot':'Y bandage')+') '+Math.ceil(P.bite.t)+' s':'')+'<br>Faim '+Math.round(P.food)+' · Soif '+Math.round(P.water)+' (G repas '+P.meals+' · K eau '+P.drinks+')<br>Bandages : '+P.bandages+'<br>P : téléphone';
  const dg=Math.hypot(P.pos.x+4,P.pos.z+3),dt2=Math.hypot(P.pos.x+4,P.pos.z-5.5);
  $('prompt').textContent=hintText(dg,dt2);wbarUpd();
  msgT-=dt;if(msgT<=0)$('msg').textContent='';bubT-=dt;if(bubT<=0)$('bubble').textContent='';
  $('flash').style.opacity=Math.max(0,parseFloat($('flash').style.opacity||0)-dt*2);$('cross').classList.toggle('hide',!(fp||P.aim));
}
let last=performance.now();
function loop(t){requestAnimationFrame(loop);const dt=Math.min((t-last)/1000,.05);last=t;tm+=dt;
  if(playing&&!paused&&!dead){
    P.time+=dt;updPlayer(dt);mpTick(dt);tutTick();updWave(dt);
    updFx(dt);for(let i=Z.length-1;i>=0;i--){const z=Z[i];updZ(z,dt);if(z.fount>0){z.fount-=dt;const w=new V3();z.a.userData[z.fl].getWorldPosition(w);blood(w.x,w.y,w.z,2,new V3(0,.8,0))}
      if(z.hp<=0){killZ(z);if(G.gore&&GM())corpse(z);else scene.remove(z.a);Z.splice(i,1)}}
    let near=null,nd=18;for(const z of Z){const d=Math.hypot(z.a.position.x+4,z.a.position.z+3);if(d<nd){nd=d;near=z}}
    if(near){grandma.rotation.y+=wrap(Math.atan2(near.a.position.x+4,near.a.position.z+3)-grandma.rotation.y)*dt*2;grandma.rotation.y=Math.max(-.8,Math.min(.8,grandma.rotation.y));if(nd<12)say('J\'entends du bruit dehors...')}
    grandma.userData.p.rotation.x=Math.sin(tm*1.2)*.02;hud(dt);
  }else if(cine){cineTick(dt)}else if(!playing){cam.position.set(Math.sin(tm*.1)*30,10,25+Math.cos(tm*.1)*5);cam.lookAt(0,2,0)}
  R.render(scene,cam);
}
requestAnimationFrame(loop);
const lock=()=>canvas.requestPointerLock();
$('playBtn').onclick=()=>{playing=true;$('menu').classList.add('hide');$('hud').classList.remove('hide');lock();msg('Jour 1 : explorez la maison. Appuyez sur N quand vous êtes prêt.',6000)};
$('resumeBtn').onclick=()=>{lock()};$('menuBtn').onclick=()=>location.reload();
document.addEventListener('pointerlockchange',()=>{const l=document.pointerLockElement===canvas;if(playing&&!dead){paused=!l;$('pause').classList.toggle('hide',l||!!uiOpen)}});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas)return;P.cam-=e.movementX*.0022*P.sens;P.pit=Math.max(-.9,Math.min(1.1,P.pit+e.movementY*.002*P.sens))});
document.addEventListener('mouseup',()=>{P.mouse=false});
document.addEventListener('mousedown',e=>{if(document.pointerLockElement===canvas&&e.button===0){P.mouse=true;attack()}});
addEventListener('keyup',e=>{keys[e.code]=0});
addEventListener('keydown',e=>{
  if(uiOpen&&(e.code==='Escape'||e.code===K.phone)){closeUI();return}if(!playing||dead||paused)return;keys[e.code]=1;if(e.code==='Space')e.preventDefault();if(e.repeat)return;
  if(e.code===K.crouch){if(P.spd>4.4&&P.pos.y<.01&&!P.crouch&&!P.prone){P.slide=.7;P.sdir=[P.dx,P.dz]}else{P.crouch=!P.crouch;P.prone=false}}
  else if(e.code===K.prone){P.prone=!P.prone;P.crouch=false}
  else if(e.code===K.jump&&P.pos.y<.01&&!P.prone){P.vy=5.2;P.crouch=false;P.nImp=Math.max(P.nImp,10)}
  else if(e.code===K.roll&&P.roll<=0){P.roll=.55;P.rdir=P.moving?[P.dx,P.dz]:[Math.sin(P.face),Math.cos(P.face)];P.prone=P.crouch=false}
  else if(e.code==='KeyL'){const b=nearB();if(b&&b.kind==='door'&&!b.open){b.locked=!b.locked;msg(b.locked?'Porte verrouillée.':'Porte déverrouillée.',1500)}}
  else if(e.code==='KeyH')startWork('plank');else if(e.code==='KeyJ')startWork('rep');
  else if(e.code==='KeyR'){const w=WP[P.cur];if(w.mag&&P.rel<=0&&P.ammo[w.n]<w.mag&&P.res[w.n]>0){P.rel=1.6;P.relW=w.n;msg('Rechargement...',1200)}}
  else if(e.code===K.phone)openUI('phone');
  else if(/^Digit[0-7]$/.test(e.code)){const i=+e.code[5],n=i===0?'Poings':SL[i-1];if(n==='Poings'||n==='Marteau'||P.own[n]){P.cur=n;P.rel=0}else msg('Arme verrouillée : achetez-la à la télévision (niveau '+WP[n].lvl+').',2500)}
  else if(e.code==='KeyG')eat('meals','food');else if(e.code==='KeyK')eat('drinks','water');else if(e.code==='KeyY')bandage();else if(e.code==='KeyT')tourniquet();
  else if(e.code===K.use)interact();else if(e.code===K.night)startNight();else if(e.code===K.view)fp=!fp;
});
try{$('menu').querySelector('small').insertAdjacentHTML('beforebegin','<p class="sub">1-7 armes · 0 poings · R recharger · H barricader · J réparer · L verrouiller · P téléphone · E boutique TV · Y bandage · T garrot</p>');
  if(localStorage.getItem('pg_save')){const b=document.createElement('button');b.textContent='Continuer';b.style.marginLeft='10px';b.onclick=()=>{$('playBtn').onclick();loadSave()};$('playBtn').after(b)}}catch(e){}

/* ============ SURVIE, COUPS DE COUTEAU, AMPUTATION AU CLIC ============ */
Object.assign(P,{food:100,water:100,meals:1,drinks:1});
function eat(k,v){if(P[k]<1)return msg('Aucun : achetez-en à la télévision.',2000);P[k]--;P[v]=Math.min(100,P[v]+40);msg(v==='food'?'Vous mangez.':'Vous buvez.',1500)}
function slash(z,w){if(!G.gore)return;z.cuts=(z.cuts||0)+(w.n==='Couteau'?1.5:w.n==='Marteau'?1:.7);
  const g=z.a.userData.g;if((z.marks=(z.marks||0)+1)<=10){const m=new THREE.Mesh(gBox,mBl);m.scale.set(.22,.014,.014);m.position.set((Math.random()-.5)*.3,.8+Math.random()*.8,.16);m.rotation.z=(Math.random()-.5)*1.6;g.add(m);
    const o=new THREE.Mesh(gBox,mOr);o.scale.set(.18,.006,.006);o.position.copy(m.position);o.position.z+=.002;o.rotation.z=m.rotation.z;g.add(o)}
  blood(z.a.position.x,1.2,z.a.position.z,6,new V3(Math.random()-.5,.3,Math.random()-.5));
  if(z.cuts>=3&&!z.boss){dismember(z);z.cuts=0}}

/* ============ MULTIJOUEUR FIREBASE (max 4) ============ */
const FBC={apiKey:"AIzaSyALCnNdE1VAkKTXtORkxx89tfloFpK5QLg",authDomain:"protect-grandma.firebaseapp.com",databaseURL:"https://protect-grandma-default-rtdb.europe-west1.firebasedatabase.app",projectId:"protect-grandma",storageBucket:"protect-grandma.firebasestorage.app",messagingSenderId:"542598701179",appId:"1:542598701179:web:9c6a3484428214f7e802de"};
const MP={db:null,uid:null,code:null,host:false,max:4,pl:{},rem:new Map(),t:0,F:null,name:'Survivant'+(10+Math.random()*90|0)};
const esc=x=>String(x).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
let mpm='';const mpMsg=t=>{mpm=t;const e=$('mpm');if(e)e.textContent=t};
const mpd=document.createElement('div');mpd.id='mp';mpd.className='ov hide';mpd.innerHTML='<div class="panel" style="min-width:440px"></div>';document.body.append(mpd);
async function mpInit(){if(MP.db)return true;try{const B='https://www.gstatic.com/firebasejs/10.12.2/',[a,au,d]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-database.js')]);
  const app=a.initializeApp(FBC),cr=await au.signInAnonymously(au.getAuth(app));MP.uid=cr.user.uid;MP.db=d.getDatabase(app);MP.F=d;return true}catch(e){mpMsg('Firebase indisponible : '+e.message);return false}}
function mpHome(){mpd.firstChild.innerHTML='<h2>Multijoueur (max 4)</h2><div class="row"><span>Pseudo</span><input id="mpn" value="'+esc(MP.name)+'"></div><div class="row"><span>Joueurs max</span><select id="mpx"><option>2</option><option>3</option><option selected>4</option></select></div><div class="row"><label><input type="checkbox" id="mpp"> Salon privé (code)</label></div><button data-m="create">Créer le salon</button><div class="row"><input id="mpc" placeholder="CODE" size="6"><button data-m="join">Rejoindre</button></div><button data-m="list">Salons publics</button><div id="mpl"></div><p class="sub" id="mpm">'+esc(mpm)+'</p><button data-m="close" style="background:#3a3f4a">Retour</button>'}
function mpLobby(){const o=MP.pl||{};mpd.firstChild.innerHTML='<h2>Salon '+MP.code+'</h2><p class="sub">'+Object.keys(o).length+' / '+MP.max+' joueurs</p>'+Object.values(o).map(p=>'<div class="row"><b>'+esc(p.name)+'</b></div>').join('')+(MP.host?'<button data-m="start">Démarrer la partie</button>':'<p class="sub">En attente de l\'hôte...</p>')+'<button data-m="leave" style="background:#3a3f4a">Quitter</button><p class="sub" id="mpm">'+esc(mpm)+'</p>'}
async function mpJoin(code,host){const{ref,get,set,onValue,onDisconnect}=MP.F,rr=await get(ref(MP.db,'rooms/'+code));if(!rr.exists())return mpMsg('Salon introuvable.');
  const r=rr.val(),pl=await get(ref(MP.db,'roomPlayers/'+code)),v=pl.val()||{};
  if(!host&&!v[MP.uid]&&Object.keys(v).length>=r.max)return mpMsg('Salon complet.');if(!host&&r.state==='playing')return mpMsg('Partie déjà lancée.');
  MP.code=code;MP.host=r.host===MP.uid;MP.max=r.max;const me=ref(MP.db,'roomPlayers/'+code+'/'+MP.uid);await set(me,{name:MP.name,x:0,z:7.5,yaw:0});onDisconnect(me).remove();
  onValue(ref(MP.db,'roomPlayers/'+code),s=>mpPlayers(s.val()||{}));onValue(ref(MP.db,'rooms/'+code+'/state'),s=>{if(s.val()==='playing'&&!playing)mpStart()});mpLobby()}
function mpPlayers(o){MP.pl=o;if(!playing)mpLobby();for(const[u,r]of MP.rem)if(!o[u]){scene.remove(r.a);MP.rem.delete(u)}
  for(const u in o){if(u===MP.uid)continue;let r=MP.rem.get(u);if(!r){r={a:actor(human(0x8a3a2a,0x333a44,0xd0a080,0x2a1a10,{shoe:0xf2f2f2}),true),px:o[u].x,pz:o[u].z};MP.rem.set(u,r)}r.tg=o[u]}}
function mpStart(){mpd.classList.add('hide');$('playBtn').onclick()}
function mpTick(dt){if(!MP.code)return;const{ref,update}=MP.F;MP.t+=dt;if(MP.t>.1){MP.t=0;update(ref(MP.db,'roomPlayers/'+MP.code+'/'+MP.uid),{x:P.pos.x,z:P.pos.z,yaw:P.face,name:MP.name}).catch(()=>{})}
  for(const r of MP.rem.values()){if(!r.tg)continue;const k=Math.min(1,dt*10),nx=r.px+(r.tg.x-r.px)*k,nz=r.pz+(r.tg.z-r.pz)*k,sp=Math.hypot(nx-r.px,nz-r.pz)/Math.max(dt,.001);r.px=nx;r.pz=nz;r.a.position.set(nx,0,nz);r.a.rotation.y=r.tg.yaw;walkAnim(r.a.userData,Math.min(sp,7),tm)}}
$('setBtn').insertAdjacentHTML('afterend','<button id="mpBtn" style="margin-left:10px;background:#2a4a6a">Multijoueur</button>');
$('mpBtn').onclick=()=>{mpHome();mpd.classList.remove('hide')};
mpd.onclick=async e=>{const b=e.target.closest('button');if(!b)return;const m=b.dataset.m;
  if(m==='close'){mpd.classList.add('hide');return}
  if(m==='leave'){location.reload();return}
  if(m==='start'){if(MP.host)MP.F.set(MP.F.ref(MP.db,'rooms/'+MP.code+'/state'),'playing').catch(x=>mpMsg('Erreur : '+x.message));return}
  MP.name=($('mpn')&&$('mpn').value.trim().slice(0,16))||MP.name;mpMsg('Connexion...');if(!await mpInit())return;const{ref,get,set}=MP.F;mpMsg('');
  if(m==='create'){const code=Math.random().toString(36).slice(2,7).toUpperCase();try{await set(ref(MP.db,'rooms/'+code),{host:MP.uid,max:+$('mpx').value,priv:$('mpp').checked,state:'lobby',name:MP.name});await mpJoin(code,true)}catch(x){mpMsg('Erreur : '+x.message)}}
  else if(m==='join'){const c=$('mpc').value.trim().toUpperCase();if(c)try{await mpJoin(c,false)}catch(x){mpMsg('Erreur : '+x.message)}}
  else if(m==='list'){try{const s=await get(ref(MP.db,'rooms')),v=s.val()||{},l=Object.entries(v).filter(([c,r])=>!r.priv&&r.state==='lobby');$('mpl').innerHTML=l.length?l.map(([c,r])=>'<div class="row"><span>'+esc(r.name)+' ('+r.max+' max)</span><button data-m="jc" data-c="'+c+'">Rejoindre</button></div>').join(''):'<p class="sub">Aucun salon public.</p>'}catch(x){mpMsg('Erreur : '+x.message)}}
  else if(m==='jc')try{await mpJoin(b.dataset.c,false)}catch(x){mpMsg('Erreur : '+x.message)}};

/* ============ MENU STYLÉ ============ */
const ms=document.createElement('style');ms.textContent='#menu{background:radial-gradient(circle at 50% 40%,#2a0d0acc,#05070bf2)}#menu .panel{box-shadow:0 0 60px #c9553d44;border-color:#c9553d66;min-width:430px}#menu h1{animation:fl 4s infinite;text-shadow:0 0 18px #c9553d}@keyframes fl{0%,92%,100%{opacity:1}94%{opacity:.4}96%{opacity:.9}98%{opacity:.5}}#menu button{display:block;width:100%;margin:8px 0!important;letter-spacing:3px;text-transform:uppercase;font-size:15px;background:linear-gradient(#a8402c,#5e1a10);border:1px solid #e0654a88;box-shadow:0 0 14px #c9553d44;transition:transform .15s,box-shadow .15s}#menu button:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 0 26px #e0654acc}#menu button:active{transform:scale(.97)}@keyframes vib{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px) rotate(-2deg)}40%{transform:translateX(8px) rotate(2deg)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}';document.head.append(ms);
$('playBtn').textContent='▶ Commencer';$('setBtn').textContent='⚙ Paramètres';$('mpBtn').textContent='👥 Multijoueur';

/* ============ CINÉMATIQUE D'INTRO ============ */
R.localClippingEnabled=true;
let cine=null,AC,WG;
const mkEl=(css,cls)=>{const d=document.createElement('div');d.style.cssText=css;if(cls)d.className=cls;document.body.append(d);return d};
const cv=mkEl('position:fixed;inset:0;background:#000;opacity:0;z-index:7;pointer-events:none;transition:opacity .8s'),
  cap=mkEl('position:fixed;bottom:70px;width:100%;text-align:center;z-index:8;font-size:22px;text-shadow:0 2px 6px #000;color:#e8e4da;pointer-events:none'),
  phn=mkEl('position:fixed;left:50%;top:30%;transform:translateX(-50%);z-index:8;background:#10141cf0;border:1px solid #fff4;border-radius:16px;padding:16px 22px;font-size:18px','hide'),
  tutE=mkEl('position:fixed;left:20px;top:100px;max-width:330px;padding:12px 16px;background:#10141cdd;border-left:3px solid #c9553d;z-index:4;font-size:15px','hide'),
  skb=document.createElement('button');
skb.textContent='Passer l\'intro';skb.style.cssText='position:fixed;right:20px;bottom:20px;z-index:9;font-size:13px;padding:6px 14px;background:#222a';skb.className='hide';document.body.append(skb);
const au=()=>AC=AC||new(window.AudioContext||window.webkitAudioContext)();
function wind(v){try{au();if(!WG){const b=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const n=AC.createBufferSource();n.buffer=b;n.loop=true;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=400;WG=AC.createGain();WG.gain.value=0;n.connect(f);f.connect(WG);WG.connect(AC.destination);n.start()}WG.gain.setTargetAtTime(v*(G.vol??1),AC.currentTime,.3)}catch(e){}}
function sting(f=110,d=.8){try{au();const o=AC.createOscillator(),g=AC.createGain(),T=AC.currentTime;o.type='sawtooth';o.frequency.setValueAtTime(f*4,T);o.frequency.exponentialRampToValueAtTime(f,T+d);g.gain.setValueAtTime(.25,T);g.gain.exponentialRampToValueAtTime(.001,T+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(T+d)}catch(e){}}
const blk=(v,i)=>{cv.style.transition=i?'none':'opacity .8s';cv.style.opacity=v};
const zh=()=>human(0x4a5a44,0x2a2a30,0x7d8c72,0x1a1a1a,{mouth:0x401a1a,eye:0x9a9a60,long:1,shoe:0x2a2a2a});
function cineStart(done){$('menu').classList.add('hide');blk(1,1);skb.classList.remove('hide');cine={t:0,f:{},objs:[],done,hv:[]};cap.textContent='';wind(.15)}
skb.onclick=()=>{if(cine&&confirm('Passer la cinématique ?'))cineEnd()};
function cineEnd(){const c=cine;cine=null;c.objs.forEach(o=>scene.remove(o));const u=pm.userData;u.g.position.y=-.8;pm.visible=true;pm.rotation.y=P.face;
  cap.textContent='';phn.classList.add('hide');skb.classList.add('hide');setNight(false);wind(0);blk(0,1);c.done()}
function halves(c,x,z,ry){return[1,0].map(up=>{const a=actor(human(0x3a6a4a,0x2a2a30,0xe0b090,0x3a2a1a,{shoe:0x222222}),true),g=a.userData.g,n=new V3(0,up?1:-1,0),k=up?-1:1,pl=new THREE.Plane(n.clone(),k);
  g.traverse(o=>{if(o.isMesh)o.material.clippingPlanes=[pl]});a.userData.head.visible=false;
  const cut=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.03,14),mBl);cut.scale.z=.7;cut.position.y=1;g.add(cut);
  if(G.bones){const b=bone(.3);b.position.y=up?1.08:.92;g.add(b)}
  if(G.org){const t=new THREE.Mesh(new THREE.TorusKnotGeometry(.07,.03,40,6),M(0xc07a80,.4));t.position.y=up?.9:1.05;g.add(t)}
  a.position.set(x,0,z);a.rotation.y=ry;c.objs.push(a);const h={a,g,pl,base:new THREE.Plane(n.clone(),k)};c.hv.push(h);return h})}
function cineTick(dt){const c=cine,t=(c.t+=dt),o=(k,f)=>{if(!c.f[k]){c.f[k]=1;f()}},cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  if(t>=2&&t<14.3){
    o('in',()=>{setNight(true);torch.intensity=0;scene.fog=new THREE.Fog(0x070a12,4,40);
      c.fl=new THREE.PointLight(0xff7722,40,22);c.fl.position.set(-1.5,1,14.5);scene.add(c.fl);c.objs.push(c.fl);
      c.vic=actor(human(0x3a6a4a,0x2a2a30,0xe0b090,0x3a2a1a,{shoe:0x222222}),true);c.vic.rotation.y=-PI/2;c.zb=actor(zh(),true);c.zb.rotation.y=PI/2;c.objs.push(c.vic,c.zb);
      for(let i=0;i<6;i++){const f=box(-1.5+(Math.random()-.5)*.4,.2+i*.12,14.5+(Math.random()-.5)*.4,.25,.3,.25,M(0xff9a30,.5,0xff5500),false);c.objs.push(f)}
      blk(0);cap.textContent='';wind(.2)});
    c.fl.intensity=35+Math.random()*18;const vu=c.vic&&c.vic.userData,zu=c.zb.userData,V=c.vic.position,Zp=c.zb.position;
    if(t<8.5){const k=cl(t-3.5,0,9);V.set(6-.9*k,0,13);Zp.set(-10+2.4*k,0,13);walkAnim(vu,k>0?1.6:0,tm);walkAnim(zu,k>0?2:0,tm);zu.armL.rotation.x=zu.armR.rotation.x=-1.4}
    if(t<12)cam.position.set(-3+(t-2)*.1,1.6,18);
    if(t>=8.5)o('att',()=>{sting(70,1);if(G.gore){vu.head.visible=false;const h=new THREE.Mesh(new THREE.SphereGeometry(.14,14,10),M(0xe0b090));h.position.set(V.x,1.6,V.z);scene.add(h);c.objs.push(h);c.hd={h,v:new V3(-1.5,3.5,1.2)};c.neck=3}else blood(V.x,1.3,V.z,6)});
    if(c.hd){const q=c.hd;q.v.y-=9*dt;q.h.position.addScaledVector(q.v,dt);if(q.h.position.y<.12){q.h.position.y=.12;q.v.set(0,0,0)}}
    if(c.neck>0){c.neck-=dt;blood(V.x,1.5,V.z,2,new V3(0,1,0))}
    if(t>=8.5&&t<12)zu.head.rotation.x=.5;
    if(t>=9.4)o('split',()=>{if(G.gore){const[u,l]=halves(c,V.x,V.z,-PI/2);c.up=u;c.lo=l;scene.remove(c.vic);sting(55,1.2)}});
    if(t>=9.4&&G.gore&&c.up){const k=cl(t-9.4,0,1.5);c.up.a.userData.p.rotation.x=-Math.min(1.4,k*2);c.up.a.position.x+=.8*dt;c.lo.a.userData.p.rotation.x=Math.min(1.2,k*1.5);
      if(t<11.5)blood(V.x,1,V.z,3,new V3(Math.random()-.5,.8,0))}
    else if(t>=9.4&&!G.gore)vu.p.rotation.x=-Math.min(PI/2,(t-9.4)*2);
    if(c.hv.length)for(const h of c.hv){h.g.updateMatrixWorld(true);h.pl.copy(h.base).applyMatrix4(h.g.matrixWorld)}
    if(t>=11&&t<12){zu.head.rotation.x=0;c.zb.rotation.y+=wrap(Math.atan2(cam.position.x-Zp.x,cam.position.z-Zp.z)-c.zb.rotation.y)*dt*6}
    if(t>=12){o('run',()=>{c.zs=Zp.clone();sting(90,2)});const s=cl((t-12)/2.3),cz=18+(t-12)*(t-12)*1.6+(t-12)*2;cam.position.set(-3+(t-2)*.1,1.6,cz);
      Zp.x=c.zs.x+(cam.position.x-c.zs.x)*Math.pow(s,1.3)*.96;Zp.z=c.zs.z+(cz-c.zs.z)*Math.pow(s,1.3)*.96;c.zb.rotation.y=Math.atan2(cam.position.x-Zp.x,cz-Zp.z);
      walkAnim(zu,7,tm);zu.armL.rotation.x=zu.armR.rotation.x=-1.5;wind(.2+s*.6)}
    cam.lookAt(-.5,1.3,t>=12?cam.position.z-5:13.5);if(t>=12)cam.rotation.x=0}
  if(t>=14.3)o('cut',()=>{blk(1,1);sting(60,1.5);wind(0)});
  if(t>=16)o('car',()=>{c.objs.forEach(x=>scene.remove(x));c.objs.length=0;c.hv.length=0;setNight(false);scene.background=new THREE.Color(0x8a9aa8);scene.fog=new THREE.Fog(0x8a9aa8,15,90);
    const g=new THREE.Group();g.position.set(60,0,14);scene.add(g);c.objs.push(g);
    const b=(w,h,d,x,y,z,col,e=0)=>{const m=new THREE.Mesh(gBox,M(col,.8,e));m.scale.set(w,h,d);m.position.set(x,y,z);g.add(m)};
    b(2.6,.12,1.9,0,.3,0,0x1a1a1e);b(.7,.5,1.9,.95,.75,0,0x222226);b(.7,.2,.7,-.25,.45,0,0x2a2a30);b(.15,.8,.7,-.55,.9,0,0x2a2a30);b(2.6,.1,1.9,0,1.8,0,0x3a3a40);
    for(const z of[-.95,.95]){b(2.2,.8,.1,0,.8,z,0x2a2a2e);b(.08,.9,.08,.9,1.35,z,0x1a1a1e);b(.08,1.4,.08,-.7,1.1,z,0x1a1a1e)}
    b(.1,.12,.5,.86,1.65,0,0x111111);b(.05,.05,.05,.82,.99,.3,0x33ff66,0x33ff66);
    const w=new THREE.Mesh(new THREE.TorusGeometry(.18,.025,8,20),M(0x111111));w.position.set(.72,1,0);w.rotation.y=PI/2.4;g.add(w);
    const L=new THREE.PointLight(0xffddaa,4,6);L.position.set(60,1.6,14);scene.add(L);c.objs.push(L);
    const u=pm.userData;pm.position.set(59.75,0,14);pm.rotation.y=PI/2;u.g.position.y=-1.05;u.legL.rotation.x=u.legR.rotation.x=-1.5;u.kneeL.rotation.x=u.kneeR.rotation.x=1.5;u.armL.rotation.x=u.armR.rotation.x=-1.2;u.elbL.rotation.x=u.elbR.rotation.x=-.3;pm.visible=true;
    for(const w of Object.values(WM))w.visible=false;
    c.zs2=[];for(let i=0;i<5;i++){const a=actor(zh(),false);a.position.set(68+i*6,0,11+(i%3)*2.5);a.rotation.y=-PI/2;c.objs.push(a);c.zs2.push(a)}
    blk(0);cap.textContent='';wind(.08)});
  if(t>=16&&c.zs2){const u=pm.userData,T=t-16;u.head.rotation.x=T<2.5?.7:T<2.8?-.1:0;u.p.rotation.x=T>2.5&&T<2.9?-.15:0;u.p.position.y=.8+Math.sin(T*(T>2.5&&T<8?22:3))*.01;
    if(T>=2.5)o('gasp',()=>{sting(200,.4)});if(T>4&&T<7)u.head.rotation.y=Math.sin((T-4)*2.2)*.8;else u.head.rotation.y=0;
    for(const a of c.zs2){a.position.x-=.5*dt;walkAnim(a.userData,1.2,tm+a.position.z);a.userData.armL.rotation.x=a.userData.armR.rotation.x=-1.4}
    if(T<7)cam.position.set(60.95-T*.05,1.4,14);else cam.position.set(59.85+Math.sin(tm*1.3)*.01,1.5,14);
    if(T<7)cam.lookAt(59.8,1.38,14);else cam.lookAt(75,1.3,14+Math.sin(tm*.5)*.4);
    if(T>=7)cap.textContent='Un cauchemar... mais dehors, ce n\'est pas un rêve.';
    if(T>=12)o('ph',()=>{cap.textContent='';phn.innerHTML='📱 <b>Mamie</b> : Tu arrives bientôt ? Je t\'attends. ❤️';phn.style.animation='vib .5s 3';phn.classList.remove('hide');sting(900,.2)});
    if(T>=17)o('fin',()=>{phn.classList.add('hide');cap.textContent='Mamie... j\'arrive.';});
    if(T>=19)o('end',()=>blk(1));
    if(T>=19.9)cineEnd()}}

/* ============ DIDACTICIEL ============ */
const TUT={on:false,i:0,talk:0,shop:0,p0:null};
const TS=[['Déplace-toi : Z Q S D (ou W A S D) et la souris pour regarder.',()=>Math.hypot(P.pos.x-TUT.p0.x,P.pos.z-TUT.p0.z)>4],['Cours : maintiens Maj en avançant.',()=>keys[K.run]&&P.moving],['Saute : Espace.',()=>P.pos.y>.2],['Accroupis-toi : C.',()=>P.crouch],
  ['Ouvre une porte : E devant la porte.',()=>B.some(b=>b.kind==='door'&&b.open)],['Parle à Mamie (salon, à gauche) : E près d\'elle.',()=>TUT.talk],['Boutique : E devant la télévision, achète une planche (50 $).',()=>P.planks>0],
  ['Barricade : H devant une fenêtre pose la planche au marteau.',()=>B.some(b=>b.kind==='win'&&b.planks>0)],['Soins : si un zombie te mord, Y pose un bandage puis T le garrot. Appuie sur Y pour continuer.',()=>keys.KeyY],['Prépare-toi : appuie sur N pour lancer la première nuit.',()=>W.active]];
function tutTick(){if(!TUT.on)return;const s=TS[TUT.i];tutE.classList.remove('hide');tutE.innerHTML='<b>Didacticiel '+(TUT.i+1)+'/'+TS.length+'</b><br>'+s[0];
  if(s[1]()){TUT.i++;if(TUT.i>=TS.length){TUT.on=false;tutE.classList.add('hide');try{localStorage.setItem('pg_intro','1')}catch(e){}msg('TU ES PRÊT. PROTÈGE MAMIE ET SURVIS JUSQU\'À L\'AUBE.',7000)}}}
// Lancement : cinématique + didacticiel pour les nouveaux joueurs
const startGame=$('playBtn').onclick;
$('playBtn').onclick=()=>{let ok=false;try{ok=localStorage.getItem('pg_intro')==='1'}catch(e){}
  if(ok||cine)return startGame();
  cineStart(()=>{startGame();TUT.on=true;TUT.i=0;TUT.p0=P.pos.clone()})};

/* ============ SONS PROCÉDURAUX ============ */
const hs=document.createElement('style');hs.textContent='#hud .bar{border-radius:7px;overflow:hidden;box-shadow:0 0 10px #000a}#hpBar i{background:linear-gradient(90deg,#7a1810,#e0443a)}#stBar i{background:linear-gradient(90deg,#8a6a1a,#f0c850)}#info{background:#0008;padding:8px 12px;border-right:3px solid #c9553d;border-radius:6px;font-size:14px}.slot{border-radius:6px;background:linear-gradient(#1a1f2acc,#0a0c12cc)}.slot.on{box-shadow:0 0 12px #d8c9a8aa}#msg{font-variant:small-caps;letter-spacing:2px}';document.head.append(hs);
const sfxCd={},sfxGap={wood:.25,door:.2,hit:.05,shot:.05,groan:.5,hurt:.3,beat:.5,step:0};
function nz(dur,fr,q,g){const T=AC.currentTime,n=Math.floor(AC.sampleRate*dur),b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=AC.createBufferSource();s.buffer=b;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=fr;f.Q.value=q;const v=AC.createGain();v.gain.value=g*(G.vol??1);s.connect(f);f.connect(v);v.connect(AC.destination);s.start(T)}
function tn(type,f0,f1,dur,g){const T=AC.currentTime,o=AC.createOscillator(),v=AC.createGain();o.type=type;o.frequency.setValueAtTime(f0,T);o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),T+dur);
  v.gain.setValueAtTime(g*(G.vol??1),T);v.gain.exponentialRampToValueAtTime(.001,T+dur);o.connect(v);v.connect(AC.destination);o.start(T);o.stop(T+dur)}
function sfx(k,vol=1){try{au();if(AC.state==='suspended')AC.resume();const now=AC.currentTime;if((sfxCd[k]||0)>now||vol<.05)return;sfxCd[k]=now+(sfxGap[k]||0);
  if(k==='step')nz(.08,300+Math.random()*150,1,.18*vol);
  else if(k==='hit'){nz(.12,900,.5,.4*vol);tn('sine',130,50,.15,.4*vol)}
  else if(k==='shot'){nz(.28,1800,.3,.8*vol);tn('square',220,40,.2,.3*vol)}
  else if(k==='wood'){nz(.15,500,2,.5*vol);tn('triangle',160,90,.1,.2*vol)}
  else if(k==='door'){tn('sawtooth',90,55,.35,.12*vol);nz(.2,300,1,.2*vol)}
  else if(k==='groan'){const f=80+Math.random()*50;tn('sawtooth',f*1.4,f*.6,1,.14*vol);tn('sine',f,f*.5,1.1,.2*vol)}
  else if(k==='hurt'){tn('sine',220,70,.25,.45*vol);nz(.15,700,.6,.3*vol)}
  else if(k==='beat'){tn('sine',60,35,.14,.6*vol);setTimeout(()=>{try{tn('sine',55,33,.14,.45*vol)}catch(e){}},180)}}catch(e){}}
function splat(){const sp=document.createElement('div');sp.style.cssText='position:fixed;left:'+(Math.random()*70)+'%;top:'+(Math.random()*70)+'%;width:'+(20+Math.random()*25)+'vw;height:'+(20+Math.random()*25)+'vh;background:radial-gradient(#a01010cc,#0000 70%);z-index:3;pointer-events:none;transition:opacity 2s';document.body.append(sp);setTimeout(()=>sp.style.opacity=0,60);setTimeout(()=>sp.remove(),2200)}
// Chaque coup laisse une plaie, du sang ou un hématome sur le corps du zombie
const _dz=dmgZ;dmgZ=(z,d)=>{sfx('hit');if(G.blood>0||G.gore){z.wd=(z.wd||0)+1;if(z.wd<=18)wound(z.a.userData)}_dz(z,d)};
const _sh=shoot;shoot=w=>{sfx('shot');_sh(w)};
const _hb=hitB;hitB=(b,d)=>{if(!b.dead)sfx('wood');_hb(b,d)};
const _so=setOpen;setOpen=(b,v)=>{sfx('door');_so(b,v)};
const _kz=killZ;killZ=z=>{sfx('groan',.6);_kz(z)};
const _hu=hurt;hurt=(d,b)=>{if(P.inv<=0&&!dead){sfx('hurt');splat()}_hu(d,b)};
let stT=0,amT=0,hbT=0,gnT=2;
const _up=updPlayer;updPlayer=dt=>{_up(dt);if(P.spd>0&&P.pos.y<.01){stT-=dt*P.spd;if(stT<0){stT=3.2;sfx('step',P.prone?.3:P.crouch?.5:1)}}
  amT-=dt;if(amT<=0){amT=2;wind(night?.14:.04)}if(P.hp<35){hbT-=dt;if(hbT<=0){hbT=.9;sfx('beat')}}};
const _uw=updWave;updWave=dt=>{_uw(dt);gnT-=dt;if(gnT<=0&&Z.length){gnT=1.5+Math.random()*2;const z=Z[Math.random()*Z.length|0],d=Math.hypot(z.a.position.x-P.pos.x,z.a.position.z-P.pos.z);sfx('groan',Math.max(0,1-d/30))}};

/* ============ GORE RÉALISTE : plaies, hématomes bleus, flaques, os, cerveau, organes ============ */
mBl.roughness=.2;mBl.color.set(0x7a0a0a);
const mBone=M(0xe8dcc0,.5),gPl=new THREE.PlaneGeometry(1,1),rnd=Math.random;
// Textures dessinées en niveaux de gris (blanc = visible) puis utilisées comme alphaMap
const tx=draw=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,128,128);draw(x);return new THREE.CanvasTexture(c)};
const tSplat=tx(x=>{x.fillStyle='#fff';x.strokeStyle='#fff';x.lineCap='round';
  for(let i=0;i<10;i++){const a=rnd()*6.28,r=rnd()*16,q=7+rnd()*(i?12:24);x.beginPath();x.arc(64+Math.cos(a)*r,64+Math.sin(a)*r,q,0,7);x.fill()}
  for(let i=0;i<9;i++){const a=rnd()*6.28,L=28+rnd()*30;x.lineWidth=2+rnd()*4;x.beginPath();x.moveTo(64,64);x.lineTo(64+Math.cos(a)*L,64+Math.sin(a)*L);x.stroke();x.beginPath();x.arc(64+Math.cos(a)*(L+4),64+Math.sin(a)*(L+4),2+rnd()*3,0,7);x.fill()}
  for(let i=0;i<16;i++){const a=rnd()*6.28,r=34+rnd()*28;x.beginPath();x.arc(64+Math.cos(a)*r,64+Math.sin(a)*r,1+rnd()*2.5,0,7);x.fill()}});
const tBruise=tx(x=>{const g=x.createRadialGradient(64,64,2,64,64,62);g.addColorStop(0,'#fff');g.addColorStop(.45,'#bbb');g.addColorStop(1,'#000');x.fillStyle=g;x.fillRect(0,0,128,128)});
const tWound=tx(x=>{x.fillStyle='#fff';x.beginPath();const n=16;for(let i=0;i<n;i++){const a=i/n*6.28,r=(i%2?20+rnd()*10:40+rnd()*18);x[i?'lineTo':'moveTo'](64+Math.cos(a)*r,64+Math.sin(a)*r*.75)}x.closePath();x.fill()});
const dM=(c,t,o=1)=>new THREE.MeshStandardMaterial({color:c,alphaMap:t,transparent:true,opacity:o,roughness:.15,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,side:THREE.DoubleSide});
const DM={red:[0x6a0808,0x8a0f0f,0x4a0606].map(c=>dM(c,tSplat)),blue:dM(0x2a2aa0,tBruise,.85),violet:dM(0x4a1a7a,tBruise,.8),yel:dM(0x6a7a2a,tBruise,.55),dark:dM(0x2a0306,tWound),flesh:dM(0xb01e28,tWound),pool:dM(0x4a0505,tSplat)};
const dec=(par,mat,x,y,z,ry,q)=>{const m=new THREE.Mesh(gPl,mat);m.position.set(x,y,z);m.rotation.set(0,ry,rnd()*6);m.scale.set(q,q,1);par.add(m);return m};
// Plaie sur le corps du zombie : sang, hématome (jaune/bleu/violet) ou plaie ouverte
function wound(u){const f=rnd()<.5?1:-1,r=rnd(),k=G.gore&&r<.35?'open':r<.62?'bruise':'blood',reg=rnd();let par,x=(rnd()-.5)*.1,y,z,q;
  if(reg<.16){par=u.head;f=1;y=(rnd()-.5)*.1;z=.153;q=.1+rnd()*.07}
  else if(reg<.38){par=rnd()<.5?u.armL:u.armR;x=0;y=-.1-rnd()*.3;z=.065*f;q=.1+rnd()*.06}
  else if(reg<.58){par=rnd()<.5?u.legL:u.legR;x=0;y=-.15-rnd()*.5;z=.09*f;q=.12+rnd()*.07}
  else{par=u.g;x=(rnd()-.5)*.16;y=.92+rnd()*.5;z=.142*f;q=.2+rnd()*.2}
  const ry=z<0?PI:0,s=z<0?-1:1;
  if(k==='bruise'){dec(par,DM.yel,x,y,z,ry,q*1.6);dec(par,rnd()<.6?DM.blue:DM.violet,x,y,z+s*.002,ry,q*1.1)}
  else if(k==='blood'){dec(par,DM.red[rnd()*3|0],x,y,z,ry,q*1.3)}
  else{dec(par,DM.dark,x,y,z,ry,q*1.2);dec(par,DM.flesh,x,y,z+s*.002,ry,q*.75);dec(par,DM.red[0],x,y-q*.5,z+s*.003,ry,q*.7);
    if(G.bones&&rnd()<.7){const b=new THREE.Mesh(gBox,mBone);b.scale.set(.012,.07,.012);b.position.set(x,y,z+s*.008);b.rotation.z=(rnd()-.5)*1.2;par.add(b)}
    if(G.org&&rnd()<.5){const o=mkOrg('gut');o.scale.setScalar(.45);o.position.set(x,y-.03,z+s*.012);par.add(o)}}}
// Taches de sang au sol
decal=function(x,z,k=1){const m=new THREE.Mesh(gPl,DM.red[rnd()*3|0]);m.rotation.set(-PI/2,0,rnd()*6);const q=(.5+rnd()*.8)*k;m.scale.set(q,q,1);m.position.set(x+(rnd()-.5),.03+rnd()*.004,z+(rnd()-.5));scene.add(m);keep(m)};
function pool(x,z,q){const m=new THREE.Mesh(gPl,DM.pool);m.rotation.set(-PI/2,0,rnd()*6);m.scale.set(q,q,1);m.position.set(x,.034,z);scene.add(m);keep(m)}
// Gouttes rondes + morceaux de chair qui retombent
blood=function(x,y,z,n,dir){const k=GM();if(!k||fxs.length>700)return;const c=Math.min(n*k,90);
  for(let i=0;i<c;i++){const m=new THREE.Mesh(gBall,mBl),r=.02+rnd()*.035;m.scale.set(r,r,r*(1+rnd()*1.5));m.position.set(x,y,z);scene.add(m);
    const v=new V3((rnd()-.5)*4,1+rnd()*4,(rnd()-.5)*4);if(dir)v.addScaledVector(dir,4);fxs.push({m,t:1.1,v,bl:1})}
  if(G.gore&&n>=4)for(let i=0;i<4;i++){const m=new THREE.Mesh(gBall,i%2?mOr:mBl),r=.03+rnd()*.035;m.scale.set(r,r*.7,r);m.position.set(x,y,z);scene.add(m);
    const v=new V3((rnd()-.5)*5,2+rnd()*3,(rnd()-.5)*5);fxs.push({m,t:2.5,v,bl:1})}
  if(n>1&&(G.gore||G.blood>1))decal(x,z,G.gore?1.3:.8)};
function bone(L){const g=new THREE.Group();g.add(new THREE.Mesh(new THREE.CylinderGeometry(.016,.02,L,8),mBone));for(const sg of[-1,1])for(const o of[-.012,.012]){const e=new THREE.Mesh(gBall,mBone);e.scale.setScalar(.03);e.position.set(o,sg*L/2,0);g.add(e)}return g}
function skull(){const g=new THREE.Group(),c=new THREE.Mesh(gBall,mBone);c.scale.set(.1,.11,.115);g.add(c);const j=new THREE.Mesh(gBox,mBone);j.scale.set(.07,.04,.07);j.position.set(0,-.1,.03);g.add(j);
  for(const sg of[-1,1]){const e=new THREE.Mesh(gBall,M(0x1a0a0a));e.scale.setScalar(.026);e.position.set(sg*.04,-.01,.1);g.add(e)}return g}
function blob(r,col,rough,amp,det=2){const g=new THREE.IcosahedronGeometry(r,det),p=g.attributes.position,v=new V3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);v.multiplyScalar(1+amp*(Math.sin(v.x*38)*Math.sin(v.y*33)+Math.sin(v.z*41)));p.setXYZ(i,v.x,v.y,v.z)}g.computeVertexNormals();return new THREE.Mesh(g,M(col,rough))}
const mkOrg=k=>{let m;if(k==='brain'){m=blob(.1,0xd8a0a8,.3,.08,3);m.scale.set(1,.8,1.1)}else if(k==='heart')m=blob(.06,0x7a0c16,.3,.05);else if(k==='lung'){m=blob(.08,0xc88a90,.4,.04);m.scale.x=.7}
  else if(k==='liver'){m=blob(.09,0x5a1a14,.35,.03);m.scale.set(1.3,.6,.9)}else m=new THREE.Mesh(new THREE.TorusKnotGeometry(.07,.022,64,8,2,3),M(0xd8949a,.3));return m};
// Mort : os, crâne, cerveau, organes éparpillés + grande flaque
gibs=function(z){const p=z.a.position;blood(p.x,1,p.z,10);if(!G.gore)return;
  const put=(o,sp=1.6,y=.05,lay)=>{o.position.set(p.x+(rnd()-.5)*sp,y,p.z+(rnd()-.5)*sp);if(lay)o.rotation.set(0,rnd()*6,PI/2);else o.rotation.set(rnd()*3,rnd()*6,rnd()*3);scene.add(o);keep(o)};
  if(G.bones){for(let i=0;i<8;i++)put(bone(.15+rnd()*.3),1.6,.03,1);put(skull(),.8,.1)}
  if(G.org){for(const k of['brain','heart','lung','lung','liver','gut','gut'])put(mkOrg(k),1.4,.07)}
  pool(p.x,p.z,2.6);for(let i=0;i<4;i++)decal(p.x,p.z,1.6)};
// Membre arraché : moignon rouge, os qui dépasse, jet de sang
dismember=function(z){const u=z.a.userData,ls=ZL.filter(l=>u[l].visible);if(!ls.length)return;const l=ls[rnd()*ls.length|0],p=u[l],w=new V3();p.getWorldPosition(w);p.visible=false;const leg=l[0]==='l',fl=M(0x7a0c16,.25);
  const s=new THREE.Group();s.position.copy(p.position);u.g.add(s);const r=new THREE.Mesh(new THREE.CylinderGeometry(.075,.07,.06,10),fl);r.position.y=-.02;s.add(r);
  if(G.bones){const b=bone(.12);b.position.y=-.06;s.add(b)}
  const d=new THREE.Group(),a=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.55,4,8),M(leg?0x2a2a30:0x4a5a44));a.rotation.z=PI/2;d.add(a);
  const cut=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.03,10),fl);cut.rotation.z=PI/2;cut.position.x=.34;d.add(cut);
  if(G.bones){const e=bone(.12);e.rotation.z=PI/2;e.position.x=.4;d.add(e)}
  d.position.set(w.x+(rnd()-.5)*.6,.1,w.z+(rnd()-.5)*.6);d.rotation.y=rnd()*6;scene.add(d);keep(d);
  z.fount=4;z.fl=l;blood(w.x,w.y,w.z,10);decal(w.x,w.z,1.5)};
// Cadavre : thorax ouvert (côtes, colonne, organes), cerveau exposé sur la tête, flaque
corpse=function(z){const u=z.a.userData;u.p.rotation.x=-PI/2;u.p.position.y=.22;
  if(G.org||G.bones){const c=new THREE.Group();c.position.set(0,1.2,.14);u.g.add(c);const r=new THREE.Mesh(gBox,M(0x5a0a10,.25));r.scale.set(.3,.38,.04);c.add(r);
    if(G.bones){for(let i=-2;i<=2;i++)for(const sg of[-1,1]){const rb=new THREE.Mesh(new THREE.TorusGeometry(.09,.011,6,10,PI),mBone);rb.position.set(sg*.01,i*.07,.04);rb.rotation.set(0,sg>0?PI/2:-PI/2,PI/2);c.add(rb)}
      const sp=bone(.36);sp.position.z=.03;c.add(sp)}
    if(G.org){const o=[['heart',-.05,.1],['lung',-.09,.05],['lung',.09,.05],['liver',.07,-.05],['gut',0,-.13]];for(const[k,x,y]of o){const m=mkOrg(k);m.position.set(x,y,.07);if(k==='gut')m.scale.setScalar(.8);c.add(m)}}}
  if(G.org){const br=mkOrg('brain');br.position.set(0,.1,-.02);br.scale.set(.9,.7,.9);u.head.add(br);const cap=new THREE.Mesh(gBall,M(0x5a0a10,.25));cap.scale.set(.1,.04,.11);cap.position.set(0,.085,-.02);u.head.add(cap)}
  if(G.bones){const sk=bone(.1);sk.rotation.z=1.2;sk.position.set(.07,.1,0);u.head.add(sk)}
  pool(z.a.position.x,z.a.position.z,3.2);decal(z.a.position.x,z.a.position.z,3);keep(z.a)};
/* =====================================================================
   V3 : CHUTES RÉALISTES, OS ET ORGANES DÉTAILLÉS, TV ET TÉLÉPHONE RÉALISTES,
   MULTIJOUEUR AVEC DIAGNOSTIC. À COLLER TOUT EN BAS DE app.js (rien d'autre à modifier).
   ===================================================================== */
const lerp = (a, b, t) => a + (b - a) * t, falls = [];
const wetM = c => new THREE.MeshPhysicalMaterial({ color: c, roughness: .3, clearcoat: 1, clearcoatRoughness: .2 });

/* ---------- 1. CHUTE RÉALISTE (genoux qui plient, torse qui bascule, rebond, bras qui pendent, tête qui ballotte) ---------- */
function startFall(h, from) {
  const u = h.userData, dx = h.position.x - from.x, dz = h.position.z - from.z, d = Math.hypot(dx, dz) || 1, fx = Math.sin(h.rotation.y), fz = Math.cos(h.rotation.y);
  const f = { h, u, t: 0, T: 1.15, back: (-dx * fx - dz * fz) / d > 0, dx: dx / d, dz: dz / d, a1: -2.2 + rnd() * 2.4, a2: -2.2 + rnd() * 2.4, e1: -rnd() * 1.4, e2: -rnd() * 1.4, l1: (rnd() - .5) * .9, l2: (rnd() - .5) * .9, hz: (rnd() - .5) * .8, spin: (rnd() - .5) * 2, tw: rnd() < .6 };
  falls.push(f); return f;
}
(function ft() {
  requestAnimationFrame(ft); const now = performance.now(), dt = Math.min((now - (ft.l || now)) / 1000, .05); ft.l = now;
  for (let i = falls.length - 1; i >= 0; i--) {
    const f = falls[i], u = f.u; f.t += dt;
    const k = Math.min(f.t / f.T, 1), s = Math.min(1, (k / .8) ** 2), bn = k > .8 ? Math.sin((k - .8) / .2 * PI) * .12 : 0, sg = f.back ? -1 : 1, buck = Math.sin(Math.min(k / .45, 1) * PI / 2) * (1 - s * .5);
    u.p.rotation.x = sg * (PI / 2 * s - bn); u.p.position.y = lerp(.8, .22, s) + bn * .4;
    u.kneeL.rotation.x = u.kneeR.rotation.x = 1.3 * buck; u.legL.rotation.x = lerp(0, f.l1, s) - .3 * buck; u.legR.rotation.x = lerp(0, f.l2, s) - .3 * buck;
    u.armL.rotation.x = lerp(-1.4, f.a1, s); u.armR.rotation.x = lerp(-1.4, f.a2, s); u.elbL.rotation.x = lerp(-.3, f.e1, s); u.elbR.rotation.x = lerp(-.3, f.e2, s);
    u.head.rotation.x = lerp(0, -sg * .6, s) + Math.sin(f.t * 14) * .06 * (1 - s); u.head.rotation.z = f.hz * s;
    const v = (1 - k) * 3.2; f.h.position.x += f.dx * v * dt; f.h.position.z += f.dz * v * dt; f.h.rotation.y += f.spin * (1 - k) * dt; resolve(f.h.position, .3);
    if (f.tw && f.t > f.T && f.t < f.T + 1.2) u.armL.rotation.x += Math.sin(f.t * 40) * .02;
    if (f.t >= f.T + (f.tw ? 1.2 : 0)) { falls.splice(i, 1); f.after && f.after() }
  }
})();
// Les zombies tués tombent au lieu de disparaître : on détache l'acteur pour que la boucle du jeu ne le supprime pas
const _k3 = killZ;
killZ = function (z) {
  const real = z.a, from = P.pos.clone(); _k3(z); z.a = new THREE.Group();
  const f = startFall(real, from); z.fb = f.back; f.after = () => { if (G.gore && GM()) corpseReal(z, real); else setTimeout(() => scene.remove(real), 7000) };
};
corpse = function () { };
gibs = function (z) { blood(z.a.position.x, 1, z.a.position.z, 10) };
// Mort du joueur : il s'effondre devant la caméra avant l'écran de défaite
const _die = die; let dyn = 0;
die = function () {
  if (dyn || dead) return; dyn = 1; paused = true; fp = false; pm.visible = true; let n = null, nd = 1e9;
  for (const z of Z) { const d = Math.hypot(z.a.position.x - P.pos.x, z.a.position.z - P.pos.z); if (d < nd) { nd = d; n = z } }
  startFall(pm, n ? n.a.position : { x: P.pos.x - Math.sin(P.face), z: P.pos.z - Math.cos(P.face) });
  cam.position.set(P.pos.x + Math.sin(P.cam) * 3.2, 2.4, P.pos.z + Math.cos(P.cam) * 3.2); cam.lookAt(P.pos.x, .5, P.pos.z);
  setTimeout(() => { paused = false; _die() }, 1900);
};

/* ---------- 2. OS ET ORGANES DÉTAILLÉS ---------- */
bone = function (L, brk) {
  const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(.013, .017, L, 10), mBone));
  for (const s of [-1, 1]) for (const o of [-.011, .011]) { const e = new THREE.Mesh(gBall, mBone); e.scale.set(.024, .02, .024); e.position.set(o, s * L / 2, 0); g.add(e) }
  if (brk) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, .006, 8), M(0x5a1a14, .4)); m.position.y = -L / 2 - .01; g.add(m) }
  return g;
};
skull = function () {
  const g = new THREE.Group(), dk = M(0x1a0a08, .9), b = (geo, mat, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); g.add(m); return m };
  b(gBall, mBone, .1, .105, .115, 0, 0, 0); b(gBox, mBone, .07, .05, .06, 0, -.07, .07); b(gBox, mBone, .075, .03, .07, 0, -.12, .05);
  for (const s of [-1, 1]) { b(gBall, dk, .026, .03, .02, s * .04, -.01, .1); b(gBall, mBone, .03, .02, .03, s * .065, -.05, .07) }
  b(gBox, dk, .012, .025, .012, 0, -.05, .115); for (let i = -3; i <= 3; i++) { b(gBox, mBone, .008, .012, .008, i * .01, -.095, .108); b(gBox, mBone, .008, .012, .008, i * .01, -.108, .098) }
  return g;
};
function mkOrg2(k) {
  const g = new THREE.Group(), add = (m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); g.add(m); return m };
  const ico = (r, c, amp, sx, sy, sz) => { const m = blob(r, c, .3, amp, 3); m.material = wetM(c); m.scale.set(sx, sy, sz); return m };
  const vein = (pts, c, r) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new V3(...p))), 12, r, 6), wetM(c));
  if (k === 'brain') { add(ico(.055, 0xd9a2ab, .1, 1, .85, 1.25), -.03); add(ico(.055, 0xd49aa4, .1, 1, .85, 1.25), .03); add(ico(.03, 0xc8909a, .12, 1.2, .7, .9), 0, -.04, -.07); add(vein([[0, -.04, 0], [0, -.08, .01], [0, -.1, .02]], 0xb98088, .011)); add(vein([[-.01, .05, .04], [0, .045, -.04], [.01, .05, -.08]], 0x8a1220, .004)) }
  else if (k === 'heart') { add(ico(.05, 0x8a1220, .04, 1, 1.15, .9)); add(ico(.03, 0x7a0e1a, .04, 1, 1, 1), .035, .02, .01); add(vein([[0, .05, 0], [.01, .09, .01], [.03, .11, 0]], 0x9a1a28, .014)); add(vein([[-.02, .05, 0], [-.04, .09, .01]], 0x2a3a7a, .01)); add(vein([[.02, .05, .01], [.05, .08, .02]], 0x2a3a7a, .008)) }
  else if (k === 'lung') { add(ico(.07, 0xc99098, .05, .7, 1.25, .75)); add(ico(.04, 0xb87a84, .05, .8, 1, .8), .02, -.04, .02); add(vein([[0, .07, 0], [0, .12, 0]], 0xd9b0a8, .012)) }
  else if (k === 'liver') { add(ico(.085, 0x6a1a12, .03, 1.4, .55, .9)); add(ico(.04, 0x5a1410, .03, 1, .6, 1), .07, -.01, .02) }
  else if (k === 'kidney') add(ico(.035, 0x6a1418, .03, .8, 1.3, .7));
  else { const p = []; for (let i = 0; i < 16; i++) p.push([Math.cos(i * 1.3) * (.05 + rnd() * .03), (rnd() - .5) * .05, Math.sin(i * 1.3) * (.05 + rnd() * .03) + i * .012]); add(vein(p, 0xd9949c, .016)) }
  return g;
}
function corpseReal(z, h) { // cadavre : thorax ouvert (côtes, sternum, colonne, organes), cerveau exposé, os éparpillés, flaques
  const u = h.userData, back = z.fb !== false;
  if (G.org || G.bones) {
    const c = new THREE.Group(); c.position.set(0, 1.2, back ? .14 : -.14); if (!back) c.rotation.y = PI; u.g.add(c);
    const fl = new THREE.Mesh(gBox, wetM(0x4a0810)); fl.scale.set(.3, .4, .05); c.add(fl);
    if (G.bones) {
      for (let i = -2; i <= 2; i++) for (const sg of [-1, 1]) { const rb = new THREE.Mesh(new THREE.TorusGeometry(.1, .011, 6, 12, PI), mBone); rb.position.set(sg * .012, i * .07, .045); rb.rotation.set(0, sg > 0 ? PI / 2 : -PI / 2, PI / 2); c.add(rb) }
      const sp = bone(.38); sp.position.z = .02; c.add(sp);
      for (let i = -2; i <= 2; i++) { const v = new THREE.Mesh(gBall, mBone); v.scale.set(.016, .012, .014); v.position.set(0, i * .075, .032); c.add(v) }
      const st = new THREE.Mesh(gBox, mBone); st.scale.set(.025, .2, .01); st.position.set(0, .05, .1); c.add(st);
    }
    if (G.org) [['heart', -.05, .09], ['lung', -.1, .04], ['lung', .1, .04], ['liver', .08, -.06], ['kidney', -.07, -.08], ['kidney', .07, -.1], ['gut', 0, -.13]].forEach(([k, x, y]) => { const m = mkOrg2(k); m.position.set(x, y, .07); c.add(m) });
  }
  if (G.org) { const br = mkOrg2('brain'); br.position.set(0, .09, -.01); u.head.add(br); const cap = new THREE.Mesh(gBall, wetM(0x5a0a10)); cap.scale.set(.1, .04, .11); cap.position.set(0, .075, -.01); u.head.add(cap) }
  if (G.bones) { const sk = bone(.1, 1); sk.rotation.z = 1.2; sk.position.set(.07, .1, 0); u.head.add(sk) }
  if (G.gore) {
    const put = (o, y) => { o.position.set(h.position.x + (rnd() - .5) * 2, y, h.position.z + (rnd() - .5) * 2); o.rotation.set(rnd() * 3, rnd() * 6, rnd() * 3); scene.add(o); keep(o) };
    if (G.bones) { for (let i = 0; i < 5; i++) put(bone(.15 + rnd() * .25, 1), .03); put(skull(), .1) }
    if (G.org) { ['gut', 'gut', 'kidney', 'lung'].forEach(k => put(mkOrg2(k), .05)) }
  }
  pool(h.position.x, h.position.z, 3); decal(h.position.x, h.position.z, 3); keep(h);
}

/* ---------- 3. TÉLÉVISION (boutique) RÉALISTE ---------- */
const v3s = document.createElement('style');
v3s.textContent = `#shop .panel{position:relative;width:min(900px,92vw);max-width:none;padding:26px 30px 34px;background:radial-gradient(circle at 50% 30%,#0b1f33,#04080e);border:16px solid #17191e;border-radius:26px;box-shadow:0 0 0 3px #3a3d44,0 40px 80px #000,inset 0 0 90px #1aa7ff44;color:#bfe6ff;font-family:'Courier New',monospace;animation:tvon .35s ease-out}
#shop .panel::after{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,#0000 0 2px,#0005 3px);border-radius:10px}
@keyframes tvon{0%{transform:scaleY(.01);filter:brightness(5)}60%{transform:scaleY(1.03);filter:brightness(2)}100%{transform:scaleY(1);filter:none}}
.tvbar{display:flex;justify-content:space-between;font-size:13px;color:#7fd0ff;border-bottom:1px solid #1a6a9a;padding-bottom:6px;margin-bottom:10px;letter-spacing:2px}
#shop h2{color:#ffd45a;text-shadow:0 0 8px #ffb300;font-family:inherit}#shop .cd{background:#07192a;border:1px solid #1a6a9a}#shop .cd b{color:#ffd45a}#shop button{background:#0d3a5a;border:1px solid #2aa0e0;color:#bfe6ff}#shop button:hover{background:#14608e}
/* ---------- TÉLÉPHONE (style iPhone) ---------- */
#phone .panel{position:relative;width:340px;height:690px;max-width:none;max-height:none;min-width:0;padding:0;border-radius:54px;background:#000;border:3px solid #3a3d44;box-shadow:0 0 0 9px #14161a,0 0 0 11px #2a2d33,0 30px 80px #000;overflow:hidden;font-family:-apple-system,system-ui,sans-serif}
.pscr{position:absolute;inset:8px;border-radius:46px;overflow:hidden;background:linear-gradient(160deg,#1b2a4a,#3a1f4a 55%,#6a2a3a);display:flex;flex-direction:column;color:#fff}
.pis{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:96px;height:28px;background:#000;border-radius:16px}
.pst{display:flex;justify-content:space-between;padding:14px 26px 4px;font-size:13px;font-weight:600}
.pgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px 8px;padding:26px 16px}
.pap{text-align:center;font-size:11px;cursor:pointer}.pap i{display:flex;align-items:center;justify-content:center;width:56px;height:56px;margin:0 auto 4px;border-radius:14px;font-style:normal;font-size:28px;box-shadow:0 4px 10px #0006}
.pbody{flex:1;overflow:auto;padding:6px 18px}.pbar{display:flex;justify-content:space-between;align-items:center;padding:10px 14px 4px;font-weight:600;font-size:16px}
.pscr button{font-size:13px;padding:5px 11px;border-radius:14px;background:#ffffff30;border:0}.pscr .row{border-bottom:1px solid #ffffff22}
.pnot{margin:10px 14px;padding:10px 12px;border-radius:16px;background:#ffffff2e;backdrop-filter:blur(8px);font-size:13px}
.pmsg{background:#2a8af0;border-radius:18px 18px 18px 4px;padding:8px 12px;margin:6px 0;font-size:13px;max-width:85%}
.phome{width:120px;height:5px;background:#fffc;border-radius:3px;margin:8px auto 10px;cursor:pointer}`;
document.head.append(v3s);
const _rs = renderShop;
renderShop = function () { _rs(); $('shop').querySelector('.panel').insertAdjacentHTML('afterbegin', '<div class="tvbar"><span>● TÉLÉ-ACHAT</span><span>CH 07</span><span>' + new Date().toTimeString().slice(0, 5) + '</span></div>') };

let pApp = null;
const _ou = openUI; openUI = function (id) { if (id === 'phone') pApp = null; _ou(id) };
async function setGore(on) { if (!on) { G.gore = G.bones = G.org = false; return } if (await askConfirm('Êtes-vous sûr ?', 'Le gore est violent et réservé aux adultes.') && await askConfirm('Vraiment sûr ?', 'Dernière confirmation.')) G.gore = G.bones = G.org = true }
renderPhone = function () {
  const p = $('phone').querySelector('.panel'), hh = new Date().toTimeString().slice(0, 5), r = (a, b) => '<div class="row"><span>' + a + '</span><b>' + b + '</b></div>';
  const tg = (l, on, k, dis) => '<div class="row"><span>' + l + '</span><button data-g="' + k + '"' + (dis ? ' disabled' : '') + '>' + (on ? 'ON' : 'OFF') + '</button></div>';
  const T = { stats: 'Statistiques', msgs: 'Messages', set: 'Réglages', act: 'Partie' };
  let b = '';
  if (!pApp) {
    const A = [['stats', '📊', 'Stats', '#2a8a5a'], ['msgs', '💬', 'Messages', '#2aa84a'], ['set', '⚙️', 'Réglages', '#6a6f78'], ['act', '🎮', 'Partie', '#8a4ad8']];
    b = '<div class="pgrid">' + A.map(a => '<div class="pap" data-p="' + a[0] + '"><i style="background:' + a[3] + '">' + a[1] + '</i>' + a[2] + '</div>').join('') + '</div>' + (P.log[0] ? '<div class="pnot"><b>Notification</b><br>' + P.log[0] + '</div>' : '');
  } else if (pApp === 'stats') b = r('Zombies éliminés', P.kills) + r('Nuits survécues', P.nights) + r('Temps de survie', Math.floor(P.time / 60) + ' min ' + Math.floor(P.time % 60) + ' s') + r('Niveau / XP', lvl() + ' · ' + P.xp % 100 + '/100') + r('Argent gagné', P.earned + ' $') + r('Argent dépensé', P.spent + ' $') + r('Dégâts reçus', Math.round(P.dmgTaken)) + r('Équipe', P.kills + ' éliminés (solo)');
  else if (pApp === 'msgs') b = P.log.length ? P.log.map(t => '<div class="pmsg">' + t + '</div>').join('') : '<p class="sub">Aucun message.</p>';
  else if (pApp === 'set') b = tg('Notifications', P.notif, 'notif') + '<div class="row"><span>Sensibilité</span><input type="range" id="sens" min=".3" max="2.5" step=".1" value="' + P.sens + '"></div><div class="row"><span>Champ de vision</span><input type="range" id="fov" min="55" max="100" value="' + cam.fov + '"></div><div class="row"><span>Sang</span><button data-g="blood">' + BLN[G.blood] + '</button></div>' + tg('Gore', G.gore, 'gore') + tg('Os visibles', G.bones, 'bones', !G.gore) + tg('Organes et cerveau', G.org, 'org', !G.gore);
  else b = '<div class="row"><span>Lancer la nuit (hôte)</span><button data-a="night">Lancer</button></div><div class="row"><span>Sauvegarde manuelle</span><button data-a="save">Sauvegarder</button></div><p class="sub">' + lastSave + '</p>';
  p.innerHTML = '<div class="pscr"><div class="pis"></div><div class="pst"><span>' + hh + '</span><span>📶 🔋 100%</span></div>' + (pApp ? '<div class="pbar"><button data-p="home">‹ Accueil</button><span>' + T[pApp] + '</span><span style="width:70px"></span></div>' : '') + '<div class="pbody">' + b + '</div><div class="phome" data-p="home"></div><div style="text-align:center;margin-bottom:10px"><button data-a="close">Fermer (P)</button></div></div>';
};
$('phone').onclick = async e => {
  const b = e.target.closest('button,[data-p]'); if (!b) return; const d = b.dataset;
  if (d.p) { pApp = d.p === 'home' ? null : d.p; renderPhone(); return }
  if (d.a === 'close') { closeUI(); return } if (d.a === 'night') { closeUI(); startNight(); return } if (d.a === 'save') { save(); renderPhone(); return }
  if (d.g) { if (d.g === 'notif') P.notif = !P.notif; else if (d.g === 'gore') await setGore(!G.gore); else if (d.g === 'bones' && G.gore) G.bones = !G.bones; else if (d.g === 'org' && G.gore) G.org = !G.org; else if (d.g === 'blood') G.blood = (G.blood + 1) % 4; saveG(); renderPhone() }
};
$('phone').oninput = e => { const i = e.target.id; if (i === 'sens') P.sens = +e.target.value; else if (i === 'fov') { cam.fov = +e.target.value; cam.updateProjectionMatrix() } };
$('settings').onchange = async e => {
  const id = e.target.id, c = e.target.checked;
  if (id === 'volR') G.vol = +e.target.value; else if (id === 'blSel') G.blood = +e.target.value;
  else if (id === 'goreCk') { e.target.checked = G.gore; await setGore(c) } else if (id === 'boneCk') G.bones = c; else if (id === 'orgCk') G.org = c;
  saveG(); renderSet();
};

/* ---------- 4. MULTIJOUEUR : chaque étape Firebase annonce exactement quel chemin est refusé ---------- */
const stp = (l, p) => p.catch(e => { throw new Error(l + ' → ' + (e.code || '') + ' ' + (e.message || '')) });
mpJoin = async function (code, host) {
  const { ref, get, set, onValue, onDisconnect } = MP.F, rr = await stp('lire rooms/' + code, get(ref(MP.db, 'rooms/' + code)));
  if (!rr.exists()) return mpMsg('Salon introuvable.');
  const r = rr.val(), pl = await stp('lire roomPlayers/' + code, get(ref(MP.db, 'roomPlayers/' + code))), v = pl.val() || {};
  if (!host && !v[MP.uid] && Object.keys(v).length >= r.max) return mpMsg('Salon complet.'); if (!host && r.state === 'playing') return mpMsg('Partie déjà lancée.');
  MP.code = code; MP.host = r.host === MP.uid; MP.max = r.max; const me = ref(MP.db, 'roomPlayers/' + code + '/' + MP.uid);
  await stp('écrire roomPlayers/' + code + '/' + MP.uid, set(me, { name: MP.name, x: 0, z: 7.5, yaw: 0 })); onDisconnect(me).remove().catch(() => { });
  onValue(ref(MP.db, 'roomPlayers/' + code), s => mpPlayers(s.val() || {}), e => mpMsg('Lecture refusée : ' + e.code));
  onValue(ref(MP.db, 'rooms/' + code + '/state'), s => { if (s.val() === 'playing' && !playing) mpStart() }, e => mpMsg('Lecture refusée : ' + e.code)); mpLobby();
};
mpTick = function (dt) {
  if (!MP.code) return; const { ref, update } = MP.F; MP.t += dt;
  if (MP.t > .1) { MP.t = 0; update(ref(MP.db, 'roomPlayers/' + MP.code + '/' + MP.uid), { x: P.pos.x, z: P.pos.z, yaw: P.face, name: MP.name }).catch(e => { if (!MP.er) { MP.er = 1; msg('Synchro refusée : ' + (e.code || e.message), 6000) } }) }
  for (const r of MP.rem.values()) { if (!r.tg) continue; const k = Math.min(1, dt * 10), nx = r.px + (r.tg.x - r.px) * k, nz = r.pz + (r.tg.z - r.pz) * k, sp = Math.hypot(nx - r.px, nz - r.pz) / Math.max(dt, .001); r.px = nx; r.pz = nz; r.a.position.set(nx, 0, nz); r.a.rotation.y = r.tg.yaw; walkAnim(r.a.userData, Math.min(sp, 7), tm) }
};
mpd.onclick = async e => {
  const b = e.target.closest('button'); if (!b) return; const m = b.dataset.m;
  if (m === 'close') { mpd.classList.add('hide'); return } if (m === 'leave') { location.reload(); return }
  if (m === 'start') { if (MP.host) MP.F.set(MP.F.ref(MP.db, 'rooms/' + MP.code + '/state'), 'playing').catch(x => mpMsg('Erreur : ' + x.message)); return }
  MP.name = ($('mpn') && $('mpn').value.trim().slice(0, 16)) || MP.name; mpMsg('Connexion...'); if (!await mpInit()) return; const { ref, get, set } = MP.F; mpMsg('');
  try {
    if (m === 'create') { const code = Math.random().toString(36).slice(2, 7).toUpperCase(); await stp('créer rooms/' + code, set(ref(MP.db, 'rooms/' + code), { host: MP.uid, max: +$('mpx').value, priv: $('mpp').checked, state: 'lobby', name: MP.name })); await mpJoin(code, true) }
    else if (m === 'join') { const c = $('mpc').value.trim().toUpperCase(); if (c) await mpJoin(c, false) }
    else if (m === 'list') { const s = await stp('lire rooms', get(ref(MP.db, 'rooms'))), v = s.val() || {}, l = Object.entries(v).filter(([c, r]) => !r.priv && r.state === 'lobby'); $('mpl').innerHTML = l.length ? l.map(([c, r]) => '<div class="row"><span>' + esc(r.name) + ' (' + r.max + ' max)</span><button data-m="jc" data-c="' + c + '">Rejoindre</button></div>').join('') : '<p class="sub">Aucun salon public.</p>' }
    else if (m === 'jc') await mpJoin(b.dataset.c, false);
  } catch (x) { mpMsg('Erreur : ' + x.message) }
};

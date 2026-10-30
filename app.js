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


/* ============ JALONS 4-6 : PORTES, BARRICADES, ARMES, BOUTIQUE TV, TÉLÉPHONE, SAUVEGARDE ============ */
Object.assign(P,{money:50,earned:50,spent:0,planks:0,own:{},ammo:{},res:{},cur:'Poings',xp:0,rel:0,dmgTaken:0,aim:false,mouse:false,notif:true,log:[],work:null,sens:1});
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
// Armes tenues en main + planche
const WM={},hR=pm.userData.handR,part=(par,w,h,d,x,y,z,c)=>{const m=new THREE.Mesh(gBox,M(c,.5));m.scale.set(w,h,d);m.position.set(x,y,z);par.add(m)};
for(const n of SL){const g=new THREE.Group();g.visible=false;hR.add(g);WM[n]=g;
  if(n==='Marteau'){part(g,.035,.38,.035,0,-.12,0,0x6b4a2b);part(g,.06,.08,.16,0,-.3,0,0x666666)}
  else if(n==='Couteau'){part(g,.02,.22,.045,0,-.15,0,0xcccccc);part(g,.03,.08,.04,0,-.02,0,0x222222)}
  else{const L=WP[n].len;part(g,.05,L,.07,0,-L/2-.02,0,0x1a1a1a);part(g,.045,.1,.05,0,-.06,-.07,0x2a2a2a);if(L>.5)part(g,.04,.14,.05,0,-.35,-.08,0x2a2a2a)}}
const plk=new THREE.Mesh(gBox,mPl);plk.scale.set(.5,.12,.04);plk.position.set(0,-.1,.05);plk.visible=false;pm.userData.handL.add(plk);
// Portes et fenêtres (façade, garage) : ouvrir, verrouiller, barricader, réparer, détruire
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
function updFx(dt){for(let i=fxs.length-1;i>=0;i--){const f=fxs[i];f.t-=dt;if(f.v){f.m.position.addScaledVector(f.v,dt);f.v.y-=3*dt}if(f.t<=0){scene.remove(f.m);if(f.line)f.m.geometry.dispose();fxs.splice(i,1)}}}
function tracer(a,b){const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),new THREE.LineBasicMaterial({color:0xffe9a0}));scene.add(l);fxs.push({m:l,t:.05,line:1})}
function impact(p){const m=box(p.x,p.y,p.z,.08,.08,.08,M(0x111111),false);impacts.push(m);if(impacts.length>60)scene.remove(impacts.shift())}
// Combat
function dmgZ(z,d){z.hp-=d;if(!z.crawl&&!z.boss&&z.hp>0&&z.hp<z.max*.35)z.crawl=true}
function killZ(z){const l0=lvl();P.kills++;P.xp+=z.boss?100:10;if(Math.random()<.6){const m=(z.boss?200:10)+(Math.random()*30|0);P.money+=m;P.earned+=m}
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
function attack(){if(P.pcd>0||!playing||dead||P.roll>0||P.rel>0||P.work||paused)return;const w=WP[P.cur];
  if(w.mag){shoot(w);P.punch=.12;return}
  P.pcd=w.rate;P.punch=.3;P.nImp=Math.max(P.nImp,w.noise);const fx=-Math.sin(P.cam),fz=-Math.cos(P.cam);
  for(const z of Z){const dx=z.a.position.x-P.pos.x,dz=z.a.position.z-P.pos.z,d=Math.hypot(dx,dz);
    if(d<w.rng&&(dx*fx+dz*fz)/(d||1)>.3){dmgZ(z,w.dmg);z.a.position.x+=fx*.7;z.a.position.z+=fz*.7;resolve(z.a.position,.32);if(Math.random()<.15&&!z.boss)z.down=2}}}
// Interface : boutique TV, téléphone, hotbar
const st=document.createElement('style');st.textContent='.ui{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#05070bcc;z-index:6}.ui.hide{display:none}.ui .panel{max-height:88vh;overflow:auto;min-width:400px}.ui button{font-size:14px;padding:6px 12px;margin:3px}.row{display:flex;justify-content:space-between;align-items:center;gap:20px;border-bottom:1px solid #2a2f3a;padding:4px 0}#wbar{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:6px}.slot{width:84px;padding:4px;background:#0009;border:1px solid #fff3;text-align:center;font-size:11px}.slot.on{border-color:#d8c9a8}';document.head.append(st);
['shop','phone'].forEach(id=>{const d=document.createElement('div');d.id=id;d.className='ui hide';d.innerHTML='<div class="panel"></div>';document.body.append(d)});
const wb=document.createElement('div');wb.id='wbar';$('hud').append(wb);$('prompt').style.bottom='110px';
let wbC='';function wbarUpd(){let h='';SL.forEach((n,i)=>{const w=WP[n],ok=n==='Marteau'||P.own[n];h+='<div class="slot'+(P.cur===n?' on':'')+'">'+(ok?'<b>'+(i+1)+' '+n+'</b><br>'+(w.mag?P.ammo[n]+' / '+P.res[n]:'—'):'<span style="font-size:20px">?</span><br>niv. '+w.lvl)+'</div>'});if(h!==wbC){wbC=h;wb.innerHTML=h}}
function hintText(dg,dt){if(dt<2.8)return'E : boutique TV';if(dg<2.8)return'E : parler à Mamie';const b=nearB();if(!b)return'';return(b.kind==='door'?'E ouvrir/fermer · L verrouiller · ':'')+'H barricader ('+P.planks+' planche) · J réparer'}
function openUI(id){uiOpen=id;$(id).classList.remove('hide');document.exitPointerLock();id==='shop'?renderShop():renderPhone()}
function closeUI(){if(uiOpen)$(uiOpen).classList.add('hide');uiOpen=false;canvas.requestPointerLock()}
function renderShop(){const p=$('shop').firstChild;let h='<h2>Boutique TV</h2><p class="sub">Cagnotte commune : '+P.money+' $ · niveau '+lvl()+' · planches : '+P.planks+'</p><div class="row"><span>Planche</span><button data-k="plank">50 $</button></div>';
  SL.slice(1).forEach(n=>{const w=WP[n];h+='<div class="row"><span>'+n+(w.mag?' (chargeur de '+w.mag+')':'')+'</span>'+(P.own[n]?(w.mag?'<button data-k="mag:'+n+'">+ chargeur 100 $</button>':'<b>Possédé</b>'):lvl()<w.lvl?'<b>niveau '+w.lvl+'</b>':'<button data-k="buy:'+n+'">'+w.price+' $</button>')+'</div>'});
  p.innerHTML=h+'<br><button data-k="close">Fermer</button><p class="sub">'+shopMsg+'</p>'}
$('shop').onclick=e=>{const b=e.target.closest('button');if(!b)return;const[k,n]=b.dataset.k.split(':');
  const pay=c=>{if(P.money<c){shopMsg='Pas assez d\'argent.';return false}P.money-=c;P.spent+=c;return true};
  if(k==='close')return closeUI();
  if(k==='plank'){if(pay(50)){P.planks++;shopMsg='Planche achetée.'}}
  else if(k==='buy'){const w=WP[n];if(lvl()>=w.lvl&&!P.own[n]&&pay(w.price)){P.own[n]=1;if(w.mag){P.ammo[n]=w.mag;P.res[n]=0}shopMsg=n+' acheté.'}}
  else if(k==='mag'){if((P.res[n]||0)>=10)shopMsg='Maximum de chargeurs.';else if(pay(100)){P.res[n]++;shopMsg='Chargeur acheté.'}}
  renderShop()};
function renderPhone(){const p=$('phone').firstChild,r=(a,b)=>'<div class="row"><span>'+a+'</span><b>'+b+'</b></div>';
  let h='<h2>Téléphone</h2><div>'+[['stats','Statistiques'],['msgs','Messages'],['set','Paramètres'],['act','Partie']].map(([k,n])=>'<button data-t="'+k+'">'+n+'</button>').join('')+'</div><br>';
  if(tab==='stats')h+=r('Zombies éliminés (vous)',P.kills)+r('Nuits survécues',P.nights)+r('Temps de survie',Math.floor(P.time/60)+' min '+Math.floor(P.time%60)+' s')+r('Niveau / expérience',lvl()+' · '+P.xp%100+'/100')+r('Argent gagné',P.earned+' $')+r('Argent dépensé',P.spent+' $')+r('Dégâts reçus',Math.round(P.dmgTaken))+r('Équipe',P.kills+' éliminés (solo)');
  else if(tab==='msgs')h+=P.log.length?P.log.map(t=>'<div class="row">'+t+'</div>').join(''):'<p class="sub">Aucune notification.</p>';
  else if(tab==='set')h+='<div class="row"><label><input type="checkbox" id="nt" '+(P.notif?'checked':'')+'> Notifications</label></div><div class="row"><span>Sensibilité souris</span><input type="range" id="sens" min=".3" max="2.5" step=".1" value="'+P.sens+'"></div><div class="row"><span>Champ de vision</span><input type="range" id="fov" min="55" max="100" value="'+cam.fov+'"></div>';
  else h+='<div class="row"><span>Lancer la nuit (hôte)</span><button data-a="night">Lancer</button></div><div class="row"><span>Sauvegarde manuelle</span><button data-a="save">Sauvegarder</button></div><p class="sub">'+lastSave+'</p>';
  p.innerHTML=h+'<br><button data-a="close">Fermer (P)</button>'}
$('phone').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.t){tab=b.dataset.t;renderPhone()}else if(b.dataset.a==='close')closeUI();else if(b.dataset.a==='night'){closeUI();startNight()}else if(b.dataset.a==='save'){save();renderPhone()}};
$('phone').oninput=e=>{if(e.target.id==='sens')P.sens=+e.target.value;else if(e.target.id==='fov'){cam.fov=+e.target.value;cam.updateProjectionMatrix()}else if(e.target.id==='nt')P.notif=e.target.checked};
// Sauvegarde (navigateur ; Firebase au groupe 3)
function save(quiet){try{localStorage.setItem('pg_save',JSON.stringify({m:P.money,e:P.earned,s:P.spent,own:P.own,ammo:P.ammo,res:P.res,pl:P.planks,xp:P.xp,k:P.kills,n:P.nights,t:P.time,dmg:P.dmgTaken,w:W.n,b:B.map(b=>({p:b.planks,h:b.hp,d:b.dead,o:b.open,l:b.locked}))}));lastSave='Sauvegarde réussie.';if(!quiet)msg(lastSave,2500);return true}catch(e){lastSave='ÉCHEC de la sauvegarde : '+e.message;if(!quiet)msg(lastSave,4000);return false}}
function loadSave(){try{const d=JSON.parse(localStorage.getItem('pg_save'));if(!d)return;
  Object.assign(P,{money:d.m,earned:d.e,spent:d.s,own:d.own,ammo:d.ammo,res:d.res,planks:d.pl,xp:d.xp,kills:d.k,nights:d.n,time:d.t,dmgTaken:d.dmg});W.n=d.w;
  d.b.forEach((q,i)=>{const b=B[i];if(!b)return;for(let k=0;k<q.p;k++)addPlank(b);b.hp=q.h;b.locked=q.l;if(q.d)destroyB(b);else if(q.o)setOpen(b,true);if(b.cr)b.cr.visible=!b.dead&&b.hp<base(b)*.6});
  msg('Partie chargée : '+W.n+' nuit(s) terminée(s).',4000)}catch(e){msg('Chargement impossible : '+e.message)}}

/* ============ JALON 1 : JOUEUR ============ */
function updPlayer(dt){if(P.mouse&&WP[P.cur].auto)attack();if(P.rel>0){P.rel-=dt;if(P.rel<=0){const w=WP[P.relW];P.ammo[w.n]=w.mag;P.res[w.n]--}}if(P.work){P.work.t-=dt;P.work.d-=dt;if(P.work.d<=0){P.work.d=.22;P.nImp=Math.max(P.nImp,12);puff(P.work.b.cx,1.1,P.work.b.z+.4,2)}if(P.work.t<=0)workDone()}
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
  P.spd=sp;P.pos.x+=dx*sp*dt;P.pos.z+=dz*sp*dt;resolve(P.pos,.35);
  P.vy-=15*dt;P.pos.y+=P.vy*dt;if(P.pos.y<=0){P.pos.y=0;P.vy=0}
  P.nImp=Math.max(0,P.nImp-25*dt);P.n=Math.max(noise,P.nImp);if(P.pcd>0)P.pcd-=dt;if(P.inv>0)P.inv-=dt;
  if(!night)P.hp=Math.min(100,P.hp+1.5*dt);
  // Pose et animation
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
  // Caméra
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
function hurt(d){if(P.inv>0||dead)return;P.hp-=d;P.dmgTaken+=d;$('flash').style.opacity=.8;say(['Fais attention !','Oh mon dieu...','Ça va ?'][Math.random()*3|0]);if(P.hp<=0)die()}
function interact(){const dg=Math.hypot(P.pos.x+4,P.pos.z+3),dt=Math.hypot(P.pos.x+4,P.pos.z-5.5);
  if(dt<2.8){openUI('shop');return}
  if(dg<2.8){msg('Mamie : « Ne t\'inquiète pas pour moi, mon petit. Protège la maison. »');return}
  const b=nearB();if(!b)return;
  if(b.kind!=='door')msg('Fenêtre : H pour la barricader.',1800);
  else if(b.planks)msg('Porte barricadée : impossible de l\'ouvrir.',1800);
  else if(b.locked)msg('Porte verrouillée (L pour déverrouiller).',1800);
  else{setOpen(b,!b.open);P.nImp=Math.max(P.nImp,8)}}

/* ============ JALON 3 : ZOMBIES ============ */
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
      vis=clear&&dp<(night?15:25)&&da<1.2,hear=P.n*(clear?1:.5)>dp;   // vue (cône) et ouïe (bruit, atténué par les murs)
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
  if(dp<1.35&&z.state==='chase'&&P.hp>0){z.atk-=dt;if(z.atk<=0){z.atk=1.1;hurt(z.dmg)}}else z.atk=Math.min(1,z.atk+dt);
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
  $('info').innerHTML=(night?'Nuit '+W.n+' · '+(Z.length+W.queue)+' zombies restants':'Jour '+(W.n+1)+' · N pour lancer la nuit')+'<br>Niveau '+lvl()+' ('+P.xp%100+'/100 XP) · Éliminés : '+P.kills+'<br>Cagnotte : '+P.money+' $ · Planches : '+P.planks+(P.rel>0?'<br>Rechargement...':'')+'<br>P : téléphone';
  const dg=Math.hypot(P.pos.x+4,P.pos.z+3),dt2=Math.hypot(P.pos.x+4,P.pos.z-5.5);
  $('prompt').textContent=hintText(dg,dt2);wbarUpd();
  msgT-=dt;if(msgT<=0)$('msg').textContent='';bubT-=dt;if(bubT<=0)$('bubble').textContent='';
  $('flash').style.opacity=Math.max(0,parseFloat($('flash').style.opacity||0)-dt*2);$('cross').classList.toggle('hide',!(fp||P.aim));
}
let last=performance.now();
function loop(t){requestAnimationFrame(loop);const dt=Math.min((t-last)/1000,.05);last=t;tm+=dt;
  if(playing&&!paused&&!dead){
    P.time+=dt;updPlayer(dt);updWave(dt);
    updFx(dt);for(let i=Z.length-1;i>=0;i--){const z=Z[i];updZ(z,dt);
      if(z.hp<=0){killZ(z);scene.remove(z.a);Z.splice(i,1)}}
    // Mamie réagit aux zombies proches et aux bruits
    let near=null,nd=18;for(const z of Z){const d=Math.hypot(z.a.position.x+4,z.a.position.z+3);if(d<nd){nd=d;near=z}}
    if(near){grandma.rotation.y+=wrap(Math.atan2(near.a.position.x+4,near.a.position.z+3)-grandma.rotation.y)*dt*2;grandma.rotation.y=Math.max(-.8,Math.min(.8,grandma.rotation.y));if(nd<12)say('J\'entends du bruit dehors...')}
    grandma.userData.p.rotation.x=Math.sin(tm*1.2)*.02;hud(dt);
  }else if(!playing){cam.position.set(Math.sin(tm*.1)*30,10,25+Math.cos(tm*.1)*5);cam.lookAt(0,2,0)}
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
  else if(e.code===K.use)interact();else if(e.code===K.night)startNight();else if(e.code===K.view)fp=!fp;
});

try{$('menu').querySelector('small').insertAdjacentHTML('beforebegin','<p class="sub">1-7 armes · 0 poings · R recharger · H barricader · J réparer · L verrouiller · P téléphone · E boutique TV</p>');
  if(localStorage.getItem('pg_save')){const b=document.createElement('button');b.textContent='Continuer';b.style.marginLeft='10px';b.onclick=()=>{$('playBtn').onclick();loadSave()};$('playBtn').after(b)}}catch(e){}

import * as THREE from 'three';
const $=i=>document.getElementById(i),V3=THREE.Vector3,PI=Math.PI;
// Touches physiques (event.code) : ZQSD sur AZERTY = WASD sur QWERTY
const K={fwd:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',run:'ShiftLeft',sprint:'KeyF',crouch:'KeyC',prone:'KeyX',jump:'Space',roll:'KeyB',use:'KeyE',night:'KeyN',view:'KeyV'};
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
wall(true,6,-8,8,[[-1,1]]);wall(true,-6,-8,8,[[4,6]]);wall(false,-8,-6,6);wall(false,8,-6,6,[[-2,0]]);
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
// Voisins : visibles mais inaccessibles
[-36,-22,22,36].forEach((x,i)=>{
  box(x,3,0,12,6,10,M([0xb8a58a,0x9aa7b0,0xc4b098,0xa89aa0][i]));box(x,6.4,0,12.8,.8,10.8,mDark,false);
  for(const wx of[-3.5,3.5])box(x+wx,2.8,5.05,1.6,1.4,.1,M(0x1a2232,.2,0x0a0f18),false);
  box(x,1.2,5.05,1.2,2.4,.1,mWood,false);
});
// Fond de jardin et clôtures
[[0,-16,20,.2],[-10,-11,.2,10],[10,-11,.2,10]].forEach(([x,z,w,d])=>box(x,.6,z,w,1.2,d,mWood));
// Voitures, poubelles, barrières, lampadaires, débris
function car(x,z,vert,c){const w=vert?1.9:4.2,d=vert?4.2:1.9;box(x,.45,z,w,.7,d,M(c,.4));box(x,1,z,vert?1.7:2.2,.55,vert?2.2:1.7,M(0x223344,.2),false);box(x,.05,z,w,.1,d,mDark,false)}
car(-14,12,false,0x8a2a2a);car(9,16.5,true,0x3a4a6a);car(-30,11.5,false,0x666666);car(24,12,false,0x3a5a3a);
function bin(x,z){const m=new THREE.Mesh(new THREE.CylinderGeometry(.35,.3,.9,10),M(0x2e4a34));m.position.set(x,.45,z);m.castShadow=true;scene.add(m);cols.push({x1:x-.35,x2:x+.35,z1:z-.35,z2:z+.35})}
[[-9,8.6],[9,8.6],[-26,8.6],[28,8.6],[-40,8.6]].forEach(p=>bin(...p));
[[-5,10.3],[5,10.3],[18,10.3]].forEach(([x,z])=>box(x,.5,z,2.4,1,.2,M(0xd8832a)));
const lampL=[];
[-20,0,20].forEach(x=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,5,8),mDark);p.position.set(x,2.5,8.3);scene.add(p);
  box(x,5,8.3,.5,.2,.5,M(0xffe9b0,.5,0xffd080),false);const l=new THREE.PointLight(0xffd9a0,0,24);l.position.set(x,4.6,9);scene.add(l);lampL.push(l)});
for(let i=0;i<28;i++){const s=.2+Math.random()*.5,m=box(-45+Math.random()*90,s/2,10+Math.random()*8,s,s,s,M(0x4a4a44),false);m.rotation.y=Math.random()*PI}

/* ============ JALON 1 : PERSONNAGES ============ */
const gLimb=new THREE.CapsuleGeometry(.09,.6,4,8),gTor=new THREE.CapsuleGeometry(.2,.4,4,10),gHead=new THREE.SphereGeometry(.15,12,10);
function human(shirt,pants,skin,hair){
  const g=new THREE.Group(),add=(geo,c)=>{const o=new THREE.Mesh(geo,M(c));g.add(o);return o};
  const t=add(gTor,shirt);t.position.y=1.15;t.scale.z=.7;
  add(gHead,skin).position.y=1.62;const h=add(gHead,hair);h.position.set(0,1.67,-.04);h.scale.set(1.06,.8,1.06);
  const limb=(c,x,y,s)=>{const p=new THREE.Group();p.position.set(x,y,0);g.add(p);const o=new THREE.Mesh(gLimb,M(c));o.position.y=-s*.4;o.scale.y=s;p.add(o);return p};
  g.userData={legL:limb(pants,-.12,.8,1),legR:limb(pants,.12,.8,1),armL:limb(shirt,-.3,1.4,.8),armR:limb(skin,.3,1.4,.8)};
  return g;
}
function actor(g,shadow){ // holder(cap) > piv(pivot hanche, bascule) > g
  const h=new THREE.Group(),p=new THREE.Group();p.position.y=.8;g.position.y=-.8;p.add(g);h.add(p);scene.add(h);
  g.traverse(o=>{if(o.isMesh)o.castShadow=shadow});h.userData={...g.userData,g,p};return h;
}
function walkAnim(u,sp,t){const a=Math.sin(t*sp*2.2)*Math.min(sp/4,1)*.9;u.legL.rotation.x=a;u.legR.rotation.x=-a;u.armL.rotation.x=-a;u.armR.rotation.x=a}
const pm=actor(human(0x2a5a8a,0x333a44,0xe0b090,0x3a2a1a),true);
const grandma=actor(human(0x9a6a8a,0x5a4a5a,0xe3c0a8,0xdddddd),true);
grandma.position.set(-4,.0,-3);grandma.userData.g.position.y=-.8-.2;grandma.userData.legL.rotation.x=grandma.userData.legR.rotation.x=-1.5;grandma.rotation.y=0;
grandma.userData.armL.rotation.x=grandma.userData.armR.rotation.x=-.5;

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
  [-4,-1.2],[-2.7,-2.5],[-3,-4.5],[5,-1.5],[5,-6],[5,-9],[11,3],[11,0],[9.5,-1],[7,-1]].map(([x,z])=>({x,z}));
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

/* ============ JALON 1 : JOUEUR ============ */
function updPlayer(dt){
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
  const tgt=P.punch>0||fp?P.cam+PI:(sp>0?Math.atan2(dx,dz):P.face);P.face+=wrap(tgt-P.face)*Math.min(1,dt*12);pm.rotation.y=P.face;
  u.g.scale.y=P.crouch&&!P.prone?.72:1;u.p.rotation.x=0;u.p.position.y=.8;
  if(P.roll>0){u.p.rotation.x=(1-P.roll/.55)*2*PI;u.p.position.y=.6}
  else if(P.prone){u.p.rotation.x=PI/2;u.p.position.y=.22}
  else if(P.slide>0){u.p.rotation.x=-.9;u.p.position.y=.55}
  if(P.pos.y<.01)walkAnim(u,sp,tm);else{u.legL.rotation.x=-.6;u.legR.rotation.x=.4}
  if(P.punch>0){P.punch-=dt;u.armR.rotation.x=-1.8*Math.sin((1-P.punch/.3)*PI)}
  pm.visible=!fp;
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
function hurt(d){if(P.inv>0||dead)return;P.hp-=d;$('flash').style.opacity=.8;say(['Fais attention !','Oh mon dieu...','Ça va ?'][Math.random()*3|0]);if(P.hp<=0)die()}
function punch(){if(P.pcd>0||!playing||dead||P.roll>0)return;P.pcd=.5;P.punch=.3;P.nImp=Math.max(P.nImp,10);
  const fx=-Math.sin(P.cam),fz=-Math.cos(P.cam);
  for(const z of Z){const dx=z.a.position.x-P.pos.x,dz=z.a.position.z-P.pos.z,d=Math.hypot(dx,dz);
    if(d<1.9&&(dx*fx+dz*fz)/(d||1)>.3){z.hp-=25;z.a.position.x+=fx*.7;z.a.position.z+=fz*.7;resolve(z.a.position,.32);
      if(Math.random()<.15&&!z.boss)z.down=2;if(!z.crawl&&z.hp<z.max*.35&&!z.boss&&z.hp>0)z.crawl=true}}}
function interact(){
  const dg=Math.hypot(P.pos.x+4,P.pos.z+3),dt=Math.hypot(P.pos.x+4,P.pos.z-5.5);
  if(dg<2.8)msg('Mamie : « Ne t\'inquiète pas pour moi, mon petit. Protège la maison. »');
  else if(dt<2.8)msg('La télévision servira de boutique au jalon 5 (pas encore disponible).');}

/* ============ JALON 3 : ZOMBIES ============ */
const ZT={n:{hp:60,sp:1.7,dmg:8,s:1},f:{hp:40,sp:3.6,dmg:6,s:.95},b:{hp:500,sp:2.1,dmg:20,s:1.45}};
const rc3=['#4a5a44','#5a4a3a','#3a3f4a','#4a3a3a'];
function spawnZ(type){
  const t=ZT[type],col=new THREE.Color(rc3[Math.random()*4|0]),a=actor(human(col.getHex(),0x2a2a30,0x7d8c72,0x1a1a1a),false);
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
  walkAnim(u,sp*.9,tm+z.ph);u.armL.rotation.x=u.armR.rotation.x=-1.4+Math.sin(tm*3+z.ph)*.12;
}
function startNight(){if(W.active||!playing||dead)return;W.n++;W.active=true;W.queue=Math.min(6+W.n*4,40)+(W.n%5===0?1:0);W.bossLeft=W.n%5===0;setNight(true);msg('Nuit '+W.n+' : les zombies arrivent dans la rue !',4500)}
function updWave(dt){
  if(!W.active)return;
  W.spawnT-=dt;if(W.queue>0&&Z.length<22&&W.spawnT<=0){W.spawnT=1;W.queue--;spawnZ(W.bossLeft&&W.queue===0?(W.bossLeft=false,'b'):Math.random()<.2+W.n*.03?'f':'n')}
  if(W.queue<=0&&Z.length===0){W.active=false;P.nights++;setNight(false);P.hp=Math.min(100,P.hp+30);msg('L\'aube se lève. Nuit '+W.n+' survécue. Appuyez sur N pour la suivante.',5000)}
}
function die(){dead=true;document.exitPointerLock();$('ovStats').innerHTML='Zombies éliminés : '+P.kills+'<br>Nuits survécues : '+P.nights+'<br>Temps de survie : '+Math.floor(P.time/60)+' min '+Math.floor(P.time%60)+' s';$('over').classList.remove('hide');$('hud').classList.add('hide')}

/* ============ BOUCLE ET ENTRÉES ============ */
function hud(dt){
  $('hpBar').firstChild.style.width=Math.max(0,P.hp)+'%';$('stBar').firstChild.style.width=P.st+'%';$('nsBar').firstChild.style.width=Math.min(100,P.n/22*100)+'%';
  $('info').innerHTML=(night?'Nuit '+W.n+' · '+(Z.length+W.queue)+' zombies restants':'Jour '+(W.n+1)+' · appuyez sur N pour lancer la nuit')+'<br>Éliminés : '+P.kills;
  const dg=Math.hypot(P.pos.x+4,P.pos.z+3),dt2=Math.hypot(P.pos.x+4,P.pos.z-5.5);
  $('prompt').textContent=dg<2.8?'E : parler à Mamie':dt2<2.8?'E : télévision':'';
  msgT-=dt;if(msgT<=0)$('msg').textContent='';bubT-=dt;if(bubT<=0)$('bubble').textContent='';
  $('flash').style.opacity=Math.max(0,parseFloat($('flash').style.opacity||0)-dt*2);$('cross').classList.toggle('hide',!fp);
}
let last=performance.now();
function loop(t){requestAnimationFrame(loop);const dt=Math.min((t-last)/1000,.05);last=t;tm+=dt;
  if(playing&&!paused&&!dead){
    P.time+=dt;updPlayer(dt);updWave(dt);
    for(let i=Z.length-1;i>=0;i--){const z=Z[i];updZ(z,dt);
      if(z.hp<=0){P.kills++;scene.remove(z.a);Z.splice(i,1)}}
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
document.addEventListener('pointerlockchange',()=>{const l=document.pointerLockElement===canvas;if(playing&&!dead){paused=!l;$('pause').classList.toggle('hide',l)}});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas)return;P.cam-=e.movementX*.0022;P.pit=Math.max(-.9,Math.min(1.1,P.pit+e.movementY*.002))});
document.addEventListener('mousedown',e=>{if(document.pointerLockElement===canvas&&e.button===0)punch()});
addEventListener('keyup',e=>{keys[e.code]=0});
addEventListener('keydown',e=>{
  if(!playing||dead||paused)return;keys[e.code]=1;if(e.code==='Space')e.preventDefault();if(e.repeat)return;
  if(e.code===K.crouch){if(P.spd>4.4&&P.pos.y<.01&&!P.crouch&&!P.prone){P.slide=.7;P.sdir=[P.dx,P.dz]}else{P.crouch=!P.crouch;P.prone=false}}
  else if(e.code===K.prone){P.prone=!P.prone;P.crouch=false}
  else if(e.code===K.jump&&P.pos.y<.01&&!P.prone){P.vy=5.2;P.crouch=false;P.nImp=Math.max(P.nImp,10)}
  else if(e.code===K.roll&&P.roll<=0){P.roll=.55;P.rdir=P.moving?[P.dx,P.dz]:[Math.sin(P.face),Math.cos(P.face)];P.prone=P.crouch=false}
  else if(e.code===K.use)interact();else if(e.code===K.night)startNight();else if(e.code===K.view)fp=!fp;
});

(()=>{"use strict";
const W=1280,H=720,POW=["SPEED","SHOT","DOUBLE","LASER","OPTION","MISSILE","SHIELD"];
const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d",{alpha:false});
const touchUI=document.getElementById("touch-ui");
const stickEl=document.getElementById("stick");
const knobEl=document.getElementById("stick-knob");
const shotBtn=document.getElementById("btn-shot");
const powerBtn=document.getElementById("btn-power");
const hint=document.getElementById("orient-hint");
const keys={}; const input={ax:0,ay:0,hold:0,tog:0,pow:0,sid:null};
let mode="title",t=0,score=0,hi=+localStorage.getItem("zerodius_hiscore")||0;
let stage=1,scroll=0,spawnT=0,wave=0,boss=null,cleared=0,flash=0,options=[];
let P=null;
const live={b:[],eb:[],e:[],c:[],p:[]};
function touch(){return matchMedia("(pointer: coarse)").matches||"ontouchstart"in window}
function layout(){
  const vw=visualViewport?visualViewport.width:innerWidth;
  const vh=visualViewport?visualViewport.height:innerHeight;
  const s=Math.min(vw/W,vh/H);
  canvas.style.width=(W*s|0)+"px"; canvas.style.height=(H*s|0)+"px";
  const d=Math.min(2,devicePixelRatio||1),bw=W*d|0,bh=H*d|0;
  if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;ctx.setTransform(d,0,0,d,0,0)}
  touchUI.classList.toggle("hidden",!touch()||mode==="title");
  hint.classList.toggle("hidden",!(touch()&&vh>vw*1.08));
}
function add(n){score+=n;if(score>hi){hi=score;localStorage.setItem("zerodius_hiscore",""+hi)}}
function boom(x,y,n,c){for(let i=0;i<n;i++){const a=Math.random()*6.28,s=1+Math.random()*4;live.p.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:20,c})}}
function hit(){
  if(P.inv>0)return;
  if(P.sh){P.sh--;P.inv=30;boom(P.x,P.y,10,"#8fdfff");return}
  P.life--;P.inv=80;flash=8;boom(P.x,P.y,22,"#fff");
  if(P.life<0){mode="over";touchUI.classList.add("hidden")}
}
function fire(){
  if(P.cd>0)return; P.cd=P.laser?4:Math.max(5,11-P.shot*2);
  const n=P.dbl?2:1;
  for(let i=0;i<n;i++) live.b.push({x:P.x+24,y:P.y+(n===2?(i?8:-8):0),vx:P.laser?18:15,vy:0,w:P.laser?48:14,h:P.laser?4:5,d:P.laser?2:1,laser:P.laser});
  if(P.msl&&P.mcd<=0){P.mcd=18;live.b.push({x:P.x,y:P.y+10,vx:7,vy:3.6,w:10,h:6,d:2,laser:0})}
  for(const o of options) live.b.push({x:o.x+10,y:o.y,vx:14,vy:0,w:12,h:4,d:1,laser:0});
}
function power(){
  if(!P.g)return; const n=POW[P.sel];
  if(n==="SPEED")P.spd=Math.min(8.4,P.spd+.8);
  if(n==="SHOT")P.shot=Math.min(5,P.shot+1);
  if(n==="DOUBLE")P.dbl=1; if(n==="LASER")P.laser=1;
  if(n==="OPTION"&&P.opt<4){P.opt++;options.push({x:P.x-30,y:P.y,h:[]})}
  if(n==="MISSILE")P.msl=1; if(n==="SHIELD")P.sh=Math.min(3,P.sh+1);
  P.g=0;
}
function waveSpawn(){
  wave++; const y=90+Math.random()*500,st=stage;
  if(wave%5===0){for(let i=0;i<4+st;i++) live.e.push({k:"d",x:W+40+i*36,y:90+i*70,vx:-2.4,hp:2,sc:400,t:0,w:26,h:38})}
  else if(wave%4===0){live.e.push({k:"t",x:W+40,y:160,vx:-1.6,hp:6,sc:800,t:0,w:48,h:28});live.e.push({k:"t",x:W+40,y:H-170,vx:-1.6,hp:6,sc:800,t:0,w:48,h:28})}
  else if(wave%3===0){for(let i=0;i<6;i++) live.e.push({k:"v",x:W+30+i*28,y:y,vx:-5,hp:1,sc:250,t:0,w:30,h:20})}
  else {for(let i=0;i<5+st;i++) live.e.push({k:"s",x:W+40+i*40,y:y+Math.sin(i)*.55*40,vx:-3-st*.25,hp:1,sc:200,t:0,w:36,h:20})}
}
function start(st,keep){
  stage=st||1;mode="play";t=0;scroll=0;spawnT=20;wave=0;boss=null;cleared=0;
  if(!keep){score=0;options=[];P={x:180,y:H*.5,w:44,h:18,spd:4.4,shot:1,dbl:0,laser:0,opt:0,msl:0,sh:0,sel:0,g:0,cd:0,mcd:0,inv:80,life:3}}
  else {P.x=180;P.y=H*.5;P.inv=80}
  live.b=[];live.eb=[];live.e=[];live.c=[];live.p=[];
  input.tog=0;shotBtn.classList.remove("active");layout();
}
function box(a,b){return Math.abs(a.x-b.x)<(a.w+b.w)*.5&&Math.abs(a.y-b.y)<(a.h+b.h)*.5}
function upd(dt){
  if(mode!=="play")return;
  scroll+=3.2*dt;flash=Math.max(0,flash-dt);
  let ix=input.ax,iy=input.ay;
  if(keys.ArrowLeft||keys.a||keys.A)ix--; if(keys.ArrowRight||keys.d||keys.D)ix++;
  if(keys.ArrowUp||keys.w||keys.W)iy--; if(keys.ArrowDown||keys.s||keys.S)iy++;
  const L=Math.hypot(ix,iy)||1; if(L>1){ix/=L;iy/=L}
  P.x=Math.max(40,Math.min(W-90,P.x+ix*P.spd*dt));
  P.y=Math.max(72,Math.min(H-92,P.y+iy*P.spd*dt));
  if(P.cd>0)P.cd-=dt; if(P.mcd>0)P.mcd-=dt; if(P.inv>0)P.inv-=dt;
  if(input.pow){power();input.pow=0}
  if(input.hold||input.tog)fire();
  for(let i=0;i<options.length;i++){
    const o=options[i]; o.h.push({x:P.x,y:P.y});
    if(o.h.length>12+i*10){const h=o.h.shift();o.x+=(h.x-40-o.x)*.28;o.y+=(h.y-o.y)*.28}
  }
  if(!boss&&!cleared){spawnT+=dt;if(spawnT>Math.max(48,88-stage*8)){spawnT=0;waveSpawn();if(wave>=12+stage*3)boss={x:W+80,y:H*.5,w:220,h:160,hp:120+stage*40,max:120+stage*40,t:0,ph:1}}}
  for(const b of live.b){b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.y>H-80)b.vy=-Math.abs(b.vy)}
  live.b=live.b.filter(b=>b.x<W+80&&b.y>-40&&b.y<H+40);
  for(const b of live.eb){b.x+=b.vx*dt;b.y+=b.vy*dt;if(box(b,P)){b.dead=1;hit()}}
  live.eb=live.eb.filter(b=>!b.dead&&b.x>-40&&b.y>-40&&b.y<H+40);
  for(const e of live.e){
    e.t+=dt; e.x+=e.vx*dt;
    if(e.k==="s")e.y+=Math.sin(e.t*.09)*1.15;
    if(e.k==="v")e.y+=Math.sin(e.t*.16)*2.1;
    if((e.t|0)%70===0&&e.x<W-40&&e.x>80){const a=Math.atan2(P.y-e.y,P.x-e.x);live.eb.push({x:e.x,y:e.y,vx:Math.cos(a)*(3.2+stage*.4),vy:Math.sin(a)*(3.2+stage*.4),w:8,h:8})}
    for(const b of live.b){if(box(e,b)){e.hp-=b.d;if(!b.laser)b.x=W+99;boom(e.x,e.y,5,"#7fe4ff");if(e.hp<=0){e.dead=1;add(e.sc);boom(e.x,e.y,14,"#ffd27a");if(Math.random()<.34)live.c.push({x:e.x,y:e.y,vx:-1.35,w:22,h:34})}}}
    if(box(e,P))hit();
  }
  live.e=live.e.filter(e=>!e.dead&&e.x>-70);
  if(boss){
    boss.t+=dt; if(boss.x>W-230)boss.x-=1.4*dt;
    boss.y=H*.5+Math.sin(boss.t*.03)*110;
    if((boss.t|0)%(boss.ph===1?22:14)===0){const n=boss.ph===1?3:6;for(let i=0;i<n;i++){const a=Math.PI+(i-(n-1)/2)*.22;live.eb.push({x:boss.x-80,y:boss.y+(i-n/2)*18,vx:Math.cos(a)*4.2,vy:Math.sin(a)*4.2,w:8,h:8})}}
    for(const b of live.b){if(Math.abs(b.x-boss.x)<boss.w*.42&&Math.abs(b.y-boss.y)<boss.h*.38){boss.hp-=b.d;if(!b.laser)b.x=W+99;add(10);if(boss.hp<boss.max*.45)boss.ph=2;if(boss.hp<=0){boom(boss.x,boss.y,30,"#ffb36a");add(10000*stage);boss=null;cleared=1;setTimeout(()=>{if(stage<3)start(stage+1,1);else{mode="win";touchUI.classList.add("hidden")}},1200)}}}
    if(P&&Math.abs(P.x-boss.x)<90&&Math.abs(P.y-boss.y)<70)hit();
  }
  for(const c of live.c){c.x+=c.vx*dt;if(box(c,P)){c.dead=1;P.g=1;P.sel=(P.sel+1)%7}}
  live.c=live.c.filter(c=>!c.dead&&c.x>-30);
  for(const o of live.p){o.x+=o.vx*dt;o.y+=o.vy*dt;o.life-=dt;o.vx*=.96}
  live.p=live.p.filter(o=>o.life>0);
}
function ship(x,y){
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle="#3ad0ff";ctx.beginPath();ctx.moveTo(-20,-4);ctx.lineTo(-32-(t%5),0);ctx.lineTo(-20,4);ctx.fill();
  ctx.fillStyle="#b8c9d6";ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(-16,-10);ctx.lineTo(-8,0);ctx.lineTo(-16,10);ctx.closePath();ctx.fill();
  ctx.fillStyle="#e8f4fb";ctx.fillRect(-4,-3,14,6);ctx.restore();
}
function draw(){
  if(mode==="title"){
    ctx.fillStyle="#f3f5f7";ctx.fillRect(0,0,W,H);
    ctx.fillStyle="#1a1a1a";ctx.textAlign="center";
    ctx.font="bold 72px sans-serif";ctx.fillText("ZERODIUS",W/2,H*.42);
    ctx.font="16px monospace";ctx.globalAlpha=.55+Math.sin(t*.08)*.35;
    ctx.fillText(touch()?"TAP TO START":"SPACE / Z  ではじめる",W/2,H*.68);ctx.globalAlpha=1;
    ctx.fillStyle="#666";ctx.font="13px monospace";
    ctx.fillText("1 / 2 / 3 ステージ   HI "+String(hi).padStart(8,"0"),W/2,H*.76);
    ctx.fillText("WASD移動  Space/Zショット  Shiftパワー",W/2,H*.82);return;
  }
  ctx.fillStyle="#07090d";ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#889";
  for(let i=0;i<70;i++){const sp=1+i%3,sx=(i*91+scroll*sp)%(W+8);ctx.fillRect(W-sx,(i*47)%(H-50)+18,i%5===0?2:1,1)}
  for(const o of live.p){ctx.globalAlpha=Math.max(0,o.life/20);ctx.fillStyle=o.c;ctx.fillRect(o.x,o.y,3,3)}ctx.globalAlpha=1;
  for(const c of live.c){ctx.fillStyle="#3ce0ff";ctx.beginPath();ctx.moveTo(c.x,c.y-14);ctx.lineTo(c.x+8,c.y);ctx.lineTo(c.x,c.y+14);ctx.lineTo(c.x-8,c.y);ctx.fill()}
  for(const e of live.e){
    ctx.save();ctx.translate(e.x,e.y);
    if(e.k==="d"){ctx.fillStyle="#1488a8";ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(10,0);ctx.lineTo(0,18);ctx.lineTo(-10,0);ctx.fill();ctx.fillStyle="#7ff6ff";ctx.fillRect(-3,-8,6,16)}
    else if(e.k==="t"){ctx.fillStyle="#6b7380";ctx.fillRect(-22,-12,44,24);ctx.fillStyle="#d07a30";ctx.fillRect(18,-4,14,8)}
    else {ctx.fillStyle="#c5c8ce";ctx.beginPath();ctx.moveTo(-16,0);ctx.lineTo(14,-8);ctx.lineTo(10,0);ctx.lineTo(14,8);ctx.fill();ctx.fillStyle="#ff9a3a";ctx.fillRect(12,-2,8,4)}
    ctx.restore();
  }
  if(boss){ctx.fillStyle="#2a3140";ctx.fillRect(boss.x-100,boss.y-70,200,140);ctx.fillStyle=boss.ph===2?"#ff4d4d":"#3ad0ff";ctx.beginPath();ctx.arc(boss.x-20,boss.y,18,0,7);ctx.fill()}
  ctx.fillStyle="#7fe4ff";for(const b of live.b){if(b.laser)ctx.fillRect(b.x,b.y-b.h/2,b.w,b.h);else{ctx.beginPath();ctx.ellipse(b.x,b.y,9,4,0,0,7);ctx.fill()}}
  ctx.fillStyle="#ff5555";for(const b of live.eb)ctx.fillRect(b.x-3,b.y-3,6,6);
  if(P&&(P.inv<=0||(P.inv|0)%6<3)){ship(P.x,P.y);for(const o of options){ctx.fillStyle="#7fe4ff";ctx.beginPath();ctx.arc(o.x,o.y,7,0,7);ctx.fill()}if(P.sh){ctx.strokeStyle="rgba(120,220,255,.75)";ctx.beginPath();ctx.arc(P.x,P.y,28,0,7);ctx.stroke()}}
  ctx.fillStyle="#c8d0d8";ctx.font="14px monospace";ctx.textAlign="left";ctx.fillText("SCORE "+String(score).padStart(8,"0"),36,34);
  ctx.textAlign="center";ctx.fillText("HIGH "+String(hi).padStart(8,"0"),W/2,34);
  ctx.textAlign="right";ctx.fillText("STAGE "+stage,W-36,34);
  if(P){ctx.textAlign="left";ctx.font="12px monospace";ctx.fillStyle="#8aa";ctx.fillText("LIFE "+Math.max(0,P.life),36,54);
    const barY=H-38,bw=96,gap=8,total=7*bw+6*gap;let bx=(W-total)/2;ctx.font="11px monospace";ctx.textAlign="center";
    for(let i=0;i<7;i++){const on=P.g&&P.sel===i;ctx.fillStyle=on?"#3ec7e6":"#161a22";ctx.fillRect(bx,barY,bw,22);ctx.strokeStyle="#3a4250";ctx.strokeRect(bx,barY,bw,22);ctx.fillStyle=on?"#041018":"#9aa4b0";ctx.fillText(POW[i],bx+bw/2,barY+15);bx+=bw+gap}
    if(boss){ctx.fillStyle="#222";ctx.fillRect(W/2-180,64,360,8);ctx.fillStyle="#e25";ctx.fillRect(W/2-180,64,360*Math.max(0,boss.hp/boss.max),8)}
  }
  if(flash>0){ctx.fillStyle=`rgba(255,255,255,${flash/18})`;ctx.fillRect(0,0,W,H)}
  if(mode==="over"||mode==="win"){ctx.fillStyle="rgba(0,0,0,.55)";ctx.fillRect(0,0,W,H);ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="28px monospace";ctx.fillText(mode==="win"?"MISSION COMPLETE":"MISSION FAILED",W/2,H/2-8);ctx.font="16px monospace";ctx.fillText("SPACE / TAP でタイトル",W/2,H/2+26)}
}
function go(){if(mode==="title")start(1);else if(mode==="over"||mode==="win"){mode="title";layout()}}
addEventListener("keydown",e=>{keys[e.key]=1;if(e.key===" "||e.key==="z"||e.key==="Z"){e.preventDefault();input.hold=1;if(mode!=="play")go()}if(e.key==="Shift")input.pow=1;if(mode==="title"&&"123".includes(e.key))start(+e.key)});
addEventListener("keyup",e=>{keys[e.key]=0;if(e.key===" "||e.key==="z"||e.key==="Z")input.hold=0});
canvas.addEventListener("pointerdown",()=>{if(mode!=="play")go()});
function setStick(x,y){const r=stickEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=x-cx,dy=y-cy;const max=r.width*.38,m=Math.hypot(dx,dy)||1;if(m>max){dx=dx/m*max;dy=dy/m*max}knobEl.style.transform=`translate(${dx}px,${dy}px)`;input.ax=dx/max;input.ay=dy/max}
function resetStick(){knobEl.style.transform="translate(0,0)";input.ax=0;input.ay=0;input.sid=null}
stickEl.addEventListener("pointerdown",e=>{input.sid=e.pointerId;stickEl.setPointerCapture(e.pointerId);setStick(e.clientX,e.clientY)});
stickEl.addEventListener("pointermove",e=>{if(input.sid===e.pointerId)setStick(e.clientX,e.clientY)});
stickEl.addEventListener("pointerup",resetStick);stickEl.addEventListener("pointercancel",resetStick);
shotBtn.addEventListener("pointerdown",e=>{e.preventDefault();if(mode!=="play"){go();return}input.tog=!input.tog;shotBtn.classList.toggle("active",!!input.tog)});
powerBtn.addEventListener("pointerdown",e=>{e.preventDefault();input.pow=1});
addEventListener("resize",layout);addEventListener("orientationchange",layout);
if(visualViewport)visualViewport.addEventListener("resize",layout);
let last=performance.now();
function loop(now){const dt=Math.min(2,(now-last)/16.666);last=now;t++;upd(dt);draw();requestAnimationFrame(loop)}
layout();requestAnimationFrame(loop);
})();

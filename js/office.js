/**
 * Friday Dashboard - Office 3D Visualization
 * ISO Canvas 2D, Zero Dependencies
 */

// ============================================================
//  CONFIGURATION
// ============================================================
const AGENTS = {
    jarvis: { name:'Jarvis', hex:'#f59e0b', status:'idle', task:'Awaiting orders', progress:42 },
    vision: { name:'Vision', hex:'#0ea5e9', status:'idle', task:'Reviewing docs', progress:68 },
    scout:  { name:'Scout',  hex:'#22c55e', status:'idle', task:'Standing by', progress:55 },
    kdb:    { name:'Coder',  hex:'#8b5cf6', status:'idle', task:'Code review', progress:80 },
    friday: { name:'Friday', hex:'#dc2626', status:'working', task:'Running dashboard', progress:100 },
};

const AGENT_HOME = {
    jarvis:'unidreamity', vision:'study', scout:'research', kdb:'devlab', friday:'mission'
};

const STATUS_COLOR = { idle:'#f59e0b', standby:'#f59e0b', working:'#22c55e', training:'#dc2626' };

const ROOMS = {
    unidreamity: { gx:-9.75, gz:-3.75, size:4.2, label:'Unidreamity HQ', icon:'🏢', accent:'#f59e0b', agent:'jarvis' },
    devlab:      { gx:-3.75, gz:-9.75, size:4.2, label:'Dev Lab',        icon:'💻', accent:'#8b5cf6', agent:'kdb'    },
    mission:     { gx:-3.25, gz:-3.25, size:4.2, label:'Mission Control', icon:'🎯', accent:'#dc2626', agent:'friday' },
    study:       { gx:-2.75, gz: 3.25, size:4.2, label:'Study Room',     icon:'📚', accent:'#0ea5e9', agent:'vision' },
    research:    { gx: 3.25, gz:-2.75, size:4.2, label:'Research Hub',   icon:'🔭', accent:'#22c55e', agent:'scout'  },
    gym:         { gx: 3.75, gz: 3.75, size:4.2, label:'Gym',            icon:'💪', accent:'#ef4444', agent:null     },
};

const SLOTS = [
    {gx:0.9,gz:0.9},{gx:2.8,gz:0.9},
    {gx:0.9,gz:2.8},{gx:2.8,gz:2.8},
    {gx:1.85,gz:1.85}
];

const PAL = {
    light: {
        bg0:'#f5f5f7', bg1:'#eaeaec',
        roomFloor:{ unidreamity:'#fffbeb', devlab:'#f5f3ff', mission:'#fff1f2', study:'#e0f7fa', research:'#f0fdf4', gym:'#fff0f0' },
        roomBorder:{ unidreamity:'#f59e0b', devlab:'#8b5cf6', mission:'#dc2626', study:'#0ea5e9', research:'#22c55e', gym:'#ef4444' },
        roomShadow:'rgba(0,0,0,0.06)',
        wall:{ unidreamity:'#fef3c7', devlab:'#ede9fe', mission:'#fee2e2', study:'#e0f2fe', research:'#dcfce7', gym:'#fee2e2' },
        label:{ unidreamity:'#b45309', devlab:'#6d28d9', mission:'#b91c1c', study:'#0369a1', research:'#15803d', gym:'#b91c1c' },
        labelBg:'rgba(255,255,255,0.88)',
        agentNameBg:'rgba(255,255,255,0.92)',
        agentNameFg:'#1a1a2e',
        taskBg:'rgba(255,255,255,0.88)',
        agentShadow:'rgba(0,0,0,0.10)',
        scanline:'rgba(0,0,0,0)',
        furniture:{ sofa:'#c4b5e0', sofaDark:'#a89acb', desk:'#c8a882', deskDark:'#a08060', metal:'#b0b4bc', metalDark:'#8890a0', screen:'#2563eb', plant:'#4ade80', plantDark:'#16a34a', book:'#e2b96a', bookDark:'#b8893a', server:'#94a3b8' },
    },
    dark: {
        bg0:'#111114', bg1:'#0a0a0d',
        roomFloor:{ unidreamity:'#1a1408', devlab:'#130d1f', mission:'#180808', study:'#061418', research:'#071408', gym:'#180a0a' },
        roomBorder:{ unidreamity:'#a07830', devlab:'#6d28d9', mission:'#882020', study:'#0369a1', research:'#166534', gym:'#991b1b' },
        roomShadow:'rgba(0,0,0,0.45)',
        wall:{ unidreamity:'#1e1608', devlab:'#150e20', mission:'#1e0c0c', study:'#071820', research:'#081808', gym:'#1e0c0c' },
        label:{ unidreamity:'#f59e0b', devlab:'#a78bfa', mission:'#f87171', study:'#38bdf8', research:'#4ade80', gym:'#f87171' },
        labelBg:'rgba(10,10,14,0.80)',
        agentNameBg:'rgba(8,8,14,0.85)',
        agentNameFg:'#e2e8f0',
        taskBg:'rgba(8,8,14,0.78)',
        agentShadow:'rgba(0,0,0,0.5)',
        scanline:'rgba(255,255,255,0.012)',
        furniture:{ sofa:'#4c3a8a', sofaDark:'#2d1f5e', desk:'#5d4037', deskDark:'#3e2723', metal:'#3a3a4c', metalDark:'#252535', screen:'#1e3a8a', plant:'#2e7d32', plantDark:'#1b5e20', book:'#8b6914', bookDark:'#6b4d0e', server:'#334155' },
    },
};

// ============================================================
//  STATE
// ============================================================
let officeTheme = 'dark';
let camTheta=0.04, camScale=0.60;
const TW=52, TH=26;
let canvas,ctx,W,H,dpr,raf,tick=0;
const agentPos={}, agentPrevPos={}, agentPhase={};
let dragMode=null,lastMX=0,lastMY=0,pinchDist0=0,hoverId=null;
let logs=[],_sim=null,_inited=false;
const PARTS=[];
const TRAILS={};

// ============================================================
//  HELPER FUNCTIONS
// ============================================================
function P(){ return PAL[officeTheme]; }
function isDark(){ return officeTheme==='dark'; }

function toggleOfficeTheme(){
    officeTheme = officeTheme==='light'?'dark':'light';
    const icon = officeTheme==='dark'?'🌙':'☀';
    ['theme-toggle-ov','theme-toggle-gym'].forEach(id=>{
        const el=document.getElementById(id);
        if(el)el.textContent=icon;
    });
    const root=document.documentElement;
    if(officeTheme==='dark'){
        root.style.setProperty('--bg-primary','#0a0a0c');
        root.style.setProperty('--bg-secondary','#111113');
        root.style.setProperty('--bg-tertiary','#18181b');
        root.style.setProperty('--bg-card','#1e1e21');
        root.style.setProperty('--border','#27272a');
        root.style.setProperty('--border-hover','#3f3f46');
        root.style.setProperty('--text-primary','#fafafa');
        root.style.setProperty('--text-secondary','#a1a1aa');
        root.style.setProperty('--text-tertiary','#52525b');
    } else {
        root.style.setProperty('--bg-primary','#f5f5f7');
        root.style.setProperty('--bg-secondary','#ffffff');
        root.style.setProperty('--bg-tertiary','#f0f0f2');
        root.style.setProperty('--bg-card','#e8e8ea');
        root.style.setProperty('--border','#e0e0e4');
        root.style.setProperty('--border-hover','#c8c8cc');
        root.style.setProperty('--text-primary','#1a1a2e');
        root.style.setProperty('--text-secondary','#4a4a6a');
        root.style.setProperty('--text-tertiary','#8888aa');
    }
}

function iso(gx,gz,gy=0){
    const rx= gx*Math.cos(camTheta)+gz*Math.sin(camTheta);
    const rz=-gx*Math.sin(camTheta)+gz*Math.cos(camTheta);
    return { sx:(rx-rz)*(TW*camScale)+W*0.48, sy:(rx+rz)*(TH*camScale)-gy*(TH*0.9*camScale)+H*0.45 };
}

function floorPoly(gx,gz,s){ return [iso(gx,gz),iso(gx+s,gz),iso(gx+s,gz+s),iso(gx,gz+s)]; }

function poly(pts,fill,stroke,lw=0.8){
    if(!pts||pts.length<2) return;
    ctx.beginPath(); ctx.moveTo(pts[0].sx,pts[0].sy);
    for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].sx,pts[i].sy);
    ctx.closePath();
    if(fill){ctx.fillStyle=fill;ctx.fill();}
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}
}

function isoBox(gx,gz,bw,bd,bh,tc,lc,rc,base=0){
    const top=[iso(gx,gz,base+bh),iso(gx+bw,gz,base+bh),iso(gx+bw,gz+bd,base+bh),iso(gx,gz+bd,base+bh)];
    const lft=[iso(gx,gz+bd,base),iso(gx+bw,gz+bd,base),iso(gx+bw,gz+bd,base+bh),iso(gx,gz+bd,base+bh)];
    const rgt=[iso(gx+bw,gz,base),iso(gx+bw,gz+bd,base),iso(gx+bw,gz+bd,base+bh),iso(gx+bw,gz,base+bh)];
    const si=isDark()?'rgba(0,0,0,0.22)':'rgba(0,0,0,0.07)';
    poly(lft,lc,si,0.5); poly(rgt,rc,si,0.5); poly(top,tc,si,0.5);
}

function dk(hex,a){
    let n=parseInt(hex.replace('#',''),16);
    return `rgb(${Math.max(0,((n>>16)&0xff)-a)},${Math.max(0,((n>>8)&0xff)-a)},${Math.max(0,(n&0xff)-a)})`;
}

function lt(hex,a){
    let n=parseInt(hex.replace('#',''),16);
    return `rgb(${Math.min(255,((n>>16)&0xff)+a)},${Math.min(255,((n>>8)&0xff)+a)},${Math.min(255,(n&0xff)+a)})`;
}

function ha(hex,a){
    let n=parseInt(hex.replace('#',''),16);
    return `rgba(${(n>>16)&0xff},${(n>>8)&0xff},${n&0xff},${a})`;
}

// ============================================================
//  AGENT POSITIONING
// ============================================================
function getAgentRoom(id){
    const st=AGENTS[id].status;
    if(st==='training' && id!=='friday') return ROOMS.gym;
    return ROOMS[AGENT_HOME[id]];
}

function getSlot(id){
    const room=getAgentRoom(id);
    const peers=Object.keys(AGENTS).filter(k=>getAgentRoom(k)===room);
    const idx=peers.indexOf(id);
    const s=SLOTS[Math.min(idx,SLOTS.length-1)];
    return iso(room.gx+s.gx,room.gz+s.gz,0);
}

// ============================================================
//  PARTICLES & TRAILS
// ============================================================
function spawnP(sx,sy,col,type='dust'){
    const n=type==='spark'?4:2;
    for(let i=0;i<n;i++){
        const a=Math.random()*Math.PI*2, spd=type==='spark'?2+Math.random()*1.5:0.5+Math.random()*0.7;
        PARTS.push({x:sx+(Math.random()-0.5)*5,y:sy+(Math.random()-0.5)*5,
            vx:Math.cos(a)*spd*(type==='dust'?0.4:1),vy:Math.sin(a)*spd-1.2,
            life:1,decay:type==='spark'?0.05:0.025,col,size:type==='spark'?1.8:1.1,type});
    }
}

function updateParts(){
    for(let i=PARTS.length-1;i>=0;i--){
        const p=PARTS[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=0.04; p.life-=p.decay;
        if(p.life<=0) PARTS.splice(i,1);
    }
}

function drawParts(){
    PARTS.forEach(p=>{
        ctx.save(); ctx.globalAlpha=p.life*(isDark()?0.8:0.5);
        ctx.fillStyle=p.col;
        if(isDark()&&p.type==='spark'){ctx.shadowColor=p.col;ctx.shadowBlur=7;}
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size*Math.max(0.2,p.life),0,Math.PI*2); ctx.fill();
        ctx.restore();
    });
}

function updateTrails(){
    Object.keys(AGENTS).forEach(id=>{
        const p=agentPos[id]; if(!p) return;
        if(!TRAILS[id]) TRAILS[id]=[];
        const pr=agentPrevPos[id]||{sx:p.sx,sy:p.sy};
        if(Math.hypot(p.sx-pr.sx,p.sy-pr.sy)>0.7) TRAILS[id].push({x:p.sx,y:p.sy,life:1,col:AGENTS[id].hex});
        TRAILS[id]=TRAILS[id].filter(t=>(t.life-=0.07)>0).slice(-12);
        agentPrevPos[id]={sx:p.sx,sy:p.sy};
    });
}

function drawTrails(){
    Object.values(TRAILS).forEach(trail=>{
        if(trail.length<2) return;
        for(let i=1;i<trail.length;i++){
            const a=trail[i-1],b=trail[i];
            ctx.save(); ctx.globalAlpha=b.life*(isDark()?0.16:0.09);
            ctx.strokeStyle=b.col; ctx.lineWidth=2.5*b.life; ctx.lineCap='round';
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
            ctx.restore();
        }
    });
}

// ============================================================
//  ROOM DRAWING
// ============================================================
function drawRoom(key,r){
    const pal=P(), dark=isDark();
    const {gx,gz,size:s,label,icon,accent}=r;
    const isMission=key==='mission';
    const bg=pal.roomFloor[key]||pal.roomFloor.gym;
    const border=pal.roomBorder[key]||accent;
    const wc=pal.wall[key]||'#eee';
    const lc=pal.label[key]||accent;

    // Shadow
    ctx.save(); ctx.globalAlpha=dark?0.3:0.06;
    poly(floorPoly(gx+0.15,gz+0.15,s),dark?'#000':'#888',null);
    ctx.restore();

    // Floor
    const lw=isMission?(dark?1.8:1.2):(dark?1.0:0.7);
    poly(floorPoly(gx,gz,s),bg,border,lw);

    if(isMission){
        ctx.save(); ctx.globalAlpha=dark?0.35:0.2;
        poly(floorPoly(gx-0.08,gz-0.08,s+0.16),null,border,dark?2.5:1.8);
        ctx.restore();
    }

    // Floor grid
    const fl=ha(accent,dark?0.09:0.12);
    ctx.save(); ctx.strokeStyle=fl; ctx.lineWidth=0.5;
    for(let i=2;i<s;i+=2){
        const a=iso(gx+i,gz),b=iso(gx+i,gz+s);
        ctx.beginPath();ctx.moveTo(a.sx,a.sy);ctx.lineTo(b.sx,b.sy);ctx.stroke();
        const c2=iso(gx,gz+i),d=iso(gx+s,gz+i);
        ctx.beginPath();ctx.moveTo(c2.sx,c2.sy);ctx.lineTo(d.sx,d.sy);ctx.stroke();
    }
    ctx.restore();

    // Walls
    ctx.save(); ctx.globalAlpha=dark?0.42:0.5;
    const wH=isMission?1.3:1.1;
    poly([iso(gx,gz),iso(gx,gz+s),iso(gx,gz+s,wH),iso(gx,gz,wH)],wc,ha(accent,dark?0.25:0.18),0.6);
    poly([iso(gx,gz),iso(gx+s,gz),iso(gx+s,gz,wH),iso(gx,gz,wH)],dark?lt(wc,4):dk(wc,5),ha(accent,dark?0.2:0.14),0.6);
    ctx.restore();

    // Accent border glow
    ctx.save();
    ctx.strokeStyle=border; ctx.lineWidth=lw;
    if(dark){ctx.shadowColor=border; ctx.shadowBlur=isMission?14:8;}
    ctx.globalAlpha=dark?0.75:0.55;
    const fp=floorPoly(gx,gz,s);
    ctx.beginPath(); ctx.moveTo(fp[0].sx,fp[0].sy);
    fp.forEach(p=>ctx.lineTo(p.sx,p.sy)); ctx.closePath(); ctx.stroke();
    ctx.restore();

    // Corner dots
    fp.slice(2).forEach(p=>{
        ctx.save(); ctx.fillStyle=border; ctx.globalAlpha=dark?0.85:0.55;
        if(dark){ctx.shadowColor=border;ctx.shadowBlur=5;}
        ctx.beginPath(); ctx.arc(p.sx,p.sy,1.8,0,Math.PI*2); ctx.fill();
        ctx.restore();
    });

    // Furniture
    if(key==='unidreamity') drawUnidreamityFurn(r,pal);
    if(key==='devlab')      drawDevLabFurn(r,pal);
    if(key==='mission')     drawMissionFurn(r,pal);
    if(key==='study')       drawStudyFurn(r,pal);
    if(key==='research')    drawResearchFurn(r,pal);
    if(key==='gym')         drawGymFurn(r,pal);

    // Label pill
    const ctr=iso(gx+s/2,gz+s*0.86);
    ctx.save();
    const fs=Math.max(9.5,11.5*camScale);
    ctx.font=`600 ${fs}px 'Inter',sans-serif`; ctx.textAlign='center';
    const tw=ctx.measureText(icon+' '+label).width+14*camScale;
    const th2=fs+7*camScale;
    ctx.fillStyle=pal.labelBg;
    ctx.beginPath(); ctx.roundRect(ctr.sx-tw/2,ctr.sy-th2+2,tw,th2,th2/2); ctx.fill();
    ctx.fillStyle=lc;
    if(dark){ctx.shadowColor=lc;ctx.shadowBlur=8;}
    ctx.fillText(icon+' '+label,ctr.sx,ctr.sy);
    ctx.restore();
}

// ============================================================
//  FURNITURE DRAWING
// ============================================================
function drawUnidreamityFurn(r,pal){
    const {gx,gz}=r, f=pal.furniture, dark=isDark();
    isoBox(gx+0.5,gz+0.8,3.8,1.8,0.1,f.desk,f.deskDark,dk(f.deskDark,20));
    [[0.7,0.6],[1.8,0.6],[2.9,0.6],[0.7,2.7],[1.8,2.7],[2.9,2.7]].forEach(([ox,oz])=>{
        isoBox(gx+ox,gz+oz,0.55,0.45,0.05,dark?'#374151':'#e2e8f0',dark?'#1f2937':'#cbd5e1',dark?'#111827':'#b0bec5');
    });
    isoBox(gx+0.4,gz+0.08,3.5,0.06,0.9,dark?'#1e293b':'#f1f5f9',dark?'#0f172a':'#e2e8f0',dark?'#1e293b':'#e2e8f0');
    const sc=iso(gx+2.15,gz+0.1,0.55);
    ctx.save(); if(dark){ctx.shadowColor='#f59e0b';ctx.shadowBlur=16;}
    ctx.fillStyle=dark?'#92400e':'#fef3c7'; ctx.globalAlpha=dark?0.85:0.7;
    const ms=15*camScale; ctx.fillRect(sc.sx-ms,sc.sy-ms*0.6,ms*2,ms*1.2);
    ctx.globalAlpha=dark?0.4:0.35; ctx.fillStyle=dark?'#f59e0b':'#b45309';
    [0.2,0.45,0.7].forEach(yo=>ctx.fillRect(sc.sx-ms*0.75,sc.sy-ms*0.3+yo*ms,ms*0.9,ms*0.1));
    ctx.restore();
    isoBox(gx+4.0,gz+0.2,0.55,0.55,0.3,dark?'#5d4037':'#8b7355',dark?'#3e2723':'#6b5535',dark?'#4e342e':'#7a6040');
    isoBox(gx+4.02,gz+0.22,0.5,0.5,0.2,f.plant,f.plantDark,dk(f.plant,15),0.3);
}

function drawDevLabFurn(r,pal){
    const {gx,gz}=r, f=pal.furniture, dark=isDark();
    [[0.3,0.2],[0.3,2.2]].forEach(([ox,oz],di)=>{
        isoBox(gx+ox,gz+oz,4.0,0.85,0.1,f.desk,f.deskDark,dk(f.deskDark,20));
        [0.3,1.5,2.7].forEach((mx,mi)=>{
            isoBox(gx+ox+mx,gz+oz+0.08,0.9,0.07,0.48,dark?'#1e1e2e':'#d1d5db',dark?'#0f0f1a':'#9ca3af',dark?'#141422':'#b0b8c1',0.48);
            const mp=iso(gx+ox+mx+0.45,gz+oz+0.1,0.72);
            ctx.save(); if(dark){ctx.shadowColor=f.screen;ctx.shadowBlur=16;}
            ctx.fillStyle=dark?f.screen:'#3b82f6'; ctx.globalAlpha=dark?0.9:0.7;
            const ms=8*camScale; ctx.fillRect(mp.sx-ms,mp.sy-ms*0.6,ms*2,ms*1.2);
            const colors=['#22c55e','#f59e0b','#ef4444'];
            ctx.globalAlpha=dark?0.5:0.4; ctx.fillStyle=colors[mi%3];
            ctx.fillRect(mp.sx-ms*0.7,mp.sy-ms*0.1,ms*0.5,ms*0.5);
            ctx.restore();
        });
        isoBox(gx+ox+0.2,gz+oz+0.6,3.4,0.2,0.04,dark?'#222':'#d1d5db',dark?'#111':'#9ca3af',dark?'#1a1a1a':'#b0bec5',0.1);
    });
    isoBox(gx+3.8,gz+0.15,0.9,1.0,1.8,dark?'#1e293b':'#c8cdd6',dark?'#0f172a':'#a0a8b4',dark?'#0d1520':'#b0b8c4');
    for(let u=0;u<7;u++){
        isoBox(gx+3.82,gz+0.17,0.85,0.94,0.2,dark?'#222230':'#dde1e8',dark?'#161620':'#cdd2da',dark?'#1c1c28':'#d5d9e0',0.24+u*0.24);
        const bl=iso(gx+3.86,gz+0.2,0.35+u*0.24);
        const on=(tick+u*12)%30<15;
        const col=u%3===0?'#22c55e':u%3===1?'#f59e0b':'#ef4444';
        ctx.save(); ctx.fillStyle=on?col:dk(col,40);
        if(dark&&on){ctx.shadowColor=col;ctx.shadowBlur=6;}
        ctx.fillRect(bl.sx-3,bl.sy-3,5,5); ctx.restore();
    }
}

function drawMissionFurn(r,pal){
    const {gx,gz}=r, f=pal.furniture, dark=isDark();
    isoBox(gx+0.3,gz+0.3,3.6,3.6,0.08,dark?'#1a0808':'#ffe4e4',dark?'#110505':'#fecaca',dark?'#150606':'#fbd5d5');
    isoBox(gx+0.7,gz+0.7,2.8,2.4,0.14,dark?'#2d0808':'#fecaca',dark?'#1e0505':'#fca5a5',dark?'#250606':'#f87171');
    const centre=iso(gx+2.1,gz+1.9,0.25);
    ctx.save();
    if(dark){ctx.shadowColor='#dc2626';ctx.shadowBlur=28*camScale;}
    ctx.globalAlpha=dark?0.3:0.12; ctx.fillStyle='#dc2626';
    ctx.beginPath();ctx.ellipse(centre.sx,centre.sy,20*camScale,9*camScale,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=dark?0.75:0.55; ctx.strokeStyle='#dc2626'; ctx.lineWidth=dark?1.5:1.0;
    [7,12,18].forEach(r2=>{
        ctx.beginPath();ctx.ellipse(centre.sx,centre.sy,r2*camScale,r2*0.44*camScale,0,0,Math.PI*2);
        ctx.globalAlpha=(dark?0.55:0.28)*(1-r2/22);ctx.stroke();
    });
    ctx.restore();
    [[0.25,0.06,1.85,0.06,0.9],[2.2,0.06,1.7,0.06,0.9]].forEach(([ox,oz,bw,bd,bh])=>{
        isoBox(gx+ox,gz+oz,bw,bd,bh,dark?'#1e1e2e':'#f1f5f9',dark?'#0f0f1a':'#e2e8f0',dark?'#1e1e2e':'#e2e8f0');
        const mp=iso(gx+ox+bw/2,gz+oz+0.07,bh*0.55);
        ctx.save(); if(dark){ctx.shadowColor='#dc2626';ctx.shadowBlur=16;}
        ctx.fillStyle=dark?'#7f1d1d':'#ef4444'; ctx.globalAlpha=dark?0.85:0.6;
        const ms=bw*6*camScale; ctx.fillRect(mp.sx-ms,mp.sy-ms*0.52,ms*2,ms*1.05);
        ctx.globalAlpha=dark?0.3:0.28; ctx.fillStyle=dark?'#fca5a5':'#fff';
        [0.12,0.38,0.62,0.82].forEach(yo=>ctx.fillRect(mp.sx-ms*0.75,mp.sy-ms*0.32+yo*ms,ms*(0.5+Math.random()*0.35),ms*0.08));
        ctx.restore();
    });
    isoBox(gx+1.6,gz+3.3,1.2,0.15,0.62,dark?'#7f1d1d':'#ef4444',dark?'#450a0a':'#b91c1c',dark?'#5c0f0f':'#dc2626');
    isoBox(gx+1.6,gz+3.3,1.2,0.65,0.16,dark?'#7f1d1d':'#ef4444',dark?'#450a0a':'#b91c1c',dark?'#5c0f0f':'#dc2626');
}

function drawStudyFurn(r,pal){
    const {gx,gz}=r, f=pal.furniture, dark=isDark();
    isoBox(gx+0.15,gz+0.08,3.9,0.35,1.4,dark?'#1e293b':'#e2e8f0',dark?'#0f172a':'#cbd5e1',dark?'#0d1520':'#b0bec5');
    const bookCols=dark?['#1e3a5f','#3b1f63','#0f4c2a','#5c2c08','#4a0e0e']:['#dbeafe','#ede9fe','#dcfce7','#fef3c7','#fee2e2'];
    for(let i=0;i<14;i++){
        const bx=gx+0.25+i*0.3, bz=gz+0.1, bw=0.22, bh=0.7+Math.random()*0.4;
        isoBox(bx,bz,bw,0.28,bh,bookCols[i%5],dk(bookCols[i%5],20),dk(bookCols[i%5],35),0.1);
    }
    isoBox(gx+0.4,gz+1.8,3.8,0.9,0.1,f.desk,f.deskDark,dk(f.deskDark,20));
    isoBox(gx+1.2,gz+1.86,1.0,0.07,0.5,dark?'#1e1e2e':'#d1d5db',dark?'#0f0f1a':'#9ca3af',dark?'#141422':'#b0b8c1',0.48);
    const mp=iso(gx+1.7,gz+1.88,0.73);
    ctx.save(); if(dark){ctx.shadowColor='#0ea5e9';ctx.shadowBlur=16;}
    ctx.fillStyle=dark?'#0c4a6e':'#0ea5e9'; ctx.globalAlpha=dark?0.9:0.7;
    const ms=8*camScale; ctx.fillRect(mp.sx-ms,mp.sy-ms*0.6,ms*2,ms*1.2);
    ctx.restore();
    isoBox(gx+2.5,gz+2.0,1.2,0.7,0.03,dark?'#f8fafc':'#fff',dark?'#e2e8f0':'#f1f5f9',dark?'#e2e8f0':'#e8edf2',0.1);
    ctx.save(); ctx.globalAlpha=dark?0.2:0.18; ctx.strokeStyle=dark?'#0ea5e9':'#0369a1'; ctx.lineWidth=1;
    [0.15,0.3,0.45].forEach(yo=>{
        const l=iso(gx+2.55,gz+2.05+yo,0.15), r2=iso(gx+3.65,gz+2.05+yo,0.15);
        ctx.beginPath();ctx.moveTo(l.sx,l.sy);ctx.lineTo(r2.sx,r2.sy);ctx.stroke();
    });
    ctx.restore();
    isoBox(gx+0.8,gz+2.85,1.0,0.15,0.5,dark?'#0c4a6e':'#0ea5e9',dark?'#082f49':'#0284c7',dark?'#0a3d5e':'#0369a1');
    isoBox(gx+0.8,gz+2.85,1.0,0.65,0.14,dark?'#0c4a6e':'#0ea5e9',dark?'#082f49':'#0284c7',dark?'#0a3d5e':'#0369a1');
}

function drawResearchFurn(r,pal){
    const {gx,gz}=r, f=pal.furniture, dark=isDark();
    isoBox(gx+0.2,gz+0.08,3.8,0.06,1.2,dark?'#0a1628':'#e0f2fe',dark?'#051020':'#bae6fd',dark?'#0d1e32':'#bae6fd');
    const mp=iso(gx+2.35,gz+0.1,0.65);
    ctx.save(); ctx.globalAlpha=dark?0.6:0.5;
    ctx.fillStyle=dark?'#1d4ed8':'#3b82f6';
    [[-14,-2,10,5],[0,0,8,4],[8,-3,6,4],[-4,4,6,3],[10,2,5,3]].forEach(([dx,dy,rw,rh])=>{
        ctx.beginPath();ctx.ellipse(mp.sx+dx*camScale,mp.sy+dy*camScale,rw*camScale,rh*camScale,0,0,Math.PI*2);ctx.fill();
    });
    ctx.fillStyle=dark?'#ef4444':'#dc2626';
    [[-10,2],[5,-1],[12,3]].forEach(([dx,dy])=>{
        ctx.beginPath();ctx.arc(mp.sx+dx*camScale,mp.sy+dy*camScale,1.5*camScale,0,Math.PI*2);ctx.fill();
    });
    ctx.restore();
    isoBox(gx+0.4,gz+1.8,3.6,0.9,0.1,f.desk,f.deskDark,dk(f.deskDark,20));
    [0.5,2.2].forEach(ox=>{
        isoBox(gx+ox,gz+1.86,1.0,0.07,0.5,dark?'#1e1e2e':'#d1d5db',dark?'#0f0f1a':'#9ca3af',dark?'#141422':'#b0b8c1',0.48);
        const mp2=iso(gx+ox+0.5,gz+1.88,0.73);
        ctx.save(); if(dark){ctx.shadowColor='#22c55e';ctx.shadowBlur=14;}
        ctx.fillStyle=dark?'#052e16':'#22c55e'; ctx.globalAlpha=dark?0.9:0.7;
        const ms=8*camScale; ctx.fillRect(mp2.sx-ms,mp2.sy-ms*0.6,ms*2,ms*1.2);
        ctx.globalAlpha=dark?0.5:0.4; ctx.strokeStyle=dark?'#4ade80':'#166534'; ctx.lineWidth=1;
        const pts=[[-ms*0.8,ms*0.2],[-ms*0.4,-ms*0.1],[0,ms*0.1],[ms*0.3,-ms*0.25],[ms*0.7,ms*0.05]];
        ctx.beginPath(); pts.forEach(([px,py],i)=>{ if(i)ctx.lineTo(mp2.sx+px,mp2.sy+py); else ctx.moveTo(mp2.sx+px,mp2.sy+py); }); ctx.stroke();
        ctx.restore();
    });
    const noteColors=dark?['#854d0e','#166534','#1e3a5f']:['#fef08a','#bbf7d0','#bae6fd'];
    [[3.6,2.0],[3.85,2.0],[3.6,2.35]].forEach(([ox,oz],i)=>{
        isoBox(gx+ox,gz+oz,0.28,0.25,0.02,noteColors[i],dk(noteColors[i],15),dk(noteColors[i],25),0.1);
    });
    isoBox(gx+1.2,gz+2.85,1.0,0.15,0.5,dark?'#052e16':'#22c55e',dark?'#021d0d':'#16a34a',dark?'#031a0c':'#15803d');
    isoBox(gx+1.2,gz+2.85,1.0,0.65,0.14,dark?'#052e16':'#22c55e',dark?'#021d0d':'#16a34a',dark?'#031a0c':'#15803d');
}

function drawGymFurn(r,pal){
    const {gx,gz}=r, f=pal.furniture, dark=isDark();
    ctx.save(); ctx.globalAlpha=dark?0.15:0.18;
    poly([iso(gx+0.2,gz+0.2),iso(gx+4.7,gz+0.2),iso(gx+4.7,gz+2.8),iso(gx+0.2,gz+2.8)],dark?'#1a0808':'#fecaca',null);
    ctx.restore();
    isoBox(gx+0.4,gz+0.4,2.0,0.5,0.12,f.metal,f.metalDark,dk(f.metalDark,15));
    isoBox(gx+0.45,gz+0.41,1.9,0.12,0.3,dark?'#374151':'#e5e7eb',dk(dark?'#374151':'#e5e7eb',20),dk(dark?'#374151':'#e5e7eb',35));
    isoBox(gx+0.55,gz+0.43,1.6,0.1,0.14,dark?'#1e293b':'#e2e8f0',dark?'#0f172a':'#cbd5e1',dark?'#141e2a':'#b0bec5',0.28);
    isoBox(gx+0.12,gz+0.48,0.35,0.13,0.13,'#dc2626',dk('#dc2626',30),dk('#dc2626',50),0.38);
    isoBox(gx+2.3,gz+0.48,0.35,0.13,0.13,'#dc2626',dk('#dc2626',30),dk('#dc2626',50),0.38);
    isoBox(gx+0.47,gz+0.51,1.93,0.05,0.05,dark?'#6b7280':'#9ca3af',dark?'#374151':'#6b7280',dark?'#4b5563':'#9ca3af',0.42);
    isoBox(gx+0.4,gz+0.42,0.1,0.1,0.52,f.metal,f.metalDark,dk(f.metalDark,15));
    isoBox(gx+2.38,gz+0.42,0.1,0.1,0.52,f.metal,f.metalDark,dk(f.metalDark,15));
    isoBox(gx+3.0,gz+0.3,1.6,2.0,0.08,f.metal,f.metalDark,dk(f.metalDark,15));
    isoBox(gx+3.02,gz+0.32,1.56,1.96,0.06,dark?'#1e293b':'#dde1e8',dark?'#0f172a':'#c8cdd6',dark?'#141e2a':'#d0d4db',0.08);
    isoBox(gx+3.02,gz+0.32,1.56,0.18,0.5,dark?'#0f172a':'#b0b8c4',dark?'#080f1a':'#9ca3af',dark?'#0d1520':'#a8b0bc');
    const sc=iso(gx+3.8,gz+0.38,0.6);
    ctx.save(); if(dark){ctx.shadowColor='#3b82f6';ctx.shadowBlur=14;}
    ctx.fillStyle=dark?'#1e3a8a':'#3b82f6'; ctx.globalAlpha=dark?0.9:0.7;
    const ms=7*camScale; ctx.fillRect(sc.sx-ms,sc.sy-ms*0.6,ms*2,ms*1.2); ctx.restore();
    isoBox(gx+0.3,gz+3.2,2.8,0.5,0.5,f.metal,f.metalDark,dk(f.metalDark,15));
    [['#dc2626',0.4],['#f59e0b',1.2],['#22c55e',2.0]].forEach(([col,ox])=>{
        isoBox(gx+0.4+ox,gz+3.3,0.55,0.3,0.38,col,dk(col,30),dk(col,50),0.5);
    });
}

// ============================================================
//  AGENT DRAWING
// ============================================================
function drawAgent(id,sx,sy,phase){
    const agent=AGENTS[id], st=agent.status, col=agent.hex;
    const isFri=id==='friday';
    const sc=camScale*(isFri?2.1:1.5);
    const pal=P(), dark=isDark();

    const bob = st==='training'?Math.abs(Math.sin(phase*3.0))*6*sc:
                 st==='working' ?Math.sin(phase*1.5)*2.5*sc:Math.sin(phase*0.85)*2.8*sc;
    const ay=sy-bob;

    // Shadow
    ctx.save(); ctx.globalAlpha=dark?0.28:0.1;
    ctx.fillStyle=dark?'#000':'#606070';
    ctx.beginPath(); ctx.ellipse(sx,sy+2*sc,11*sc,4.5*sc,0,0,Math.PI*2); ctx.fill();
    ctx.restore();

    // Legs
    ctx.save(); ctx.fillStyle=dk(col,dark?55:40); ctx.globalAlpha=dark?0.9:0.85;
    if(st==='training'){
        const lp=Math.sin(phase*3.0);
        ctx.save();ctx.translate(sx-3.5*sc,ay-2*sc);ctx.rotate(lp*0.3);
        ctx.beginPath();ctx.roundRect(-2*sc,0,4*sc,10*sc,2*sc);ctx.fill();ctx.restore();
        ctx.save();ctx.translate(sx+3.5*sc,ay-2*sc);ctx.rotate(-lp*0.3);
        ctx.beginPath();ctx.roundRect(-2*sc,0,4*sc,10*sc,2*sc);ctx.fill();ctx.restore();
    } else {
        ctx.beginPath();ctx.roundRect(sx-5.5*sc,ay-2*sc,3.8*sc,10*sc,2*sc);ctx.fill();
        ctx.beginPath();ctx.roundRect(sx+1.7*sc,ay-2*sc,3.8*sc,10*sc,2*sc);ctx.fill();
    }
    ctx.restore();

    // Body
    const g1=ctx.createLinearGradient(sx-8*sc,ay-24*sc,sx+8*sc,ay-8*sc);
    g1.addColorStop(0,dark?lt(col,20):col); g1.addColorStop(1,dark?dk(col,40):dk(col,30));
    ctx.save(); ctx.fillStyle=g1;
    ctx.beginPath(); ctx.roundRect(sx-8*sc,ay-23*sc,16*sc,15*sc,4*sc); ctx.fill();
    ctx.globalAlpha=dark?0.14:0.22; ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.roundRect(sx-7*sc,ay-23*sc,14*sc,4*sc,[4*sc,4*sc,0,0]); ctx.fill();
    ctx.restore();

    // Arms
    ctx.save(); ctx.fillStyle=col; ctx.globalAlpha=dark?0.85:0.78;
    if(st==='training'){
        const ap=Math.abs(Math.sin(phase*3.0));
        [[-1,1],[1,-1]].forEach(([s2,flip],i)=>{
            const ax=sx+s2*8*sc, ay2=ay-18*sc;
            ctx.save();ctx.translate(ax,ay2);ctx.rotate(flip*ap*1.1);
            ctx.beginPath();ctx.roundRect(-2*sc,-8*sc*ap,4*sc,8*sc+1,2*sc);ctx.fill();ctx.restore();
        });
        ctx.fillStyle=dark?'#555':'#888';
        ctx.beginPath();ctx.roundRect(sx-15*sc,ay-18*sc-ap*8*sc-3*sc,9*sc,4.5*sc,2*sc);ctx.fill();
        ctx.beginPath();ctx.roundRect(sx+6*sc,ay-18*sc-ap*8*sc-3*sc,9*sc,4.5*sc,2*sc);ctx.fill();
        ctx.fillStyle='#dc2626';
        ctx.beginPath();ctx.roundRect(sx-17*sc,ay-18*sc-ap*8*sc-4*sc,3*sc,7*sc,1*sc);ctx.fill();
        ctx.beginPath();ctx.roundRect(sx+14*sc,ay-18*sc-ap*8*sc-4*sc,3*sc,7*sc,1*sc);ctx.fill();
    } else if(st==='working'){
        const tp=Math.sin(phase*2.5);
        ctx.beginPath();ctx.roundRect(sx-13*sc,ay-18*sc+tp*2*sc,3.8*sc,8*sc,2*sc);ctx.fill();
        ctx.beginPath();ctx.roundRect(sx+9*sc,ay-18*sc-tp*2*sc,3.8*sc,8*sc,2*sc);ctx.fill();
    } else {
        ctx.beginPath();ctx.roundRect(sx-13*sc,ay-18*sc,3.8*sc,8*sc,2*sc);ctx.fill();
        ctx.beginPath();ctx.roundRect(sx+9*sc,ay-18*sc,3.8*sc,8*sc,2*sc);ctx.fill();
    }
    ctx.restore();

    // Head
    const hg=ctx.createLinearGradient(sx-6*sc,ay-34*sc,sx+6*sc,ay-23*sc);
    hg.addColorStop(0,'#f8d5b4'); hg.addColorStop(1,'#e8bc90');
    ctx.save(); ctx.fillStyle=hg;
    ctx.beginPath(); ctx.roundRect(sx-6*sc,ay-34*sc,12*sc,12*sc,3.5*sc); ctx.fill();
    ctx.fillStyle=col;
    ctx.beginPath(); ctx.roundRect(sx-6*sc,ay-35.8*sc,12*sc,4.5*sc,[3.5*sc,3.5*sc,0,0]); ctx.fill();
    const blink=Math.sin(phase*0.55)>0.93;
    ctx.fillStyle=dark?'#1a1a2e':'#2a2a3e';
    if(!blink){
        ctx.beginPath();ctx.roundRect(sx-4*sc,ay-30.5*sc,2.5*sc,2.5*sc,0.8*sc);ctx.fill();
        ctx.beginPath();ctx.roundRect(sx+1.5*sc,ay-30.5*sc,2.5*sc,2.5*sc,0.8*sc);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.65)';
        ctx.beginPath();ctx.arc(sx-3.2*sc,ay-31*sc,0.7*sc,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(sx+2.3*sc,ay-31*sc,0.7*sc,0,Math.PI*2);ctx.fill();
    } else {
        ctx.globalAlpha=0.7;ctx.strokeStyle=dark?'#1a1a2e':'#2a2a3e';ctx.lineWidth=sc;
        ctx.beginPath();ctx.moveTo(sx-4*sc,ay-29.5*sc);ctx.lineTo(sx-1.5*sc,ay-29.5*sc);ctx.stroke();
        ctx.beginPath();ctx.moveTo(sx+1.5*sc,ay-29.5*sc);ctx.lineTo(sx+4*sc,ay-29.5*sc);ctx.stroke();
    }
    ctx.globalAlpha=0.22;ctx.strokeStyle='rgba(0,0,0,0.4)';ctx.lineWidth=0.8*sc;
    ctx.beginPath();ctx.arc(sx,ay-27*sc,2*sc,0.1,Math.PI-0.1);ctx.stroke();
    ctx.restore();

    // Status dot
    const dc=STATUS_COLOR[st];
    ctx.save(); ctx.fillStyle=dc;
    if(dark){ctx.shadowColor=dc;ctx.shadowBlur=10*sc;}
    ctx.beginPath();ctx.arc(sx+7.5*sc,ay-34.5*sc,2.8*sc,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=0.35;ctx.strokeStyle=dc;ctx.lineWidth=sc;
    ctx.beginPath();ctx.arc(sx+7.5*sc,ay-34.5*sc,5*sc,0,Math.PI*2);ctx.stroke();
    ctx.restore();
    if(st==='training'&&tick%7===0&&dark) spawnP(sx+7.5*sc,ay-34.5*sc,dc,'spark');
    if(st==='working'){
        const pr=(tick%55)/55;
        ctx.save();ctx.strokeStyle=dc;ctx.lineWidth=0.8*sc;
        ctx.globalAlpha=(1-pr)*(dark?0.35:0.18);
        ctx.beginPath();ctx.arc(sx+7.5*sc,ay-34.5*sc,(2.8+pr*13)*sc,0,Math.PI*2);ctx.stroke();
        ctx.restore();
    }

    // Crown (Friday only)
    if(isFri){
        const cy=ay-42*sc, cw=12*sc, ch=8*sc;
        ctx.save(); ctx.fillStyle='#f59e0b';
        if(dark){ctx.shadowColor='#fbbf24';ctx.shadowBlur=14*sc;}
        ctx.beginPath();
        ctx.moveTo(sx-cw/2,cy+ch*0.3);ctx.lineTo(sx-cw/2,cy-ch);
        ctx.lineTo(sx-cw/4,cy-ch*0.4);ctx.lineTo(sx,cy-ch*0.95);
        ctx.lineTo(sx+cw/4,cy-ch*0.4);ctx.lineTo(sx+cw/2,cy-ch);
        ctx.lineTo(sx+cw/2,cy+ch*0.3);ctx.closePath();ctx.fill();
        ctx.fillRect(sx-cw/2,cy+ch*0.15,cw,ch*0.18);
        [[sx,'#dc2626',cy-ch*0.9],[sx-cw/2+2*sc,'#60a5fa',cy],[sx+cw/2-2*sc,'#60a5fa',cy]].forEach(([jx,jc,jy])=>{
            ctx.fillStyle=jc;if(dark){ctx.shadowColor=jc;ctx.shadowBlur=6;}
            ctx.beginPath();ctx.arc(jx,jy,1.8*sc,0,Math.PI*2);ctx.fill();
        });
        ctx.restore();
    }

    // Name tag
    const nfs=Math.max(6.5,8*sc);
    ctx.save();ctx.font=`600 ${nfs}px 'Inter',sans-serif`;ctx.textAlign='center';
    const ntw=ctx.measureText(agent.name).width+11*sc;
    ctx.fillStyle=pal.agentNameBg;
    ctx.beginPath();ctx.roundRect(sx-ntw/2,ay-49*sc,ntw,14*sc,7*sc);ctx.fill();
    ctx.fillStyle=pal.agentNameFg;ctx.fillText(agent.name,sx,ay-39.5*sc);
    ctx.restore();

    // Task bubble
    if(st!=='idle'){
        const tfs=Math.max(5.5,6.5*sc);
        ctx.save();ctx.font=`${tfs}px 'Inter',sans-serif`;ctx.textAlign='center';
        const task=agent.task.length>22?agent.task.slice(0,21)+'…':agent.task;
        const tbw=Math.min(ctx.measureText(task).width+11*sc,88*sc);
        ctx.fillStyle=pal.taskBg;
        ctx.beginPath();ctx.roundRect(sx-tbw/2,ay-64*sc,tbw,12*sc,3.5*sc);ctx.fill();
        ctx.fillStyle=ha(col,dark?0.9:0.8);
        ctx.save();ctx.rect(sx-44*sc,ay-66*sc,88*sc,15*sc);ctx.clip();
        ctx.fillText(task,sx,ay-55*sc);ctx.restore();ctx.restore();
    }

    // Hover ring
    if(hoverId===id){
        ctx.save();ctx.strokeStyle=col;ctx.lineWidth=2*sc;
        ctx.globalAlpha=0.5+0.25*Math.sin(tick*0.13);
        if(dark){ctx.shadowColor=col;ctx.shadowBlur=12;}
        ctx.beginPath();ctx.ellipse(sx,sy+2*sc,15*sc,6.5*sc,0,0,Math.PI*2);ctx.stroke();
        ctx.restore();
    }
}

// ============================================================
//  RENDER LOOP
// ============================================================
function render(){
    if(!ctx||!W||!H) return;
    tick++;
    const dark=isDark(), pal=P();

    Object.keys(AGENTS).forEach(id=>{
        const tgt=getSlot(id);
        const prev=agentPos[id]||{sx:tgt.sx,sy:tgt.sy};
        if(!agentPos[id]) agentPos[id]={sx:tgt.sx,sy:tgt.sy};
        agentPos[id].sx+=(tgt.sx-agentPos[id].sx)*0.065;
        agentPos[id].sy+=(tgt.sy-agentPos[id].sy)*0.065;
        agentPhase[id]=(agentPhase[id]||0)+0.032;
        const spd=Math.hypot(agentPos[id].sx-prev.sx,agentPos[id].sy-prev.sy);
        if(spd>1.8&&dark&&Math.random()>0.65) spawnP(agentPos[id].sx,agentPos[id].sy,AGENTS[id].hex,'dust');
    });
    updateParts(); updateTrails();

    // Background
    const bgGrad=ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0,dark?'#141418':'#f8f8fa');
    bgGrad.addColorStop(1,dark?'#0a0a0d':'#eeeef2');
    ctx.fillStyle=bgGrad;ctx.fillRect(0,0,W,H);

    if(dark){
        ctx.save();ctx.globalAlpha=0.012;
        for(let y=0;y<H;y+=3){ctx.fillStyle='#fff';ctx.fillRect(0,y,W,1);}
        ctx.restore();
        Object.entries(ROOMS).forEach(([k,r])=>{
            const cpt=iso(r.gx+r.size/2,r.gz+r.size/2,0);
            const rg=ctx.createRadialGradient(cpt.sx,cpt.sy,0,cpt.sx,cpt.sy,150*camScale);
            rg.addColorStop(0,ha(r.accent,0.05));rg.addColorStop(1,'transparent');
            ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
        });
    }

    drawTrails();

    Object.entries(ROOMS)
        .sort((a,b)=>iso(a[1].gx+a[1].size/2,a[1].gz+a[1].size/2).sy-iso(b[1].gx+b[1].size/2,b[1].gz+b[1].size/2).sy)
        .forEach(([k,r])=>drawRoom(k,r));

    drawParts();

    Object.keys(AGENTS)
        .sort((a,b)=>{
            if(a==='friday')return 1;if(b==='friday')return -1;
            return (agentPos[a]||{sy:0}).sy-(agentPos[b]||{sy:0}).sy;
        })
        .forEach(id=>{const p=agentPos[id];if(p)drawAgent(id,p.sx,p.sy,agentPhase[id]||0);});

    if(dark){
        const vig=ctx.createRadialGradient(W/2,H/2,H*0.25,W/2,H/2,H*0.95);
        vig.addColorStop(0,'transparent');vig.addColorStop(1,'rgba(0,0,0,0.5)');
        ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
    }
}

function loop(){render();raf=requestAnimationFrame(loop);}

function hitTest(mx,my){
    const sorted=Object.keys(agentPos).sort((a,b)=>(agentPos[b]||{sy:0}).sy-(agentPos[a]||{sy:0}).sy);
    for(const id of sorted){
        const p=agentPos[id]||{sx:0,sy:0};
        const r=14*camScale*(id==='friday'?2.1:1.5);
        if(Math.abs(mx-p.sx)<r&&Math.abs(my-p.sy)<r*2.2) return id;
    }
    return null;
}

function resize(){
    const wrap=document.getElementById('office-canvas-wrap');if(!wrap)return;
    const nW=wrap.clientWidth,nH=wrap.clientHeight;if(!nW||!nH)return;
    W=nW;H=nH;dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=W*dpr;canvas.height=H*dpr;
    canvas.style.width=W+'px';canvas.style.height=H+'px';
    ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
    Object.keys(AGENTS).forEach(id=>{agentPos[id]=null;});
}

function bindInput(){
    canvas.addEventListener('mousedown',e=>{dragMode='orbit';lastMX=e.clientX;canvas.style.cursor='grabbing';});
    window.addEventListener('mouseup',()=>{dragMode=null;canvas.style.cursor=hoverId?'pointer':'grab';});
    window.addEventListener('mousemove',e=>{
        if(dragMode==='orbit'){camTheta-=(e.clientX-lastMX)*0.006;lastMX=e.clientX;}
        else{
            const rect=canvas.getBoundingClientRect();
            const h=hitTest(e.clientX-rect.left,e.clientY-rect.top);
            hoverId=h;canvas.style.cursor=h?'pointer':'grab';
            if(h){showTooltip(h,agentPos[h].sx,agentPos[h].sy);}
            else{const tt=document.getElementById('agent-tooltip');if(tt)tt.style.display='none';}
        }
    });
    canvas.addEventListener('wheel',e=>{e.preventDefault();camScale=Math.max(0.4,Math.min(2.0,camScale-e.deltaY*0.001));},{passive:false});
    canvas.addEventListener('touchstart',e=>{
        if(e.touches.length===1){dragMode='orbit';lastMX=e.touches[0].clientX;}
        else if(e.touches.length===2){dragMode=null;pinchDist0=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);}
        e.preventDefault();
    },{passive:false});
    canvas.addEventListener('touchmove',e=>{
        if(e.touches.length===1&&dragMode==='orbit'){camTheta-=(e.touches[0].clientX-lastMX)*0.007;lastMX=e.touches[0].clientX;}
        else if(e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);camScale=Math.max(0.4,Math.min(2.0,camScale+(d-pinchDist0)*0.002));pinchDist0=d;}
        e.preventDefault();
    },{passive:false});
    canvas.addEventListener('touchend',()=>{dragMode=null;});
    canvas.style.cursor='grab';
}

function showTooltip(id,sx,sy){
    const agent=AGENTS[id];
    const tt=document.getElementById('agent-tooltip');if(!tt)return;
    const sc={idle:'#f59e0b',working:'#22c55e',training:'#dc2626'};
    const roomName={unidreamity:'Unidreamity HQ',devlab:'Dev Lab',mission:'Mission Control',study:'Study Room',research:'Research Hub',gym:'Gym'};
    document.getElementById('tt-name').textContent=agent.name;
    const tb=document.getElementById('tt-badge');
    tb.textContent=agent.status.toUpperCase()+' · '+roomName[AGENT_HOME[id]||'gym'];
    tb.style.color=sc[agent.status];
    document.getElementById('tt-task').textContent=agent.task;
    const bar=document.getElementById('tt-bar');
    bar.style.width=agent.progress+'%';bar.style.background=agent.hex;
    const wrap=canvas.getBoundingClientRect();
    let tx=sx+18,ty=sy-10;
    if(tx+200>wrap.width)tx=sx-215;if(ty+130>wrap.height)ty=sy-135;
    tt.style.left=tx+'px';tt.style.top=ty+'px';tt.style.display='block';
}

// ============================================================
//  UI FUNCTIONS
// ============================================================
function setAgentState(id,status,task,progress){
    const agent=AGENTS[id];if(!agent)return;
    agent.status=status||agent.status;
    if(task!==undefined)agent.task=task;
    if(progress!==undefined)agent.progress=progress;
    addLog(id,`→ ${status}${task?' · '+task:''}`);
    renderUI();
}

function addLog(id,action){
    const agent=AGENTS[id];
    const t=new Date().toLocaleTimeString('pt-PT',{timeZone:'Europe/Lisbon',hour:'2-digit',minute:'2-digit',second:'2-digit'});
    logs.unshift({name:agent.name,hex:agent.hex,action,time:t});
    logs=logs.slice(0,20);
}

function renderUI(){renderRoster();renderLocations();renderLog();renderStats();}

function renderRoster(){
    const el=document.getElementById('office-roster');if(!el)return;el.innerHTML='';
    const sc={idle:'#f59e0b',working:'#22c55e',training:'#dc2626'};
    Object.entries(AGENTS).forEach(([id,a])=>{
        const row=document.createElement('div');row.className='agent-row';
        row.innerHTML=`<div class="agent-av" style="background:linear-gradient(135deg,${a.hex},${dk(a.hex,55)})">${a.name[0]}</div>`+
            `<div class="agent-info"><div class="agent-name-txt">${a.name}</div>`+
            `<div class="agent-sub" style="color:${sc[a.status]}">${a.status} · ${a.task}</div></div>`+
            `<div class="agent-pbar"><div class="agent-pbar-fill" style="width:${a.progress}%;background:${a.hex}"></div></div>`;
        el.appendChild(row);
    });
}

function renderLocations(){
    const locs={unidreamity:[],devlab:[],mission:[],study:[],research:[],gym:[]};
    Object.entries(AGENTS).forEach(([id,a])=>{
        const rm=a.status==='training'&&id!=='friday'?'gym':AGENT_HOME[id];
        if(locs[rm])locs[rm].push(a.name);
    });
    const s=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v||'Empty';};
    s('loc-rest-new',locs.unidreamity.join(', ')||'—');
    s('loc-office-new',locs.devlab.join(', ')||'—');
    s('loc-gym-new',locs.gym.join(', ')||'—');
    s('loc-rest',locs.unidreamity.join(', ')||'—');
    s('loc-office',locs.devlab.join(', ')||'—');
    s('loc-gym',locs.gym.join(', ')||'—');
}

function renderLog(){
    const el=document.getElementById('office-log');if(!el)return;
    if(!logs.length){el.innerHTML='<span style="font-size:10px;color:var(--text-tertiary);font-style:italic;">Watching...</span>';return;}
    el.innerHTML=logs.slice(0,10).map(l=>`<div class="log-item"><span class="log-dot" style="background:${l.hex}"></span><span class="log-time">${l.time}</span><span class="log-txt"><span class="log-agent-name" style="color:${l.hex}">${l.name}</span> ${l.action}</span></div>`).join('');
}

function renderStats(){
    const vs=Object.values(AGENTS);
    const s=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
    s('hud-active',vs.filter(a=>a.status==='working').length+' WORKING');
    s('hud-standby',vs.filter(a=>a.status==='idle'||a.status==='standby').length+' IDLE');
    s('hud-training',vs.filter(a=>a.status==='training').length+' TRAINING');
}

// ============================================================
//  INITIALIZATION
// ============================================================
function init(){
    canvas=document.getElementById('office-canvas');if(!canvas)return;
    if(_inited){resize();return;}_inited=true;
    resize();
    if(typeof ResizeObserver!=='undefined') new ResizeObserver(()=>{if(!W||!H)resize();}).observe(document.getElementById('office-canvas-wrap'));
    window.addEventListener('resize',resize);
    bindInput();renderUI();
    cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
    if(_sim)clearInterval(_sim);_sim=setInterval(autoSim,7000);
}

function boot(){setTimeout(init,60);}

const SIMS=[
    {id:'scout', status:'working',  task:'Researching universities'},
    {id:'kdb',   status:'training', task:'Skills upgrade'},
    {id:'jarvis',status:'working',  task:'Planning Q2 strategy'},
    {id:'vision',status:'training', task:'Study session'},
    {id:'scout', status:'idle',     task:'Standing by'},
    {id:'kdb',   status:'working',  task:'Fixing WhatsApp 515'},
    {id:'jarvis',status:'training', task:'Leadership training'},
    {id:'vision',status:'working',  task:'Reviewing student docs'},
    {id:'scout', status:'training', task:'Research methods'},
];
let simIdx=0;
function autoSim(){
    const sc=SIMS[simIdx%SIMS.length];simIdx++;
    setAgentState(sc.id,sc.status,sc.task);
    Object.keys(AGENTS).forEach(id=>{if(Math.random()>0.6)AGENTS[id].progress=Math.min(100,AGENTS[id].progress+Math.floor(Math.random()*5));});
    renderUI();
}

// ============================================================
//  PUBLIC API
// ============================================================
window.FridayOffice={
    connect(url){
        if(!url)return;
        if(url.startsWith('ws')){
            const ws=new WebSocket(url);
            ws.onmessage=e=>this.dispatch(JSON.parse(e.data));
        }
    },
    dispatch(msg){if(!msg||!msg.type)return;},
    setAgentState,
    setProgress(id,pct){const a=AGENTS[id];if(a){a.progress=pct;renderUI();}},
    log(id,msg){addLog(id,msg);renderLog();},
    getState(){return JSON.parse(JSON.stringify(AGENTS));},
};

// Hook into navigation
const _nav=navigateTo;
navigateTo=function(page){_nav(page);if(page==='gym')boot();};

document.addEventListener('DOMContentLoaded',()=>{
    const gp=document.getElementById('page-gym');
    if(gp&&gp.classList.contains('active'))boot();
});

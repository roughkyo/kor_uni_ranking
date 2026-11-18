(() => {
  "use strict";
  const section=document.querySelector(".intro"), story=section.parentElement;
  const canvas=section.querySelector(".inkFigure"), typeCanvas=section.querySelector(".inkType");
  const ctx=canvas.getContext("2d"), type=typeCanvas.getContext("2d");
  const title=section.querySelector("h1"), year=document.getElementById("coverYear");
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
  let seed=776;
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  const tau=Math.PI*2;
  const path=t=>{
    const r=1+.38*Math.cos(3*t);
    return [r*Math.cos(2*t),r*Math.sin(2*t),.58*Math.sin(3*t)];
  };
  const unit=v=>{const n=Math.hypot(...v);return v.map(k=>k/n);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  // 매듭의 중심선을 따라 일정한 간격으로 단면을 두어 점열이 직조 무늬처럼 이어지게 한다.
  const dots=[];
  for(let i=0;i<414;i++){
    const t=tau*i/414,p=path(t),q=path(t+.0001);
    const tangent=unit(q.map((v,k)=>v-p[k])),a=unit(cross(tangent,[0,0,1])),b=cross(tangent,a);
    for(let j=0;j<80;j++){
      const phi=tau*j/80, normal=a.map((v,k)=>v*Math.cos(phi)+b[k]*Math.sin(phi));
      const [x,y,z]=p.map((v,k)=>v+.285*normal[k]);
      dots.push({x,y,z,nx:normal[0],ny:normal[1],nz:normal[2],
        red:t>1.28&&t<3.47,noise:random(),sx:(random()-.5),sy:(random()-.5),
        shade:.8+.2*random()});
    }
  }
  // 화면을 내릴 때 같은 점들을 가지 길이와 굵기에 비례해 재배치한다.
  const branches=[];let weight=0;
  function branch(x,y,angle,len,thick,depth,red){
    const bend=(random()-.5)*.5, ex=x+Math.cos(angle)*len,ey=y+Math.sin(angle)*len;
    weight+=len*thick;
    branches.push({x,y,ex,ey,bend,thick,red,end:weight});
    if(depth===0)return;
    const turn=.32+random()*.40;
    branch(ex,ey,angle-turn,len*(.63+random()*.13),thick*.66,depth-1,red&&depth%2===0);
    branch(ex,ey,angle+turn,len*(.63+random()*.16),thick*.70,depth-1,red&&depth%2===1);
  }
  branch(-.15,-1.43,1.45,.77,.053,8,true);
  for(const p of dots){
    const target=random()*weight;let l=0,r=branches.length-1;
    while(l<r){const mid=(l+r)>>1;if(branches[mid].end<target)l=mid+1;else r=mid;}
    const seg=branches[l],t=random(),dx=seg.ex-seg.x,dy=seg.ey-seg.y;
    const offset=Math.sin(t*Math.PI)*seg.bend+(random()-.5)*seg.thick/Math.hypot(dx,dy);
    p.tx=(seg.x+dx*t-dy*offset)*1.35;p.ty=seg.y+dy*t+dx*offset;p.tr=seg.red;
  }
  let width,height,scale,bitmap,words=[],typeRatio=1,shown=false,phase=0,scatter=0;
  let mouseX=-10000,mouseY=-10000,insideArt=false,insideText=false,burst=0,last=0,dirty=true;
  function resetType(){
    const em=title.querySelector("em");
    if(em && year.textContent!=="—" && em.textContent!==year.textContent)em.textContent=year.textContent;
    const bounds=section.getBoundingClientRect();
    const mask=document.createElement("canvas");
    mask.width=Math.ceil(bounds.width);mask.height=Math.ceil(bounds.height);
    const g=mask.getContext("2d",{willReadFrequently:true});
    function glyph(el,textNode){
      if(!textNode||!textNode.textContent.trim())return;
      const range=document.createRange();range.selectNodeContents(textNode);
      const rect=range.getBoundingClientRect(),style=getComputedStyle(el);
      g.font=style.fontStyle+" "+style.fontWeight+" "+style.fontSize+" "+style.fontFamily;
      g.letterSpacing=style.letterSpacing;
      const label=textNode.textContent,m=g.measureText(label);
      const ascent=m.fontBoundingBoxAscent??m.actualBoundingBoxAscent;
      const descent=m.fontBoundingBoxDescent??m.actualBoundingBoxDescent;
      g.save();g.translate(rect.left-bounds.left,rect.top-bounds.top+(rect.height-ascent-descent)/2+ascent);
      g.scale(rect.width/Math.max(1,m.width),1);g.fillStyle=el===title?"#28271f":"#913e3c";g.fillText(label,0,0);g.restore();
    }
    glyph(title,title.firstChild);if(em)glyph(em,em.firstChild);
    const data=g.getImageData(0,0,mask.width,mask.height).data;words=[];
    const box=title.getBoundingClientRect();
    for(let y=Math.max(0,Math.floor(box.top-bounds.top)-5);y<Math.min(mask.height,box.bottom-bounds.top+5);y+=2){
      for(let x=Math.max(0,Math.floor(box.left-bounds.left)-3);x<Math.min(mask.width,box.right-bounds.left+3);x+=2){
        const idx=(y*mask.width+x)*4;
        if(data[idx+3]>70)words.push([x,y,data[idx]>90,random()-.5,random()-.5]);
      }
    }
    dirty=true;
  }
  const observer=new MutationObserver(resetType);
  observer.observe(title,{childList:true,subtree:true});observer.observe(year,{childList:true,subtree:true});
  function size(){
    const box=canvas.getBoundingClientRect(),rect=section.getBoundingClientRect();
    const d=Math.min(devicePixelRatio,1.45,950/Math.max(box.width,1));
    width=canvas.width=Math.max(1,Math.round(box.width*d));height=canvas.height=Math.max(1,Math.round(box.height*d));
    scale=Math.min(width,height)*.277;
    bitmap=ctx.createImageData(width,height);
    typeRatio=Math.min(devicePixelRatio,1.5);
    typeCanvas.width=Math.round(rect.width*typeRatio);typeCanvas.height=Math.round(rect.height*typeRatio);
    type.setTransform(typeRatio,0,0,typeRatio,0,0);resetType();
  }
  new ResizeObserver(size).observe(section);
  new IntersectionObserver(e=>{shown=e[0].isIntersecting;dirty=true;}).observe(section);
  const trail=[];
  let artX=0,artY=0,artRadius=1,force=0;
  section.addEventListener("pointermove",e=>{
    if(e.pointerType==="touch"||reduce.matches)return;
    const rect=section.getBoundingClientRect(),box=title.getBoundingClientRect(),art=canvas.getBoundingClientRect();
    mouseX=e.clientX-rect.left;mouseY=e.clientY-rect.top;
    insideText=e.clientX>=box.left&&e.clientX<box.right&&e.clientY>=box.top&&e.clientY<=box.bottom;
    insideArt=e.clientX>=art.left&&e.clientX<=art.right&&e.clientY>=art.top&&e.clientY<=art.bottom;
    if(insideArt){
      const ratio=width/art.width;
      artX=(e.clientX-art.left)*ratio;
      artY=(e.clientY-art.top)*height/art.height;
      artRadius=Math.min(100,art.width*.22)*ratio;
      for(let i=0;i<6;i++){
        const angle=random()*tau, reach=(12+random()*42)*ratio;
        trail.push({x:artX,y:artY,dx:Math.cos(angle)*reach,dy:Math.sin(angle)*reach,
          radius:(1.1+random()*1.6)*ratio,color:i%2?"#913e3c":"#302c27",born:performance.now()});
      }
      if(trail.length>144)trail.splice(0,trail.length-144);
    }
  });
  section.addEventListener("pointerleave",()=>{insideText=false;insideArt=false;});
  function paintWords(){
    type.clearRect(0,0,typeCanvas.width/typeRatio,typeCanvas.height/typeRatio);
    section.classList.toggle("typeActive",burst>.012&&phase<.65);
    if(burst<=.012||phase>=.65)return;
    type.globalAlpha=Math.max(0,1-phase*1.6);
    for(const [x,y,red,u,v] of words){
      const near=Math.exp(-((x-mouseX)**2+(y-mouseY)**2)/15500);
      const k=burst*(.08+near);
      type.fillStyle=red?"#913e3c":"#292922";
      type.fillRect(x+(u*94+(mouseX-x)*.24)*k,y+(v*85+(mouseY-y)*.15)*k,1.45,1.45);
    }
  }
  // 밝은 종이 위의 미세한 잉크점을 네 이웃 픽셀에 분배해 이동 중에도 선명하게 보이게 한다.
  function frame(ms){
    requestAnimationFrame(frame);
    if(!shown||!bitmap||document.hidden||ms-last<36)return;
    last=ms;
    const rect=story.getBoundingClientRect();
    const raw=reduce.matches?0:Math.max(0,Math.min(1,-rect.top/Math.max(1,story.offsetHeight-section.offsetHeight)));
    phase=raw*raw*(3-2*raw);
    section.style.setProperty("--copy",Math.max(0,1-phase*1.9));
    section.style.setProperty("--branch",Math.max(0,(phase-.48)/.52));
    if(reduce.matches&&!dirty)return;
    dirty=false;
    scatter+=((!reduce.matches&&(insideArt||insideText)?1:0)-scatter)*.105;
    burst+=((!reduce.matches&&insideText?1:0)-burst)*.15;
    const buf=bitmap.data;new Uint32Array(buf.buffer).fill(0xffe9f3f4);
    const rot=.44+(reduce.matches?0:.12*Math.sin(ms*.00019)),c=Math.cos(rot),s=Math.sin(rot);
    const twist=.34+(reduce.matches?0:.08*Math.sin(ms*.00014)),ct=Math.cos(twist),st=Math.sin(twist);
    const softness=scatter*(1-phase);
    force+=((insideArt&&!reduce.matches?1:0)-force)*.22;
    for(const p of dots){
      const xx=p.x*c-p.y*s,yp=p.x*s+p.y*c,yy=yp*ct-p.z*st,z=yp*st+p.z*ct;
      const nz=(p.nx*s+p.ny*c)*st+p.nz*ct;
      const perspective=4.7/(4.7-z*.27);
      const jitter=softness*(.045+.13*p.noise);
      const sweep=Math.sin(phase*Math.PI)*.30;
      let x=width*.50+scale*((1-phase)*xx*perspective+phase*p.tx+p.sx*(jitter+sweep));
      let y=height*.50-scale*((1-phase)*yy*perspective+phase*p.ty+p.sy*(jitter+sweep));
      if(force>.01){
        const dx=x-artX,dy=y-artY;
        const falloff=Math.exp(-(.82*dx*dx+1.2*dy*dy)/(.65*artRadius*artRadius));
        const spread=force*(1-phase)*artRadius*.85*falloff;
        x+=p.sx*spread;
        y+=p.sy*spread;
      }
      const ix=x|0,iy=y|0;if(ix<0||iy<0||ix>=width-1||iy>=height-1)continue;
      const fx=x-ix,fy=y-iy,ink=(phase>.55?p.tr:p.red);
      const alpha=Math.min(.98,(.57+.65*Math.max(0,nz)+.12*z)*p.shade*(1-.18*softness));
      const mark=ink?[129,46,42]:[28,28,24];
      const k=(iy*width+ix)*4;
      for(let b=0;b<4;b++){
        const offset=k+(b&1)*4+(b>>1)*width*4;
        const a=alpha*(b&1?fx:1-fx)*(b>>1?fy:1-fy);
        buf[offset]+=(mark[0]-buf[offset])*a;buf[offset+1]+=(mark[1]-buf[offset+1])*a;buf[offset+2]+=(mark[2]-buf[offset+2])*a;
        if(ix>0 && iy>0){
          const edge=offset-4;
          const halo=a*.60;
          buf[edge]+=(mark[0]-buf[edge])*halo;buf[edge+1]+=(mark[1]-buf[edge+1])*halo;buf[edge+2]+=(mark[2]-buf[edge+2])*halo;
        }
      }
    }
    ctx.putImageData(bitmap,0,0);
    for(let i=trail.length-1;i>=0;i--){
      const p=trail[i],age=Math.max(0,(ms-p.born)/560);
      if(age>=1||reduce.matches){trail.splice(i,1);continue;}
      ctx.globalAlpha=(1-age)*.95;ctx.fillStyle=p.color;ctx.beginPath();
      ctx.arc(p.x+p.dx*age,p.y+p.dy*age+age*age*9,p.radius*(1-age*.65),0,tau);
      ctx.fill();
    }
    ctx.globalAlpha=1;
    paintWords();
  }
  size();requestAnimationFrame(frame);
})();

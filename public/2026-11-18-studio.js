"use strict";
const $ = id => document.getElementById(id);
const fmt = (v, digits = 1) => v.toLocaleString("ko-KR", {maximumFractionDigits:digits});
const labels = ["전임교원 1인당 학생 수", "학생 1인당 교육비", "재학생 1인당 장학금", "졸업생 취업률"];
labels.push("평균 등록금", "기숙사 수용률", "전임교원 강의 비율", "학생 1인당 도서 자료", "글로컬대학 본지정");
const units = ["명","천원","원","%","천원","%","%","권",""];
const baseCaps = [10,8,18,12,20,12,8,6,6];
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const narrow = matchMedia("(max-width:700px)");
let book, edition, selected, page = 0, timer, chart, checking = false;
let latest = true, rawBook, mode="combined";
const baseLabels=[...labels], baseUnits=[...units];
let caps=[...baseCaps];
function activate(data) {
  rawBook=data;
  const combined=mode==="combined";
  labels.splice(0,labels.length,...baseLabels,...(combined?["연구 출판물","받은 인용"]:[]));
  units.splice(0,units.length,...baseUnits,...(combined?["건","회"]:[]));
  caps=combined?[...baseCaps.map(v=>v/2),25,25]:[...baseCaps];
  book={...data,editions:data.editions.map(e=>combined?e.combined:e)};
  document.querySelector(".intro h1").innerHTML=combined?"대학 비교<em>Race.</em>":"학생지원<em>Race.</em>";
  document.querySelector(".intro p").textContent=combined?"연구활동 50점과 학생지원 50점으로 국내 대학을 비교합니다.":"학비·교육·생활 여건과 글로컬대학 참여 기회를 비교합니다.";
  document.querySelector(".notice b").textContent=combined?"종합비교 · 진학 참고용":"학생지원지수 · 진학 참고용";
  document.querySelector("#ranking h2").textContent=combined?"종합비교 순위표":"학생지원지수 순위표";
}

const groupSize = () => 20;
const topRows = () => edition.rows.filter(row => row.rank <= 100);
const rowById = (e,id) => e?.rows.find(row => row.id === id);
function node(tag, text, cls) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (cls) el.className = cls;
  return el;
}
function delta(row) {
  const before = book.editions.find(e => e.year === edition.year - 1);
  if (!before) return "—";
  const old = rowById(before,row.id);
  if (!old) return "첫 산정";
  const diff = old.rank - row.rank;
  return diff > 0 ? "▲ " + diff : diff < 0 ? "▼ " + -diff : "유지";
}
function selectSchool(r){
  stop(); page=Math.floor(edition.rows.indexOf(r)/groupSize());selected=r.id;render();
  $("race").scrollIntoView({block:"start"});
  $("lanes").querySelector('[aria-pressed=true]')?.focus({preventScroll:true});
}
function searchRows(term){
  const aliases={"snu":"서울대학교","kaist":"한국과학기술원","카이스트":"한국과학기술원","postech":"포항공과대학교","포스텍":"포항공과대학교","연대":"연세대학교","고대":"고려대학교"};
  const key=term.trim().toLowerCase().replace(/\s/g,"");
  const q=aliases[key]||key;
  return [...edition.rows,...edition.excluded].filter(r=>r.name.replace(/\s/g,"").includes(q));
}
function reason(r){return r.reason || (r.missing || []).map(i=>baseLabels[i]).join(", ") || "재학생 수";}
function renderTable(){
  const term=$("search").value.trim(), rows=term?searchRows(term):edition.rows.slice(page*20,page*20+20);
  $("count").textContent=term?"검색 결과 "+rows.length+"곳":(page*20+1)+"–"+Math.min(page*20+20,edition.rows.length)+"번째 · 전체 "+edition.rows.length+"곳";
  $("table").replaceChildren(...rows.map(r=>{
    const tr=node("tr"), td=node("td");
    if(r.rank){const b=node("button",r.name);b.onclick=()=>selectSchool(r);td.append(b);}
    else td.textContent=r.name+" · "+reason(r);
    tr.append(node("td",r.rank??"미산정"),td,node("td",r.rank?r.score.toFixed(2):"—"),node("td",r.rank?delta(r):"—"));return tr;
  }));
  const results=$("lookup").value.trim()?searchRows($("lookup").value):[];
  $("matches").replaceChildren();
  if($("lookup").value.trim()){
    $("matches").append(node("small",results.length?"검색 결과 "+results.length+"곳":"일치하는 대학이 없습니다."));
    for(const r of results){
      const el=node(r.rank?"button":"span",r.name+" · "+(r.rank?r.rank+"위 ("+(mode==="combined"?"종합":"학생지원")+")":"미산정 · "+reason(r)));
      if(r.rank)el.onclick=()=>selectSchool(r);
      $("matches").append(el);
    }
  }
}
function renderDetail() {
  const r = rowById(edition,selected);
  $("school").textContent = r.name;
  $("identity").textContent = edition.year + " 공시 · " + r.rank + "위";
  $("region").textContent = r.region + " · 전년 대비 " + delta(r);
  $("score").textContent = r.score.toFixed(2) + "점";
  $("metrics").replaceChildren(...labels.map((label,i) => {
    const box = node("div",undefined,"metric"), line = node("div"), bar = node("div",undefined,"meter");
    const fill = node("i"); fill.style.width = 100 * r.points[i] / caps[i] + "%"; bar.append(fill);
    line.append(node("span",label + (i === 8 ? "" : [0,4].includes(i) ? " ↓" : " ↑")), node("small",r.points[i].toFixed(2) + " / "+caps[i]+"점"));
    box.append(line,node("small",i === 8 ? (r.points[i] ? r.designation+"년 본지정" : r.designation ? "해당 연도 가점 없음" : "본지정 가점 없음") : r.years[i] + " 표기 · " + fmt(r.values[i],2) + units[i]),bar);
    return box;
  }));
  $("history").textContent = book.editions.map(e => {
    const point = rowById(e,selected);
    return e.year + " · " + (point ? point.score.toFixed(1) : "미산정");
  }).join("　");
  if (chart?.redraw) chart.redraw();
  const program=$("programSource") || node("p",undefined,"sub");
  program.id="programSource";
  program.replaceChildren();
  if (r.points[8]) {
    const link=node("a","글로컬대학 본지정 자료 ↗");
    link.href={
      2023:"https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&boardSeq=97030",
      2024:"https://www.korea.kr/news/policyNewsView.do?newsId=156647660",
      2025:"https://csu.chosun.ac.kr/bbs/chosun/72/271857/artclView.do"
    }[r.designation];
    program.append(link);
  }
  if(r.source){
    const link=node("a","OpenAlex 기관 원문 ↗");link.href=r.source;
    program.append(document.createTextNode("　"),link);
  }
  if(r.name==="서울대학교"){
    const ref=node("a","THE 2027 한국 1위 · 세계 56위 ↗");
    ref.href="https://www.timeshighereducation.com/student/best-universities/best-universities-south-korea";
    program.append(node("br"),ref);
  }
  $("metrics").after(program);
}
function render() {
  const rows = edition.rows, size = groupSize(), pages = Math.ceil(rows.length / size);
  page = Math.min(page,pages-1);
  const visible = rows.slice(page*size,(page+1)*size);
  if (!visible.some(r => r.id === selected)) selected = visible[0].id;
  const oldScores = new Map([...$("lanes").children].map(el=>[el.dataset.id,el.style.getPropertyValue("--score")]));
  const old = new Map([...$("lanes").children].map(el => [el.dataset.id,el.getBoundingClientRect().top]));
  const staging = document.createDocumentFragment();
  for (const r of visible) {
    const btn = node("button",undefined,"lane"), track = node("span",undefined,"track"), fill = node("i");
    btn.dataset.id = r.id;
    btn.setAttribute("aria-pressed",String(r.id === selected));
    btn.onclick = () => { selected = r.id; render(); };
    track.append(fill); btn.style.setProperty("--score",r.score + "%");
    btn.append(node("b",String(r.rank).padStart(2,"0")),node("span",r.name,"name"),track,node("strong",r.score.toFixed(2)));
    staging.append(btn);
  }
  $("lanes").replaceChildren(staging);
  for (const el of $("lanes").children) {
    if (reduced.matches) continue;
    const from=oldScores.get(el.dataset.id) || "0%";
    const to=el.style.getPropertyValue("--score");
    if(from!==to) el.querySelector(".track i").animate([{width:from},{width:to}],{duration:1100,easing:"cubic-bezier(.18,.65,.24,1)"});
    if (!old.has(el.dataset.id)) {el.animate([{opacity:0,transform:"translateY(18px)"},{opacity:1,transform:"none"}],{duration:550});continue;}
    const dy = old.get(el.dataset.id) - el.getBoundingClientRect().top;
    if (Math.abs(dy) > 1) el.animate([{transform:"translateY("+dy+"px)"},{transform:"none"}],{duration:950,easing:"ease-in-out"});
  }
  $("page").replaceChildren(...Array.from({length:pages},(_,i) => new Option((i*size+1)+"–"+Math.min(rows.length,(i+1)*size),i)));
  $("page").value = page;
  $("prev").disabled = page === 0; $("next").disabled = page === pages-1;
  $("tablePrev").disabled=$("prev").disabled; $("tableNext").disabled=$("next").disabled;
  $("range").textContent = visible[0].rank + "–" + visible.at(-1).rank + "위";
  $("year").value = edition.year;
  $("pool").textContent = edition.year + " 공시 · 일반대학 " + edition.rows.length + "개 단위 비교 · 자체 산정";
  $("live").hidden = latest;
  $("exTitle").textContent = "산정 제외 " + edition.excluded.length + "곳과 사유";
  $("excluded").textContent = edition.excluded.map(x => x.name + " (" + (reason(x)) + ")").join(" / ");
  const overlap = labels.map((_, i) => i).map(i => {
    const scores = edition.rows.map(r => r.score-r.points[i]).sort((a,b)=>b-a);
    return topRows().filter(r=> r.score-r.points[i] >= scores[99]-1e-9).length;
  });
  $("sensitivity").textContent = "한 지표를 빼고 다시 계산했을 때 현재 상위권과 겹치는 수 ("+topRows().length+"곳 중) · " + overlap.map((v,i)=>labels[i]+" 제외 "+v+"곳").join(" / ");
  if(mode==="combined") $("sensitivity").textContent="연구량은 기관 전체 규모와 전공 구성에 영향을 받습니다. 세부 점수와 기관별 OpenAlex 원문을 함께 확인하세요.";
  $("raceYear").textContent = edition.year; $("coverYear").textContent=edition.year;
  const prior=book.editions.find(e=>e.year===edition.year-1);
  const gains=visible.map(r=>({r,gain:(rowById(prior,r.id)?.rank ?? r.rank)-r.rank})).sort((a,b)=>b.gain-a.gain);
  $("move").textContent = gains[0]?.gain>0 ? gains[0].r.name+"  ↑ "+gains[0].gain+"계단 · 구간 내 최대 상승" : "표시 구간 "+visible[0].rank+"–"+visible.at(-1).rank+"위";
  renderDetail(); renderTable();
}
function stop() { clearInterval(timer); timer = null; $("play").textContent = "▶ 연도 재생"; }
function switchYear(year) {
  edition = book.editions.find(e => e.year === Number(year));
  latest = edition === book.editions.at(-1) && !timer;
  render();
}
$("play").onclick = () => {
  if(!book)return;
  if (timer) { stop(); return; }
  let i = 0;
  timer = setInterval(() => {
    i++;
    if (i === book.editions.length-1) stop();
    switchYear(book.editions[i].year);
  },2300);
  $("play").textContent = "Ⅱ 일시정지"; switchYear(book.editions[0].year);
};
$("live").onclick = () => { stop(); switchYear(book.editions.at(-1).year); };
$("year").onchange = () => { stop(); switchYear($("year").value); };
$("prev").onclick = () => { page--; render(); };
$("next").onclick = () => { page++; render(); };
$("page").onchange = () => { page = Number($("page").value); render(); };
for(const id of ["search","lookup"]){
  $(id).oninput=()=>{ $(id==="search"?"lookup":"search").value=$(id).value;if(edition)renderTable();};
  $(id).onkeydown=e=>{if(e.key==="Enter" && edition && $(id).value.trim()){const r=searchRows($(id).value).find(x=>x.rank);if(r)selectSchool(r);}};
}
$("mode").onchange=()=>{
  mode=$("mode").value;if(!rawBook)return;
  stop();const year=edition.year;activate(rawBook);page=0;switchYear(year);
};
for(const [id,other] of [["tablePrev","prev"],["tableNext","next"]]) $(id).onclick=()=>$(other).click();
narrow.addEventListener("change",()=>{ if (book) {page=0;render();} });

// 하나의 입자 버퍼를 재사용하고 각 레인의 실제 점수 끝점에 꼬리를 붙인다.
function particles() {
  if (!window.THREE) return;
  const stage = $("stage");
  let renderer;
  try { renderer = new THREE.WebGLRenderer({alpha:true,antialias:true}); } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.domElement.setAttribute("aria-hidden","true"); stage.prepend(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(0,1,1,0,.1,400);
  camera.position.z = 180;
  const per = 120, max = 20*per, geometry = new THREE.BufferGeometry();
  const pos = new Float32Array(max*3), col = new Float32Array(max*3);
  const seeds = Array.from({length:max},()=>[Math.random(),Math.random()*Math.PI*2,Math.random()]);
  geometry.setAttribute("position",new THREE.BufferAttribute(pos,3));
  geometry.setAttribute("color",new THREE.BufferAttribute(col,3));
  const material = new THREE.ShaderMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:THREE.NormalBlending,
    vertexShader:"varying vec3 tint; void main(){tint=color; gl_PointSize=2.7+position.z*.15; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:"varying vec3 tint; void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(tint,pow(max(0.,1.-d),1.3));}"});
  const points = new THREE.Points(geometry,material); points.frustumCulled=false;scene.add(points);
  new ResizeObserver(()=>{const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.right=w;camera.top=h;camera.updateProjectionMatrix();}).observe(stage);
  let last=0;
  function draw(t) {
    requestAnimationFrame(draw);
    if (document.hidden || t-last < (reduced.matches ? 180 : 32)) return;
    last=t;
    const rect=stage.getBoundingClientRect();
    if(rect.bottom<0 || rect.top>innerHeight) return;
    const seconds=reduced.matches ? 0 : t*.00065;
    let n=0;
    for(const el of $("lanes").children){
      const lane=el.querySelector(".track i").getBoundingClientRect(),active=el.dataset.id===selected;
      const end=lane.right-rect.left, mid=rect.bottom-(lane.top+lane.height/2);
      for(let j=0;j<per;j++,n++){
        const [s,a,b]=seeds[n], f=(s+seconds*(.15+b*.13))%1;
        const angle=a+f*12+seconds, radius=(1-f)*(1+5*b);
        pos[n*3]=end-f*f*Math.min(lane.width,active?115:83);
        pos[n*3+1]=mid+Math.sin(angle)*radius;
        pos[n*3+2]=10+Math.cos(angle)*radius;
        const glow=(1-f*.7)*(.45+.55*b);
        col[n*3]=(active?1:.26)*glow;col[n*3+1]=(active?.78:.94)*glow;col[n*3+2]=(active?.86:.85)*glow;
      }
    }
    geometry.setDrawRange(0,n);geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;renderer.render(scene,camera);
  }
  requestAnimationFrame(draw);
}
function trend() {
  if (!window.p5) return;
  chart = new p5(p=>{
    p.setup=()=>{p.createCanvas($("trend").clientWidth,70);p.noLoop();};
    p.draw=()=>{
      p.clear();if(!book || !edition) return;
      const list=book.editions, first=list[0].year, span=list.at(-1).year-first || 1;
      let prev;
      p.stroke("#31434b");p.line(7,61,p.width-7,61);
      for(const e of list){
        const row=rowById(e,selected);
        if(!row){prev=null;continue;}
        const x=8+(p.width-16)*(e.year-first)/span,y=61-row.score*.52;
        p.stroke("#7949ec");if(prev)p.line(...prev,x,y);
        p.fill(e===edition?"#e68b00":"#7949ec");p.circle(x,y,e===edition?8:5);
        prev=[x,y];
      }
    };
    new ResizeObserver(()=>{if(p.canvas){p.resizeCanvas($("trend").clientWidth,70);p.redraw();}}).observe($("trend"));
  },$("trend"));
}
function status(meta){
  const stamp = t=>new Date(t).toLocaleString("ko-KR",{timeZone:"Asia/Seoul",hour12:false});
  $("status").replaceChildren(node("b",meta.error?"● 원자료 갱신 지연":"● 공시 자동 확인 중"),node("br"),node("span","확인 "+stamp(meta.checked)),node("br"),node("span","반영 "+stamp(meta.published)));
}
async function sync(){
  if(checking) return;
  checking=true;
  try{
    const response=await fetch(book?"/api/status":"/api/data",{cache:"no-store"});
    if(!response.ok) throw Error();
    const meta=await response.json();
    if(!book || meta.version!==book.version){
      const incoming=meta.editions ? meta : await (await fetch("/api/data",{cache:"no-store"})).json();
      const target=latest?incoming.editions.at(-1).year:edition.year;
      activate(incoming);
      $("year").replaceChildren(...book.editions.map(e=>new Option(e.year+" 공시",e.year)));
      switchYear(book.editions.some(e=>e.year===target)?target:book.editions.at(-1).year);
    }
    status(meta);
  }catch{
    $("status").textContent = location.protocol==="file:" ? "폴더의 ‘대학레이스-실행.cmd’를 열어 주세요." : "서버 연결 대기 · 30초 후 다시 확인합니다.";
  }finally{checking=false;}
}
// 입체로 꼬인 두 바퀴의 표면에 삼각 입자를 배치한다. 순위와 무관한 표지 그림이다.
function pointerTrail(){
  const canvas=node("canvas");canvas.className="pointerDust";canvas.setAttribute("aria-hidden","true");
  document.body.append(canvas);
  const ctx=canvas.getContext("2d"), sparks=[];
  let frame=0;
  function resize(){const d=Math.min(devicePixelRatio,2);canvas.width=innerWidth*d;canvas.height=innerHeight*d;ctx.setTransform(d,0,0,d,0,0);}
  resize();window.addEventListener("resize",resize);
  function draw(t){
    ctx.clearRect(0,0,innerWidth,innerHeight);
    for(let i=sparks.length-1;i>=0;i--){
      const p=sparks[i],age=(t-p.t)/550;
      if(age>=1||reduced.matches){sparks.splice(i,1);continue;}
      ctx.globalAlpha=1-age;ctx.fillStyle=p.color;ctx.beginPath();
      ctx.arc(p.x+p.dx*age,p.y+p.dy*age+age*age*12,Math.max(.2,3*(1-age)),0,Math.PI*2);ctx.fill();
    }
    frame=sparks.length?requestAnimationFrame(draw):0;
  }
  for(const area of [document.querySelector(".intro"),$("race")]){
    area.addEventListener("pointermove",e=>{
      if(reduced.matches||e.pointerType==="touch")return;
      for(const color of ["#f5a446","#9967f7","#099f9b"])sparks.push({x:e.clientX,y:e.clientY,dx:(Math.random()-.5)*42,dy:(Math.random()-.8)*40,t:performance.now(),color});
      if(sparks.length>150)sparks.splice(0,sparks.length-150);
      if(!frame)frame=requestAnimationFrame(draw);
    });
  }
}
pointerTrail();particles();trend();sync();setInterval(sync,30000);

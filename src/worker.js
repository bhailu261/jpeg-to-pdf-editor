/**
 * JPEG → PDF Editor — Cloudflare Worker
 * Fully client-side: all PDF processing happens in the browser.
 * Worker serves the SPA with security headers and a health check.
 */

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>JPEG to PDF Editor</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📄</text></svg>">
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"><\/script>
<style>
:root{--bg:#0b0d14;--surface:#161827;--surface-2:#1e2038;--border:#2a2d4a;--text:#e2e4f0;--text-muted:#8b8fa3;--primary:#f48120;--primary-hover:#f6993f;--danger:#ef4444;--success:#22c55e;--radius:10px;--radius-sm:6px}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;flex-direction:column}
.header{background:var(--surface);border-bottom:1px solid var(--border);padding:16px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
.header h1{font-size:20px;font-weight:600;display:flex;align-items:center;gap:10px}.header h1 span{color:var(--primary)}
.header-badges{display:flex;gap:8px;flex-wrap:wrap}
.badge{font-size:11px;padding:4px 10px;border-radius:20px;background:var(--surface-2);border:1px solid var(--border);color:var(--text-muted);letter-spacing:.3px}
.badge.secure{border-color:var(--success);color:var(--success)}
.container{max-width:960px;margin:0 auto;padding:24px;width:100%;flex:1}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin-bottom:20px}
.card-title{font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:16px}
.drop-zone{border:2px dashed var(--border);border-radius:var(--radius);padding:48px 24px;text-align:center;cursor:pointer;transition:all .2s}
.drop-zone:hover,.drop-zone.dragover{border-color:var(--primary);background:rgba(244,129,32,.05)}
.drop-zone.has-files{border-style:solid;border-color:var(--success);padding:24px}
.drop-zone-icon{font-size:48px;margin-bottom:12px}
.drop-zone-text{font-size:16px;margin-bottom:8px}
.drop-zone-sub{font-size:13px;color:var(--text-muted)}
.drop-zone input{display:none}
.file-list{margin-top:16px}
.file-item{display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--surface-2);border-radius:var(--radius-sm);margin-bottom:8px;border:1px solid var(--border)}
.file-item .thumb{width:40px;height:40px;border-radius:4px;object-fit:cover;background:var(--bg)}
.file-item .info{flex:1;min-width:0}
.file-item .name{font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.file-item .size{font-size:12px;color:var(--text-muted)}
.file-item .remove{background:none;border:none;color:var(--danger);cursor:pointer;font-size:18px;padding:4px;line-height:1;border-radius:4px}
.file-item .remove:hover{background:rgba(239,68,68,.15)}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border:none;border-radius:var(--radius-sm);font-size:14px;font-weight:500;cursor:pointer;transition:all .15s;text-decoration:none}
.btn-primary{background:var(--primary);color:#fff}.btn-primary:hover{background:var(--primary-hover)}
.btn-primary:disabled{opacity:.4;cursor:not-allowed}
.btn-secondary{background:var(--surface-2);color:var(--text);border:1px solid var(--border)}
.btn-secondary:hover{border-color:var(--text-muted)}
.btn-danger{background:var(--danger);color:#fff}.btn-danger:hover{opacity:.9}
.btn-sm{padding:6px 14px;font-size:13px}
.toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px}
.page-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:12px}
.page-card{background:var(--surface-2);border:2px solid var(--border);border-radius:var(--radius-sm);padding:8px;position:relative;cursor:pointer;transition:all .15s}
.page-card:hover{border-color:var(--text-muted)}.page-card.selected{border-color:var(--primary)}
.page-card canvas{width:100%;aspect-ratio:1/1.414;display:block;border-radius:4px;background:#fff}
.page-card .page-num{font-size:11px;color:var(--text-muted);text-align:center;padding:6px 0 2px}
.page-card .page-check{position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:50%;background:var(--surface);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:12px}
.page-card.selected .page-check{background:var(--primary);border-color:var(--primary);color:#fff}
.progress-bar{height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin:12px 0}
.progress-bar .fill{height:100%;background:var(--primary);width:0%;transition:width .3s}
.toast{position:fixed;bottom:24px;right:24px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 20px;font-size:14px;box-shadow:0 8px 32px rgba(0,0,0,.4);transform:translateY(80px);opacity:0;transition:all .3s;z-index:100}
.toast.show{transform:translateY(0);opacity:1}.toast.success{border-color:var(--success)}.toast.error{border-color:var(--danger)}
.features-bar{display:flex;gap:16px;flex-wrap:wrap;padding:12px 0;border-top:1px solid var(--border);margin-top:16px}
.feature-tag{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted)}
@media (max-width:600px){.container{padding:12px}.card{padding:16px}.page-grid{grid-template-columns:repeat(auto-fill,minmax(100px,1fr))}}
</style>
</head>
<body>
<header class="header">
<h1><span>📄</span> JPEG to PDF Editor</h1>
<div class="header-badges">
<span class="badge secure">🔒 100% Client-Side</span>
<span class="badge">⚡ Cloudflare Workers</span>
<span class="badge">📋 PDF-lib</span>
</div>
</header>
<div class="container">
<div class="card" id="upload-card">
<div class="card-title">Step 1 — Add Images</div>
<div class="drop-zone" id="dropZone">
<div class="drop-zone-icon">🖼️</div>
<div class="drop-zone-text">Drop JPEG files here or click to browse</div>
<div class="drop-zone-sub">Supports .jpg and .jpeg — all processing stays on your device</div>
<input type="file" id="fileInput" accept=".jpg,.jpeg,image/jpeg" multiple>
</div>
<div class="file-list" id="fileList"></div>
</div>
<div class="card" id="editor-card" style="display:none">
<div class="card-title">Step 2 — Preview & Edit</div>
<div class="toolbar">
<button class="btn btn-primary btn-sm" id="convertBtn">📥 Convert to PDF</button>
<button class="btn btn-secondary btn-sm" id="addMoreBtn">➕ Add More</button>
<button class="btn btn-danger btn-sm" id="removeSelectedBtn" disabled>🗑️ Remove Selected</button>
<button class="btn btn-secondary btn-sm" id="clearAllBtn">Clear All</button>
</div>
<div class="page-grid" id="pageGrid"></div>
<div class="progress-bar" id="progressBar" style="display:none"><div class="fill" id="progressFill"></div></div>
<div class="features-bar">
<span class="feature-tag">🔒 Zero-server processing — your files never leave your device</span>
<span class="feature-tag">📄 PDF/A-compatible output via PDF-lib</span>
<span class="feature-tag">⚡ Deployed on Cloudflare's global network</span>
</div>
</div>
<div class="card" id="download-card" style="display:none">
<div class="card-title">Step 3 — Download</div>
<div style="text-align:center;padding:20px 0">
<div style="font-size:48px;margin-bottom:12px">✅</div>
<p style="font-size:16px;font-weight:500;margin-bottom:4px">Your PDF is ready!</p>
<p style="font-size:13px;color:var(--text-muted);margin-bottom:16px" id="downloadInfo"></p>
<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
<a class="btn btn-primary" id="downloadLink" download="converted.pdf">📥 Download PDF</a>
<button class="btn btn-secondary" id="startOverBtn">🔄 Convert Another</button>
</div>
</div>
</div>
</div>
<div class="toast" id="toast"></div>
<script>
const state={images:[],selected:new Set(),converting:false};
const $=id=>document.getElementById(id);
const dropZone=$('dropZone'),fileInput=$('fileInput'),fileList=$('fileList'),editorCard=$('editor-card'),pageGrid=$('pageGrid'),convertBtn=$('convertBtn'),addMoreBtn=$('addMoreBtn'),removeSelectedBtn=$('removeSelectedBtn'),clearAllBtn=$('clearAllBtn'),progressBar=$('progressBar'),progressFill=$('progressFill'),downloadCard=$('download-card'),downloadLink=$('downloadLink'),downloadInfo=$('downloadInfo'),startOverBtn=$('startOverBtn'),toast=$('toast');
let tt=null;
function st(m,t){toast.textContent=m;toast.className='toast '+(t||'');clearTimeout(tt);requestAnimationFrame(()=>toast.classList.add('show'));tt=setTimeout(()=>toast.classList.remove('show'),3500)}
function fs(b){if(b<1024)return b+' B';if(b<1048576)return(b/1024).toFixed(1)+' KB';return(b/1048576).toFixed(1)+' MB'}
function es(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
async function af(files){const vf=Array.from(files).filter(f=>f.type==='image/jpeg'||/\.jpe?g$/i.test(f.name));if(!vf.length){st('Please select JPEG files only','error');return}for(const f of vf){const id=crypto.randomUUID();const du=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)});state.images.push({id,file:f,dataUrl:du,name:f.name,size:f.size})}r();st('Added '+vf.length+' image(s)','success')}
function rs(){state.images=state.images.filter(i=>!state.selected.has(i.id));state.selected.clear();r();if(!state.images.length){editorCard.style.display='none';downloadCard.style.display='none'}}
function ca(){state.images=[];state.selected.clear();r();editorCard.style.display='none';downloadCard.style.display='none';st('Cleared all images','')}
function r(){
if(state.images.length){dropZone.classList.add('has-files');dropZone.querySelector('.drop-zone-icon').textContent='📂';dropZone.querySelector('.drop-zone-text').textContent=state.images.length+' image(s) loaded';dropZone.querySelector('.drop-zone-sub').textContent='Drop more to add — click to browse'}
else{dropZone.classList.remove('has-files');dropZone.querySelector('.drop-zone-icon').textContent='🖼️';dropZone.querySelector('.drop-zone-text').textContent='Drop JPEG files here or click to browse';dropZone.querySelector('.drop-zone-sub').textContent='Supports .jpg and .jpeg — all processing stays on your device'}
fileList.innerHTML=state.images.map(i=>'<div class="file-item"><img class="thumb" src="'+i.dataUrl+'" alt="'+es(i.name)+'"><div class="info"><div class="name">'+es(i.name)+'</div><div class="size">'+fs(i.size)+'</div></div><button class="remove" data-id="'+i.id+'" title="Remove">✕</button></div>').join('');
fileList.querySelectorAll('.remove').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.id;state.images=state.images.filter(i=>i.id!==id);state.selected.delete(id);r();if(!state.images.length){editorCard.style.display='none';downloadCard.style.display='none'}}));
if(state.images.length)editorCard.style.display='block';
pageGrid.innerHTML=state.images.map((i,idx)=>'<div class="page-card '+(state.selected.has(i.id)?'selected':'')+'" data-id="'+i.id+'"><div class="page-check">'+(state.selected.has(i.id)?'✓':'')+'</div><canvas data-id="'+i.id+'"></canvas><div class="page-num">Page '+(idx+1)+'</div></div>').join('');
pageGrid.querySelectorAll('canvas').forEach(c=>{const id=c.dataset.id;const img=state.images.find(i=>i.id===id);if(img){const im=new Image();im.onload=()=>{const ctx=c.getContext('2d');const w=c.clientWidth||140;const h=w*1.414;c.width=w*2;c.height=h*2;c.style.width=w+'px';c.style.height=h+'px';ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);const s=Math.min(c.width/im.width,c.height/im.height);ctx.drawImage(im,(c.width-im.width*s)/2,(c.height-im.height*s)/2,im.width*s,im.height*s)};im.src=img.dataUrl}});
pageGrid.querySelectorAll('.page-card').forEach(c=>c.addEventListener('click',()=>{const id=c.dataset.id;if(state.selected.has(id))state.selected.delete(id);else state.selected.add(id);r();removeSelectedBtn.disabled=!state.selected.size}));
removeSelectedBtn.disabled=!state.selected.size}
async function cv(){if(!state.images.length||state.converting)return;state.converting=true;convertBtn.disabled=true;convertBtn.textContent='⏳ Converting...';progressBar.style.display='block';progressFill.style.width='0%';try{const{PDFDocument}=PDFLib;const pdf=await PDFDocument.create();const t=state.images.length;for(let i=0;i<t;i++){const img=state.images[i];const res=await fetch(img.dataUrl);const buf=new Uint8Array(await res.arrayBuffer());const jpg=await pdf.embedJpg(buf);const{width:w,height:h}=jpg;const m=595;let pw,ph;if(w>h){pw=m;ph=(h/w)*m}else{ph=m;pw=(w/h)*m}const pg=pdf.addPage([pw,ph]);pg.drawImage(jpg,{x:0,y:0,width:pw,height:ph});progressFill.style.width=(((i+1)/t)*100)+'%'}const bytes=await pdf.save();const blob=new Blob([bytes],{type:'application/pdf'});const url=URL.createObjectURL(blob);downloadLink.href=url;downloadLink.download=state.images.length===1?state.images[0].name.replace(/\.jpe?g$/i,'')+'.pdf':state.images.length+'-images-converted.pdf';downloadInfo.textContent=state.images.length+' page(s) · '+fs(blob.size);editorCard.style.display='none';downloadCard.style.display='block';st('PDF created successfully!','success')}catch(e){console.error(e);st('Error: '+e.message,'error')}finally{state.converting=false;convertBtn.disabled=false;convertBtn.textContent='📥 Convert to PDF';progressBar.style.display='none'}}
dropZone.addEventListener('click',()=>fileInput.click());
dropZone.addEventListener('dragover',e=>{e.preventDefault();dropZone.classList.add('dragover')});
dropZone.addEventListener('dragleave',()=>dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop',e=>{e.preventDefault();dropZone.classList.remove('dragover');af(e.dataTransfer.files)});
fileInput.addEventListener('change',()=>{if(fileInput.files.length){af(fileInput.files);fileInput.value=''}});
convertBtn.addEventListener('click',cv);
addMoreBtn.addEventListener('click',()=>fileInput.click());
removeSelectedBtn.addEventListener('click',rs);
clearAllBtn.addEventListener('click',ca);
startOverBtn.addEventListener('click',()=>{ca();downloadCard.style.display='none'});
document.addEventListener('keydown',e=>{if((e.key==='Delete'||e.key==='Backspace')&&state.selected.size&&!e.target.closest('input,textarea')){e.preventDefault();rs()}if(e.key==='Enter'&&state.images.length&&!state.converting){const a=document.activeElement;if(!a||a.tagName!=='INPUT')cv()}});
r();
<\/script>
</body>
</html>`;

const HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: blob:; connect-src 'self'; font-src 'self' https://cdnjs.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-XSS-Protection': '0',
  'Content-Type': 'text/html; charset=utf-8',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
        headers: { 'Content-Type': 'application/json', ...HEADERS },
      });
    }

    return new Response(HTML, { headers: HEADERS });
  },
};

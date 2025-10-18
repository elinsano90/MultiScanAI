import { renderBars, now, wait } from '../core.js'; import { loadTMModel } from '../modelLoader.js';
export class ImageMode{
  constructor(c){Object.assign(this,c); this.ctx=this.canvas.getContext('2d'); this.streaming=false; this.frozen=false; this.lowFps=false; this.model=null;
    this.startBtn.addEventListener('click',()=>this.start());
    this.freezeBtn.addEventListener('click',()=>{this.frozen=true; this.freezeBtn.disabled=true; this.resumeBtn.disabled=false;});
    this.resumeBtn.addEventListener('click',()=>{this.frozen=false; this.freezeBtn.disabled=false; this.resumeBtn.disabled=true; this.loop(true);});
    this.uploadInput.addEventListener('change',e=>this.onUpload(e));
    this.lowFpsChk.addEventListener('change',e=>this.lowFps=e.target.checked);
    this.demoChk.addEventListener('change',e=>this.demo=e.target.checked);
    this.loadModel();
  }
  async loadModel(){ this.model = await loadTMModel(this.modelPath,'image'); if (this.model.demo){ this.demoChk.checked=true; } }
  async start(){ try{ this.stream=await navigator.mediaDevices.getUserMedia({video:true}); this.video.srcObject=this.stream; await this.video.play(); this.streaming=true; this.loop(); }catch(e){ console.error(e); } }
  onUpload(e){ const f=e.target.files[0]; if(!f) return; const img=new Image(); img.onload=async()=>{ this.canvas.width=img.width; this.canvas.height=img.height; this.ctx.drawImage(img,0,0); const r=await this.model.predict(this.canvas); this.render(r); }; img.src=URL.createObjectURL(f); }
  async predict(input){ const {top1, top3, latencyMs}=await this.model.predict(input); this.latencyEl.textContent=latencyMs; return {top1, top3}; }
  render({top1, top3}){ this.top1El.textContent=`${top1.label} — ${(top1.prob*100).toFixed(1)}%`; renderBars(this.top3El, top3); }
  async loop(force=false){ if(!this.streaming) return; if(this.frozen && !force) return; const w=this.video.videoWidth,h=this.video.videoHeight; if(!w||!h){ requestAnimationFrame(()=>this.loop()); return; } this.canvas.width=w; this.canvas.height=h; this.ctx.drawImage(this.video,0,0,w,h); const r=await this.predict(this.canvas); this.render(r); if(this.lowFps) await wait(120); requestAnimationFrame(()=>this.loop()); }
  pause(){ this.streaming=false; if(this.stream){ this.stream.getTracks().forEach(t=>t.stop()); this.stream=null; } this.model&&this.model.dispose(); }
}
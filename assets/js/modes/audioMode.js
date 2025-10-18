import { renderBars, now } from '../core.js'; import { loadTMModel } from '../modelLoader.js';
export class AudioMode{
  constructor(c){Object.assign(this,c); this.ctx=null; this.analyser=null; this.mediaStream=null; this.model=null;
    this.recordBtn.addEventListener('click',()=>this.record()); this.stopBtn.addEventListener('click',()=>this.stop());
    this.uploadInput.addEventListener('change',e=>this.playFile(e.target.files[0]));
    this.sampleBtns.forEach(b=>b.addEventListener('click',()=>this.playUrl(b.dataset.file)));
    this.demoChk.addEventListener('change',e=>this.demo=e.target.checked);
    this.scopeCtx=this.scope.getContext('2d'); this.specCtx=this.spec.getContext('2d');
    this.loadModel(); this.drawLoop();
  }
  async loadModel(){ this.model = await loadTMModel(this.modelPath,'audio'); if(this.model.demo){ this.demoChk.checked=true; } }
  async ensureAudio(){ if(!this.ctx){ this.ctx=new (window.AudioContext||window.webkitAudioContext)(); this.analyser=this.ctx.createAnalyser(); this.analyser.fftSize=512; } }
  async record(){ try{ await this.ensureAudio(); this.mediaStream=await navigator.mediaDevices.getUserMedia({audio:true}); const src=this.ctx.createMediaStreamSource(this.mediaStream); src.connect(this.analyser); }catch(e){ console.error(e); } }
  stop(){ if(this.mediaStream){ this.mediaStream.getTracks().forEach(t=>t.stop()); this.mediaStream=null; } }
  async playFile(f){ if(!f) return; this.playUrl(URL.createObjectURL(f)); }
  async playUrl(url){ await this.ensureAudio(); const a=new Audio(url); const n=this.ctx.createMediaElementSource(a); n.connect(this.analyser); this.analyser.connect(this.ctx.destination); a.play(); }
  drawLoop(){ const draw=()=>{ const w=this.scope.width,h=this.scope.height; const data=new Uint8Array(this.analyser?this.analyser.fftSize:512); if(this.analyser) this.analyser.getByteTimeDomainData(data); else for(let i=0;i<data.length;i++) data[i]=128; this.scopeCtx.clearRect(0,0,w,h); this.scopeCtx.beginPath(); for(let i=0;i<w;i++){ const idx=Math.floor(i*data.length/w); const y=(data[idx]/255)*h; if(i===0)this.scopeCtx.moveTo(0,y); else this.scopeCtx.lineTo(i,y);} this.scopeCtx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent'); this.scopeCtx.lineWidth=2; this.scopeCtx.stroke();
    const freq=new Uint8Array(256); if(this.analyser) this.analyser.getByteFrequencyData(freq); else for(let i=0;i<256;i++) freq[i]=(i%16)*16; const img=this.specCtx.getImageData(1,0,this.spec.width-1,this.spec.height); this.specCtx.putImageData(img,0,0); for(let y=0;y<this.spec.height;y++){ const idx=Math.floor((y/this.spec.height)*freq.length); const v=freq[freq.length-1-idx]; this.specCtx.fillStyle=`hsl(${Math.max(0,260-v)},80%,${30+v/3}%)`; this.specCtx.fillRect(this.spec.width-1,y,1,1);} requestAnimationFrame(draw); }; draw(); }
  async predictFromAnalyser(){ const size=1024; const buf=new Float32Array(size); if(this.analyser){ const tmp=new Uint8Array(size); this.analyser.getByteTimeDomainData(tmp); for(let i=0;i<size;i++) buf[i]=(tmp[i]-128)/128.0; } const {top1, top3, latencyMs}=await this.model.predict(buf); this.latencyEl.textContent=latencyMs; return {top1, top3}; }
  async loop(){ if(!this.running) return; const r=await this.predictFromAnalyser(); this.top1El.textContent=`${r.top1.label} — ${(r.top1.prob*100).toFixed(1)}%`; renderBars(this.top3El, r.top3); setTimeout(()=>this.loop(),250); }
  pause(){ if(this.mediaStream){ this.mediaStream.getTracks().forEach(t=>t.stop()); this.mediaStream=null; } this.model&&this.model.dispose(); }
}
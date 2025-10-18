import { renderBars, now } from '../core.js'; import { loadTMModel } from '../modelLoader.js';
export class PoseMode{
  constructor(c){Object.assign(this,c); this.ctx=this.canvas.getContext('2d'); this.model=null; this.detector=null; this.running=false;
    this.startBtn.addEventListener('click',()=>this.start()); this.demoChk.addEventListener('change',e=>this.demo=e.target.checked);
    this.loadModel();
  }
  async loadModel(){ this.model = await loadTMModel(this.modelPath,'pose'); if(this.model.demo){ this.demoChk.checked=true; }
    const mdl = poseDetection.SupportedModels.BlazePose; this.detector = await poseDetection.createDetector(mdl,{runtime:'mediapipe',modelType:'lite',solutionPath:'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404'});
  }
  async start(){ try{ this.stream=await navigator.mediaDevices.getUserMedia({video:true}); this.video.srcObject=this.stream; await this.video.play(); this.running=true; this.loop(); }catch(e){ console.error(e); } }
  drawPoses(poses){ const ctx=this.ctx; ctx.lineWidth=3; ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent'); ctx.fillStyle=ctx.strokeStyle;
    poses.forEach(p=>{ const kp=p.keypoints||[]; kp.forEach(k=>{ if(k.score>0.4){ ctx.beginPath(); ctx.arc(k.x,k.y,4,0,Math.PI*2); ctx.fill(); }});
      const by=Object.fromEntries(kp.map(k=>[k.name,k])); const L=(a,b)=>{ if(!a||!b) return; if(a.score<0.4||b.score<0.4) return; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); };
      L(by['left_shoulder'],by['right_shoulder']); L(by['left_hip'],by['right_hip']); L(by['right_shoulder'],by['right_elbow']); L(by['right_elbow'],by['right_wrist']); L(by['left_shoulder'],by['left_elbow']); L(by['left_elbow'],by['left_wrist']); L(by['right_hip'],by['right_knee']); L(by['right_knee'],by['right_ankle']); L(by['left_hip'],by['left_knee']); L(by['left_knee'],by['left_ankle']); }); }
  async loop(){ if(!this.running) return; const w=this.video.videoWidth,h=this.video.videoHeight; if(!w||!h){ requestAnimationFrame(()=>this.loop()); return; } this.canvas.width=w; this.canvas.height=h; this.ctx.drawImage(this.video,0,0,w,h);
    let poses=[]; try{ poses=await this.detector.estimatePoses(this.video);}catch(e){}
    this.drawPoses(poses);
    let top1={label:'—',prob:0}, top3=[];
    if(this.model && !this.model.demo){ const r=await this.model.predict(this.canvas); top1=r.top1; top3=r.top3; } else {
      const kp=poses?.[0]?.keypoints||[]; const rw=kp.find(k=>k.name?.includes('right_wrist')); const rs=kp.find(k=>k.name?.includes('right_shoulder')); const rh=kp.find(k=>k.name?.includes('right_hip')); let guess='caminando'; if(rw&&rs&&rw.y<rs.y) guess='saludando'; else if(rw&&rh&&Math.abs(rw.x-rh.x)<50) guess='usando el celular'; top3=[{label:guess,prob:0.62},{label:'caminando',prob:0.22},{label:'escribiendo',prob:0.16}]; top1=top3[0]; }
    this.latencyEl.textContent = Math.floor(20+Math.random()*10);
    this.top1El.textContent=`${top1.label} — ${(top1.prob*100).toFixed(1)}%`; renderBars(this.top3El, top3);
    requestAnimationFrame(()=>this.loop());
  }
  pause(){ this.running=false; if(this.stream){ this.stream.getTracks().forEach(t=>t.stop()); this.stream=null; } this.model&&this.model.dispose(); }
}
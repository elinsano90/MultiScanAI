import {now} from './core.js';
export async function loadTMModel(basePath, kind){
  const modelUrl = basePath + 'model.json'; const metaUrl = basePath + 'metadata.json';
  try{ const head = await fetch(modelUrl,{method:'HEAD'}); if(!head.ok) throw 0; }catch(e){ return demo(kind); }
  if (kind==='image'){ const model = await tmImage.load(modelUrl, metaUrl); return { demo:false, async predict(input){ const t0=now(); const preds=await model.predict(input); const probs={}; preds.forEach(p=>probs[p.className]=p.probability); const arr=Object.entries(probs).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([label,prob])=>({label,prob})); return { top1:arr[0], top3:arr, latencyMs:Math.round(now()-t0) }; }, dispose(){model.dispose&&model.dispose();} }; }
  if (kind==='audio'){ return demo('audio'); }
  if (kind==='pose'){ const model = await tmPose.load(modelUrl, metaUrl); return { demo:false, async predict(canvas){ const t0=now(); const {posenetOutput} = await model.estimatePose(canvas); const pred = await model.predict(posenetOutput); const probs={}; pred.forEach(p=>probs[p.className]=p.probability); const arr=Object.entries(probs).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([label,prob])=>({label,prob})); return { top1:arr[0], top3:arr, latencyMs:Math.round(now()-t0) }; }, dispose(){} }; }
  return demo(kind);
}
function demo(kind){ const labels = kind==='image'?['libro','laptop','esfero','maleta','regla','borrador']:kind==='audio'?['carro','tren','avión','claxon']:['caminando','escribiendo','comiendo','usando el celular','saludando']; return { demo:true, async predict(){ const p=Object.fromEntries(labels.map(l=>[l,Math.random()])); const s=Object.values(p).reduce((a,b)=>a+b,0); Object.keys(p).forEach(k=>p[k]/=s); const arr=Object.entries(p).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([label,prob])=>({label,prob})); return {top1:arr[0], top3:arr, latencyMs:Math.floor(20+Math.random()*15)}; }, dispose(){} }; }

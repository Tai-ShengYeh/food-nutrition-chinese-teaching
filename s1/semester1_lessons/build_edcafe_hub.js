/* ==========================================================================
   教師工具： semester1_Edcafe批改包.html 產生器
   用法： cd next_year_plan/semester1_lessons && node build_edcafe_hub.js
   讀取同資料夾 16 個 w*.html 內的 WEEK 物件，把每週「Edcafe 批改包」
   （作業指示＋課文全文＋五大面向 rubric＋本週評分重點）整合成上一層目錄的
   教師專用網頁。修改任何課文／寫作任務後重跑一次即可同步。
   ========================================================================== */
const fs=require('fs'),path=require('path');

const RUBRIC=['評分量表（總分 100，五大面向各 20 分）',
 '1. 內容理解（20）：是否正確理解文章主題與重點，並切題回應作業。〔18-20 完整正確｜14-17 大致正確｜10-13 部分理解｜0-9 偏離主題〕',
 '2. 科學概念（20）：食品營養名詞是否使用正確。〔18-20 用詞精準｜14-17 少數錯誤｜10-13 概念模糊｜0-9 明顯錯誤〕',
 '3. 結構組織（20）：句子與段落是否清楚、有條理（開頭—內容—結尾）。〔18-20 清楚有序｜14-17 大致清楚｜10-13 鬆散｜0-9 雜亂〕',
 '4. 語言表達（20）：語法、用字、標點是否正確通順（A2 程度）。〔18-20 流暢少錯｜14-17 小錯不影響理解｜10-13 多處錯誤｜0-9 難以理解〕',
 '5. 思辨應用（20）：是否提出有根據的看法、理由或例子。〔18-20 有觀點有理由｜14-17 有觀點｜10-13 想法簡單｜0-9 未表達〕'].join('\n');

function loadWeeks(){
  return fs.readdirSync(__dirname).filter(f=>/^w\d\d_.+\.html$/.test(f)).sort().map(f=>{
    const c=fs.readFileSync(path.join(__dirname,f),'utf8');
    const i=c.indexOf('const WEEK'); if(i<0) throw new Error('WEEK not found: '+f);
    let s=c.slice(i); s=s.slice(s.indexOf('=')+1);
    const e=s.lastIndexOf('};'); if(e<0) throw new Error('WEEK end not found: '+f);
    return {file:f,W:new Function('return ('+s.slice(0,e+1)+')')()};
  });
}
function stripHtml(t){
  t=String(t||'');
  t=t.replace(/<ruby>([\s\S]*?)<rt>[\s\S]*?<\/rt><\/ruby>/g,'$1'); /* 保留漢字、去掉拼音 */
  return t.replace(/<[^>]+>/g,'');
}
function plainReading(W){
  const parts=[];
  (W.readingSections||[]).forEach(s=>{
    if(s.h)parts.push('【'+stripHtml(s.h)+'】');
    (s.p||[]).forEach(p=>parts.push(stripHtml(p)));
  });
  return parts.join('\n');
}
function buildBatch(W){
  const prompt=(W.edcafe&&W.edcafe.prompt)||W.write.goal;
  const chips=(W.write.chips||[]).map(c=>'「'+c+'」').join('、');
  const scaf=(W.write.scaffold||[]).map((s,i)=>(i+1)+'. '+s).join('\n');
  const kp=((W.edcafe&&W.edcafe.keypoints)||[]).map(k=>'- '+k).join('\n');
  return [
   '# Edcafe 自動批改作業',
   '課程：'+W.course+'　第 '+W.week+' 週　'+W.theme,
   '文章來源：'+W.source,
   '',
   '## 一、作業指示（給學生）',
   prompt,
   chips?('可用句型：'+chips):'',
   scaf?('寫作鷹架：\n'+scaf):'',
   '',
   '## 二、閱讀文本（批改時參考，判斷學生是否理解）',
   plainReading(W),
   '',
   '## 三、'+RUBRIC,
   '',
   '## 四、本週評分重點（內容理解參考）',
   kp||'- 切題、用到本週重點詞彙、表達清楚即可。',
   '',
   '## 五、給 AI 批改老師的指示',
   '這是一位中文 A2 程度越南學生的作文。請依上面五大面向各給 0–20 分、加總為 100 分；',
   '並用「簡單、鼓勵」的繁體中文寫 2–3 句回饋：先稱讚一個優點，再給一個具體、可立刻修改的建議。',
   '對 A2 學生的小語法錯誤從寬計分，重點看是否切題、是否用對本週詞彙、意思是否清楚。'
  ].filter(x=>x!=='').join('\n');
}
const batches=loadWeeks().map(({W})=>({
  week:W.week, icon:W.icon||'📖', course:W.course, theme:W.theme,
  readingTitle:stripHtml(W.readingTitle||''),
  wTitle:stripHtml((W.write&&W.write.title)||W.wTaskTitle||''),
  text:buildBatch(W)
}));
if(batches.length<15) throw new Error('expected ~16 lessons, got '+batches.length);
const payload=JSON.stringify(batches.map(b=>({week:b.week,icon:b.icon,theme:b.theme,readingTitle:b.readingTitle,wTitle:b.wTitle,text:b.text}))).replace(/</g,'\\u003c');

const html=`<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Edcafe 批改包 · 教師專用（上學期 寫作 I）</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Noto Sans TC',-apple-system,sans-serif;background:#FFFBF0;color:#22301C;line-height:1.75;padding-bottom:60px}
.wrap{max-width:900px;margin:0 auto;padding:0 18px}
.top{background:linear-gradient(135deg,#065F46,#B45309 140%);color:#fff;padding:30px 0 26px}
.top h1{font-size:1.5rem;font-weight:900}
.top .sub{opacity:.92;font-size:.92rem;margin-top:6px}
.card{background:#fff;border:1px solid #E3E8D8;border-radius:16px;padding:22px;margin:18px 0;box-shadow:0 2px 10px rgba(0,0,0,.04)}
.card h2{font-size:1.05rem;color:#065F46;margin-bottom:8px}
.steps li{margin:6px 0 6px 18px;font-size:.94rem}
.note{background:#FEF3C7;border-left:4px solid #F4A300;border-radius:8px;padding:10px 14px;font-size:.86rem;color:#78350F;margin-top:10px}
details{background:#fff;border:1px solid #E3E8D8;border-radius:14px;margin:12px 0;overflow:hidden}
summary{cursor:pointer;padding:14px 18px;font-weight:800;list-style:none;display:flex;align-items:center;gap:10px}
summary::-webkit-details-marker{display:none}
summary:hover{background:#FCFEF8}
summary .wk{flex-shrink:0;background:#065F46;color:#fff;border-radius:20px;font-size:.76rem;padding:3px 11px;font-weight:900}
summary .t{font-size:.95rem}
summary .rt{margin-left:auto;font-size:.78rem;color:#7A8C6E;font-weight:400;text-align:right}
.bd{padding:0 18px 16px}
.btnrow{display:flex;gap:10px;align-items:center;margin-bottom:10px;flex-wrap:wrap}
button{cursor:pointer;font-family:inherit;font-weight:800;font-size:.88rem;border-radius:10px;padding:9px 16px;border:1px solid #E3E8D8;background:#fff;color:#3D5236}
button.pri{border:0;background:#B45309;color:#fff}
button:hover{filter:brightness(.96)}
.msg{font-size:.85rem;font-weight:700;color:#0E9F6E}
pre{white-space:pre-wrap;font-size:.8rem;background:#0F172A;color:#E2E8F0;border-radius:10px;padding:14px;line-height:1.6;max-height:360px;overflow:auto}
footer{text-align:center;color:#7A8C6E;font-size:.8rem;margin-top:26px}
@media print{button{display:none}pre{max-height:none;color:#111;background:#fff;border:1px solid #ddd}}
</style></head>
<body>
<div class="top"><div class="wrap">
<h1>🤖 Edcafe 批改包 · 教師專用　<span style="font-size:.9rem;font-weight:700">上學期 寫作 I（16 週）</span></h1>
<div class="sub">食品營養華語文獻閱讀與寫作 ｜ 五大面向各 20 分（內容理解・科學概念・結構組織・語言表達・思辨應用）｜ 本檔在教師區 next_year_plan，學生課件頁不含此功能</div>
</div></div>
<div class="wrap">
<div class="card">
<h2>怎麼用（每週約 1 分鐘）</h2>
<ul class="steps">
<li>展開該週卡片 → 按 <b>📋 複製這週批改包</b>。</li>
<li>到 <b>Edcafe.ai → Create Assignment Grader</b>，把整段貼進指令欄（也可按 ⬇️ 先存 .md 備查）。</li>
<li>把產生的作業連結發給學生；系統依五大面向自動評分並給繁體中文回饋。</li>
</ul>
<div class="note">⚠️ 批改包適用於<b>段落級作文</b>（第 2 週起的每週寫作任務）。第 1 週及各週課前的「詞彙造句」屬句子級練習：請用學生課件內建的「⚡ 開寫暖身・句子快檢」（離線機械檢核）即可，不必送 AI 批改。<br>
🔄 本檔由 semester1_lessons/build_edcafe_hub.js 自動產生；修改任何課文或寫作任務後，在該資料夾重新執行 node build_edcafe_hub.js 即可同步。</div>
</div>
<div id="list"></div>
<footer>素材：食力 foodNEXT ｜ rubric 與 week5 LINE 批改 bot 一致 ｜ 生成日期 __GEN_DATE__</footer>
</div>
<script>
const B=__PAYLOAD__;
const list=document.getElementById('list');
B.forEach(b=>{
  const d=document.createElement('details');
  d.innerHTML='<summary><span class="wk">W'+b.week+'</span><span class="t">'+b.icon+' '+b.theme+'｜'+b.wTitle+'</span><span class="rt">'+b.readingTitle+'</span></summary>'
   +'<div class="bd"><div class="btnrow"><button class="pri">📋 複製這週批改包</button><button>⬇️ 下載 .md</button><span class="msg"></span></div><pre></pre></div>';
  d.querySelector('pre').textContent=b.text;
  const btns=d.querySelectorAll('button'),cp=btns[0],dw=btns[1],msg=d.querySelector('.msg');
  function fb(t,done){const ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand('copy');done();}catch(e){alert('請手動全選複製');}document.body.removeChild(ta);}
  cp.onclick=()=>{const done=()=>{msg.textContent='✓ 已複製！貼到 Edcafe Assignment Grader';setTimeout(()=>msg.textContent='',3500);};(navigator.clipboard&&navigator.clipboard.writeText)?navigator.clipboard.writeText(b.text).then(done,function(){fb(b.text,done);}):fb(b.text,done);};
  dw.onclick=()=>{const blob=new Blob([b.text],{type:'text/markdown;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Edcafe_W'+b.week+'.md';document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(a.href);},1500);};
  list.appendChild(d);
});
</script>
</body>
</html>
`;

const out=path.join(__dirname,'..','semester1_Edcafe批改包.html');
fs.writeFileSync(out,html.replace('__PAYLOAD__',payload).replace('__GEN_DATE__',new Date().toISOString().slice(0,10)),'utf8');
console.log('OK weeks='+json_weeks(batches)+' bytes='+fs.statSync(out).size);
function json_weeks(a){return a.length;}


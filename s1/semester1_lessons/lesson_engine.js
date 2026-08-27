/* ==========================================================================
   食品營養華語 寫作 I — 統一課程引擎 lesson_engine.js
   用法：每週 HTML 先定義 const WEEK = {...}，再 <script src="lesson_engine.js">
   引擎會注入 CSS 並依 WEEK 渲染：課文、詞彙、5 種遊戲、寫作任務、計分板。
   全離線可用（file://），不需網路與 fetch。
   ========================================================================== */
(function(){
  // 相容性：頂層 const/let 不會掛在 window 上，因此先讀詞法綁定 WEEK，再退而求其次讀 window.WEEK。
  const W = (typeof WEEK !== 'undefined') ? WEEK : (typeof window !== 'undefined' ? window.WEEK : undefined);
  if(!W){document.body.innerHTML='<p style="padding:40px;font-family:sans-serif">找不到 WEEK 資料。</p>';return;}
  const ACC = W.accent || '#34D399';

  /* ---------- inject CSS ---------- */
  const css = `
  *{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#FFFBF0;--ink:#22301C;--brown:#3D5236;--mut:#7A8C6E;--red:#E63946;--teal:#0E9F6E;--gold:#F4A300;--brand:${ACC};--line:#E3E8D8;--card:#fff;}
  body{font-family:'Noto Sans TC',-apple-system,sans-serif;background:var(--bg);color:var(--ink);line-height:1.7;padding:0 0 60px;}
  .wrap{max-width:960px;margin:0 auto;padding:0 18px;}
  .top{background:linear-gradient(135deg,${shade(ACC,-30)},${ACC} 70%,${shade(ACC,22)});color:#fff;padding:28px 0 24px;}
  .top .wrap{display:flex;flex-direction:column;gap:6px;}
  .kick{font-size:.78rem;font-weight:700;letter-spacing:.14em;color:rgba(255,255,255,.85);}
  .top h1{font-size:1.6rem;font-weight:900;}
  .top .sub{font-size:.92rem;color:rgba(255,255,255,.92);}
  .top .meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}
  .top .meta span{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);padding:4px 12px;border-radius:20px;font-size:.78rem;}
  .nav{position:sticky;top:0;z-index:50;background:rgba(255,251,240,.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);}
  .nav .wrap{display:flex;gap:6px;overflow-x:auto;padding:10px 18px;}
  .nav a{white-space:nowrap;text-decoration:none;color:var(--brown);font-weight:700;font-size:.84rem;padding:7px 12px;border-radius:18px;border:1px solid var(--line);background:#fff;transition:.15s;}
  .nav a:hover{border-color:var(--brand);color:var(--brand);}
  .score-strip{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 18px;margin:18px 0;box-shadow:0 2px 8px rgba(0,0,0,.04);flex-wrap:wrap;}
  .score-strip b{font-size:1.02rem;}
  .stars{font-size:1.2rem;letter-spacing:2px;color:var(--gold);}
  .total-pill{background:${tint(ACC)};color:${shade(ACC,-40)};font-weight:900;padding:6px 16px;border-radius:20px;font-family:monospace;}
  section{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px 22px;margin:18px 0;box-shadow:0 2px 10px rgba(0,0,0,.04);}
  section h2{font-size:1.28rem;color:${shade(ACC,-34)};margin-bottom:4px;display:flex;align-items:center;gap:9px;}
  section .lead{color:var(--mut);font-size:.9rem;margin-bottom:16px;}
  .reading{font-size:1.12rem;line-height:2.05;}
  .reading p{margin-bottom:14px;}
  .reading ruby rt{font-size:.6em;color:${shade(ACC,-30)};font-weight:700;}
  .kw{background:#FEF3C7;border-bottom:2px solid var(--gold);border-radius:3px;padding:0 2px;font-weight:700;}
  .note{background:${tint(ACC)};border-left:4px solid var(--brand);border-radius:8px;padding:12px 16px;font-size:.92rem;color:var(--brown);margin-top:8px;}
  .reading h3.rsub{font-size:1.06rem;color:${shade(ACC,-34)};margin:16px 0 6px;padding-left:10px;border-left:4px solid var(--brand);}
  .wordcount{font-size:.8rem;color:var(--mut);margin:2px 0 12px;}
  .vgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;}
  .vc{border:1px solid var(--line);border-radius:12px;padding:14px;background:#FCFEF8;}
  .vc .w{font-size:1.22rem;font-weight:900;}
  .vc .py{font-family:monospace;color:${shade(ACC,-30)};font-size:.82rem;margin:2px 0 6px;}
  .vc .vn{color:var(--red);font-size:.85rem;font-weight:700;}
  .vc .ex{color:var(--brown);font-size:.85rem;margin-top:5px;}
  .bar{display:flex;justify-content:space-between;align-items:center;background:#FCFEF8;border:1px solid var(--line);border-radius:10px;padding:9px 15px;margin-bottom:14px;font-weight:700;font-size:.9rem;}
  .bar .v{font-family:monospace;color:var(--teal);}
  .bar .e{font-family:monospace;color:var(--red);}
  .btn{display:inline-block;padding:11px 26px;background:var(--brand);color:#fff;border:none;border-radius:22px;font-weight:700;cursor:pointer;font-size:.95rem;margin-top:6px;}
  .btn:hover{filter:brightness(.93);}
  .btn.ghost{background:#fff;color:${shade(ACC,-34)};border:2px solid var(--brand);}
  .fb{margin-top:12px;padding:12px;border-radius:10px;text-align:center;font-weight:700;display:none;}
  .fb.show{display:block;}
  .fb.ok{background:#E8F4F2;color:var(--teal);}
  .fb.no{background:#FFE5E7;color:var(--red);}
  .done{display:none;margin-top:14px;background:${tint(ACC)};border:1px solid ${tint(ACC,true)};border-radius:12px;padding:16px;text-align:center;}
  .done.show{display:block;}
  .done .pts{font-size:1.5rem;font-weight:900;color:var(--teal);}
  .board{display:grid;grid-template-columns:1fr 1.4fr;gap:14px;}
  .col h3{font-size:.92rem;color:var(--brown);margin-bottom:9px;padding-bottom:5px;border-bottom:2px solid var(--gold);}
  .item{background:#fff;border:2px solid var(--line);border-radius:10px;padding:12px 14px;margin-bottom:9px;cursor:pointer;min-height:54px;display:flex;align-items:center;justify-content:space-between;transition:.18s;}
  .item:hover{border-color:var(--gold);}
  .item.sel{border-color:var(--brand);background:${tint(ACC)};}
  .item.ok{background:#E8F4F2;border-color:var(--teal);color:var(--teal);opacity:.6;cursor:default;}
  .item.ok::after{content:'✓';font-size:1.3rem;}
  .item.bad{animation:shake .4s;border-color:var(--red);}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}
  .item .zh{font-weight:900;font-size:1.12rem;}
  .item .py{display:block;color:var(--mut);font-family:monospace;font-size:.72rem;}
  .item .df{font-size:.92rem;}
  .q{border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:14px;background:#FCFEF8;}
  .q .stem{font-size:1.04rem;font-weight:700;margin-bottom:12px;}
  .q .stem .n{display:inline-block;width:26px;height:26px;background:var(--brand);color:#fff;border-radius:50%;text-align:center;line-height:26px;font-size:.84rem;margin-right:8px;}
  .opts{display:flex;flex-wrap:wrap;gap:10px;}
  .opt{flex:1;min-width:120px;border:2px solid var(--line);border-radius:10px;padding:11px 14px;cursor:pointer;text-align:center;font-weight:700;transition:.15s;background:#fff;}
  .opt:hover{border-color:var(--brand);}
  .opt.pick{border-color:var(--brand);background:${tint(ACC)};}
  .opt.right{border-color:var(--teal);background:#E8F4F2;color:var(--teal);}
  .opt.wrong{border-color:var(--red);background:#FFE5E7;color:var(--red);}
  .exp{font-size:.88rem;color:var(--brown);margin-top:10px;padding-top:10px;border-top:1px dashed var(--line);display:none;}
  .exp.show{display:block;}
  .pool,.answer{display:flex;flex-wrap:wrap;gap:8px;min-height:54px;border:2px dashed var(--line);border-radius:10px;padding:12px;margin-bottom:10px;}
  .answer{border-style:solid;background:#FCFEF8;}
  .tok{background:#fff;border:2px solid var(--brand);color:${shade(ACC,-34)};border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;font-size:1rem;}
  .tok:hover{background:${tint(ACC)};}
  .rlabel{font-size:.82rem;color:var(--mut);margin-bottom:5px;font-weight:700;}
  .qwarm{background:${tint(ACC)};border:1px dashed ${shade(ACC,-10)};border-radius:12px;padding:12px 14px;margin:8px 0 14px;}
  .qcrow{display:flex;gap:8px;margin:6px 0;}
  .qcrow input{flex:1;border:1px solid var(--line);border-radius:10px;padding:9px 12px;font-family:inherit;font-size:.98rem;background:#fff;}
  .qcrow button{cursor:pointer;flex-shrink:0;border:0;background:var(--brand);color:#fff;font-weight:900;padding:9px 16px;border-radius:10px;font-family:inherit;font-size:.9rem;}
  .qcrow button:hover{filter:brightness(.95);}
  #qcList{list-style:none;display:flex;flex-direction:column;gap:4px;margin:8px 0 2px;}
  #qcList li{font-size:.88rem;font-weight:700;}
  #qcList li.ok{color:var(--teal);}
  #qcList li.bad{color:var(--red);}
  .qhint{font-size:.78rem;color:var(--mut);margin-top:6px;line-height:1.55;}
  .scaf{display:flex;flex-direction:column;gap:8px;margin:6px 0 12px;}
  .scaf .step{display:flex;gap:10px;align-items:flex-start;font-size:.95rem;color:var(--brown);}
  .scaf .b{flex-shrink:0;width:24px;height:24px;border-radius:50%;background:var(--red);color:#fff;font-weight:900;font-size:.8rem;display:flex;align-items:center;justify-content:center;}
  .write-box{width:100%;min-height:120px;border:1px solid var(--line);border-radius:10px;padding:12px;font-family:inherit;font-size:1rem;line-height:1.7;resize:vertical;}
  .chips{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0;}
  .chips .c{background:${tint(ACC)};border:1px solid ${tint(ACC,true)};color:${shade(ACC,-40)};border-radius:16px;padding:5px 12px;font-size:.84rem;font-weight:700;}
  .counter{font-size:.82rem;color:var(--mut);margin-top:6px;text-align:right;}
  .pager{display:flex;justify-content:space-between;gap:10px;margin:18px 0;}
  .pager a{text-decoration:none;font-weight:700;font-size:.9rem;color:${shade(ACC,-34)};background:#fff;border:1px solid var(--line);border-radius:22px;padding:10px 18px;}
  .pager a:hover{border-color:var(--brand);}
  .pager a.disabled{opacity:.4;pointer-events:none;}
  .spk{border:0;background:transparent;cursor:pointer;font-size:1rem;padding:2px 5px;border-radius:6px;line-height:1;}
  .spk:hover{background:${tint(ACC)};}
  .chartbox{background:#FCFEF8;border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:12px 0;}
  .chartbox .ct{font-weight:900;font-size:.92rem;color:${shade(ACC,-34)};margin-bottom:10px;}
  .chartbox .csrc{font-size:.72rem;color:var(--mut);margin-top:8px;}
  .crow{display:flex;align-items:center;gap:8px;margin:7px 0;}
  .crow .clab{flex:0 0 96px;font-size:.85rem;font-weight:700;text-align:right;}
  .crow .cbar{height:24px;background:linear-gradient(90deg,${shade(ACC,10)},${ACC});border-radius:6px;color:#fff;font-size:.75rem;font-weight:900;display:flex;align-items:center;justify-content:flex-end;padding:0 8px;min-width:36px;}
  footer{text-align:center;color:var(--mut);font-size:.8rem;margin-top:24px;}
  @media(max-width:600px){
    .board{grid-template-columns:1fr 1.25fr;gap:8px;}
    .item{padding:9px 10px;min-height:46px;}
    .item .zh{font-size:1rem;}
    .item .df{font-size:.82rem;}
    .item .py{font-size:.64rem;}
    .opts{flex-direction:column;}
    .nav::after{content:'';position:absolute;right:0;top:0;bottom:0;width:26px;background:linear-gradient(90deg,rgba(255,251,240,0),rgba(255,251,240,.95));pointer-events:none;}
  }
  `;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  // 字型改用 <link> 非同步載入（取代 CSS @import）：無網路時自動退回系統字，不阻塞渲染
  const fl=document.createElement('link');fl.rel='stylesheet';
  fl.href='https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap';
  document.head.appendChild(fl);
  document.title=`第 ${W.week} 週 · ${W.theme}｜寫作 I 互動課程`;

  /* ---------- helpers ---------- */
  function shade(hex,amt){ // amt -100..100 (neg darker)
    const c=hex.replace('#','');const r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16);
    const f=v=>Math.max(0,Math.min(255,Math.round(v+(amt/100)*(amt<0?v:255-v))));
    return '#'+[f(r),f(g),f(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  function tint(hex,border){return border?hexA(hex,.32):hexA(hex,.12);}
  function hexA(hex,a){const c=hex.replace('#','');const r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16);return `rgba(${r},${g},${b},${a})`;}
  function esc(s){return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function el(html){const t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstChild;}

  /* ---------- build skeleton ---------- */
  const totalGames=5;
  document.body.innerHTML=`
  <div class="top"><div class="wrap">
    <span class="kick">${esc(W.course)} ｜ ${esc(W.unit)}</span>
    <h1>${esc(W.icon||'📘')} 第 ${W.week} 週 · ${esc(W.theme)}</h1>
    <div class="sub">素材：${esc(W.source)}</div>
    <div class="meta">
      <span>📖 閱讀技能：${esc(W.rSkill)}</span>
      <span>✍️ 寫作：${esc(W.wTaskTitle)}</span>
      <span>🎯 CEFR A2</span>
      <span>🇻🇳 含越南文對照</span>
    </div>
  </div></div>
  <div class="nav"><div class="wrap">
    ${W.review&&W.review.length?'<a href="#review">🔄 複習</a>':''}
    <a href="#read">📖 課文</a><a href="#vocab">🔑 詞彙</a><a href="#g1">🎮 配對</a>
    <a href="#g2">✅ 是非</a><a href="#g3">🧩 重組</a><a href="#g4">🧠 情境</a>
    <a href="#g5">✏️ 填空</a><a href="#write">✍️ 寫作</a><a href="#edcafe">🤖 Edcafe</a>
    <a href="index.html">📚 全部課程</a>
  </div></div>
  <div class="wrap">
    <div class="score-strip">
      <div><b>🏆 今日總分</b> <span class="stars" id="stars">☆☆☆☆☆</span></div>
      <div>完成遊戲：<span id="doneCount" style="font-weight:900;color:var(--brand)">0</span> / 5</div>
      <div id="stuChip" style="cursor:pointer;font-size:.86rem" title="點一下可以改姓名">👤 <span id="stuName">點我登記姓名</span> <span id="cloudSt"></span></div>
      <div class="total-pill"><span id="totalPts">0</span> / 500</div>
    </div>

    ${W.review&&W.review.length?`<section id="review"><h2>🔄 上週複習</h2>
      <p class="lead">開始新課之前，先回想上週學過的。點選答案馬上知道對不對，不算分。</p>
      <div id="revHost"></div>
    </section>`:''}

    <section id="read"><h2>📖 課文 · ${esc(W.readingTitle||W.theme)}</h2>
      <p class="lead">先讀一遍，再讀第二遍。黃色的詞是本週重點。</p>
      <div class="reading" id="readBody"></div>
      <div class="wordcount" id="wcReading"></div>
      ${W.readingNote?`<div class="note">💡 ${W.readingNote}</div>`:''}
    </section>

    <section id="vocab"><h2>🔑 核心詞彙 · ${W.vocab.length} 個</h2>
      <p class="lead">中文、拼音、越南文（tiếng Việt）、解釋與例句。</p>
      <div class="vgrid" id="vgrid"></div>
    </section>

    <section id="g1"><h2>🎮 遊戲一 · 詞義配對</h2>
      <p class="lead">點左邊的詞 → 再點右邊的意思。配錯會扣分喔！</p>
      <div class="bar"><div>進度 <span class="v" id="g1prog">0 / ${W.g1.length}</span></div><div>錯誤 <span class="e" id="g1err">0</span></div></div>
      <div class="board"><div class="col"><h3>📚 詞</h3><div id="g1L"></div></div><div class="col"><h3>💡 意思</h3><div id="g1R"></div></div></div>
      <div class="fb" aria-live="polite" id="g1fb"></div>
      <div class="done" aria-live="polite" id="g1done"><div class="pts">+<span id="g1pts">100</span> 分</div><p>配對完成！</p><button class="btn ghost" id="g1reset">🔄 再玩一次</button></div>
    </section>

    <section id="g2"><h2>✅ 遊戲二 · 是非題</h2><p class="lead">根據課文，判斷對 ✔ 或 錯 ✘。</p>
      <div id="g2host"></div><button class="btn" id="g2btn">送出答案</button>
      <div class="done" aria-live="polite" id="g2done"><div class="pts">+<span id="g2pts">0</span> 分</div><p id="g2msg"></p><button class="btn ghost" id="g2reset">🔄 再玩一次</button></div>
    </section>

    <section id="g3"><h2>🧩 遊戲三 · 句子重組</h2><p class="lead">點詞語，排成一句通順的句子。學會句型，寫作用得到！</p>
      <div id="g3host"></div>
      <div class="done" aria-live="polite" id="g3done"><div class="pts">+<span id="g3pts">0</span> 分</div><p>重組完成！</p><button class="btn ghost" id="g3reset">🔄 再玩一次</button></div>
    </section>

    <section id="g4"><h2>🧠 遊戲四 · 情境決策</h2><p class="lead">遇到下面的情況，選一個最好的做法。</p>
      <div id="g4host"></div><button class="btn" id="g4btn">送出答案</button>
      <div class="done" aria-live="polite" id="g4done"><div class="pts">+<span id="g4pts">0</span> 分</div><p id="g4msg"></p><button class="btn ghost" id="g4reset">🔄 再玩一次</button></div>
    </section>

    <section id="g5"><h2>✏️ 遊戲五 · 選詞填空</h2><p class="lead">選出最合適的詞，填進句子裡。</p>
      <div id="g5host"></div><button class="btn" id="g5btn">送出答案</button>
      <div class="done" aria-live="polite" id="g5done"><div class="pts">+<span id="g5pts">0</span> 分</div><p id="g5msg"></p><button class="btn ghost" id="g5reset">🔄 再玩一次</button></div>
    </section>

    <section id="write"><h2>✍️ 寫作任務 · ${esc(W.write.title||W.wTaskTitle)}</h2>
      <p class="lead">${esc(W.write.goal)}</p>
      <div class="qwarm">
        <div class="rlabel">⚡ 開寫暖身：挑一個本週詞彙，造一句先自己快檢</div>
        <div class="qcrow"><input id="qcInput" placeholder="用一個本週詞彙，寫一個完整的句子…"><button type="button" id="qcBtn">🔍 快檢</button></div>
        <ul id="qcList"></ul>
        <p class="qhint">離線機械檢核、即時且不算分：只查「有用本週詞彙／長度至少 6 字／句尾標點／是否照抄例句」。整段短文才交給老師，或由老師放到 Edcafe AI 批改。</p>
      </div>
      <div class="rlabel">🪜 寫作鷹架（跟著步驟做）</div>
      <div class="scaf" id="scaf"></div>
      <div class="rlabel">可用句型：</div>
      <div class="chips" id="wchips"></div>
      <textarea class="write-box" id="wbox" placeholder="${esc(W.write.placeholder||'')}"></textarea>
      <div class="counter"><span id="wcount">0</span> 字</div>
      <div class="note" id="edcafe">📌 老師批改看五點：內容理解、科學概念、結構組織、語言表達、思辨應用（每項 20 分）。寫完可截圖或用 Edcafe／LINE 作文批改傳給老師。</div>
    </section>

    <div class="pager">
      <a id="prev" href="#">← 上一週</a>
      <a href="index.html">📚 課程目錄</a>
      <a id="next" href="#">下一週 →</a>
    </div>
    <footer>食品營養華語文獻閱讀與寫作 I ｜ 第 ${W.week} 週 ｜ 素材：食力 foodNEXT ｜ 繁體中文（台灣用語）</footer>
  </div>`;

  /* ---------- 學習紀錄：Firebase Firestore + Supabase 雙寫 ----------
     沿用 my-teaching-tools-517a0 既有架構（同 fpvn / mcd 課程的 game_results 模式）：
     - Firestore collection：vncs1_results（規則維護在 week_food_packaging_vn/firestore.rules）
     - Supabase：public.interactions（course_code='vn-chinese-s1'）
     離線（file:// 或無網路）時安靜降級：分數照常顯示，只是不上傳。 */
  const TK={
    fb:{apiKey:"AIzaSyCTLhRf7jcJH_AwUzbV4MawkrKNPrIVG5Y",authDomain:"my-teaching-tools-517a0.firebaseapp.com",projectId:"my-teaching-tools-517a0",storageBucket:"my-teaching-tools-517a0.firebasestorage.app",messagingSenderId:"244288457011",appId:"1:244288457011:web:4b3ff8a846a6c50b169646"},
    fbVer:'10.7.0', col:'vncs1_results',
    sbUrl:'https://qmldcjkllisvfgegkfsz.supabase.co',
    sbKey:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGRjamtsbGlzdmZnZWdrZnN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMjM5ODYsImV4cCI6MjA4NjY5OTk4Nn0.Bfj0W7HN_n_vcjGe5502Chamk0YV-de8a0fxF4Nyczk',
    sbTable:'interactions', course:'vn-chinese-s1',
    nameKey:'vncs1_student_name', anonIdKey:'vncs1_anon_id'
  };
  const GAME_NAMES={g1:'詞義配對',g2:'是非題',g3:'句子重組',g4:'情境決策',g5:'選詞填空'};
  const pad2=n=>String(n).padStart(2,'0');
  const SESSION_ID='vncs1_w'+pad2(W.week)+'_'+new Date().toISOString().slice(0,10).replace(/-/g,'');
  function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  function hash(s){let h=5381;for(let i=0;i<s.length;i++){h=((h<<5)+h+s.charCodeAt(i))>>>0;}return h.toString(36);}
  function askName(){
    const cur=lsGet(TK.nameKey)||'';
    const v=window.prompt('請輸入你的姓名或座號（老師記錄成績用）：',cur);
    if(v===null)return;
    lsSet(TK.nameKey,v.trim());stuChipRefresh();
  }
  function getStudent(){
    let name=lsGet(TK.nameKey);
    if(name===null){askName();name=lsGet(TK.nameKey);}
    name=(name||'').trim();
    if(name)return{name,id:'stu_'+hash(name)};
    let anon=lsGet(TK.anonIdKey);
    if(!anon){anon='anon_'+Math.random().toString(36).slice(2,10);lsSet(TK.anonIdKey,anon);}
    return{name:'',id:anon};
  }
  function stuChipRefresh(){
    const n=(lsGet(TK.nameKey)||'').trim();
    document.getElementById('stuName').textContent=n||'點我登記姓名';
  }
  document.getElementById('stuChip').onclick=askName;
  stuChipRefresh();
  let _fb=null;
  async function fbEnsure(){
    if(_fb)return _fb;
    const app=await import(`https://www.gstatic.com/firebasejs/${TK.fbVer}/firebase-app.js`);
    const fs=await import(`https://www.gstatic.com/firebasejs/${TK.fbVer}/firebase-firestore.js`);
    const db=fs.getFirestore(app.initializeApp(TK.fb));
    _fb={db,addDoc:fs.addDoc,collection:fs.collection,serverTimestamp:fs.serverTimestamp};
    return _fb;
  }
  async function fbRecord(p){
    try{
      const fb=await fbEnsure();
      await fb.addDoc(fb.collection(fb.db,TK.col),{...p,completedAt:fb.serverTimestamp(),ua:navigator.userAgent.substring(0,100)});
      return true;
    }catch(e){console.warn('[Firebase] write failed:',e);return false;}
  }
  async function sbRecord(p){
    try{
      const row={course_code:TK.course,session_id:p.sessionId,student_id:p.studentId,student_name:p.studentName||'',
        game_id:p.gameId,game_name:p.gameName||'',score:Number(p.score)||0,wrong:Number(p.wrong)||0,total:Number(p.total)||0,
        duration_ms:0,client_meta:{ua:navigator.userAgent.substring(0,100),...(p.meta||{})}};
      const res=await fetch(`${TK.sbUrl}/rest/v1/${TK.sbTable}`,{method:'POST',
        headers:{'apikey':TK.sbKey,'Authorization':`Bearer ${TK.sbKey}`,'Content-Type':'application/json','Prefer':'return=minimal'},
        body:JSON.stringify(row)});
      if(!res.ok){console.warn('[Supabase] HTTP',res.status,await res.text());return false;}
      return true;
    }catch(e){console.warn('[Supabase] write failed:',e);return false;}
  }
  function sendRecord(g,pts){
    let payload;
    try{
      const stu=getStudent();
      payload={studentId:stu.id,studentName:stu.name,sessionId:SESSION_ID,
        gameId:'w'+pad2(W.week)+'_'+g,gameName:GAME_NAMES[g]||g,score:pts,total:100,wrong:0,
        meta:{week:W.week,theme:W.theme}};
    }catch(e){console.warn('[track]',e);return;}
    Promise.all([fbRecord(payload),sbRecord(payload)]).then(([f,s])=>{
      const st=document.getElementById('cloudSt');
      if(!st)return;
      if(f||s){st.textContent='☁️✓';st.title='成績已上傳'+(f&&s?'（Firebase＋Supabase）':f?'（Firebase）':'（Supabase）');}
      else{st.textContent='📴';st.title='目前離線：成績只顯示在這一頁，沒有上傳';}
    });
  }

  /* ---------- scoreboard ---------- */
  const SCORES={g1:0,g2:0,g3:0,g4:0,g5:0},DONE={g1:false,g2:false,g3:false,g4:false,g5:false};
  function award(g,pts){SCORES[g]=pts;DONE[g]=true;refresh();sendRecord(g,pts);}
  function refresh(){
    const total=Object.values(SCORES).reduce((a,b)=>a+b,0);
    const n=Object.values(DONE).filter(Boolean).length;
    document.getElementById('totalPts').textContent=total;
    document.getElementById('doneCount').textContent=n;
    const f=Math.round(total/100);
    document.getElementById('stars').textContent='★'.repeat(f)+'☆'.repeat(5-f);
  }

  /* ---------- 上週複習（不算分，即點即回饋） ----------
     資料格式：W.review=[{s:'題目',o:['選項…'],a:正解索引,e:'解說（可省略）'},…]，
     內容取自上一週的重點，做間隔重複（spaced repetition）。 */
  if(W.review&&W.review.length){
    const h=document.getElementById('revHost');
    W.review.forEach((q,i)=>{
      const opts=shuffle(q.o.map((t,k)=>({t,k}))).map(o=>`<div class="opt" role="button" tabindex="0" data-k="${o.k}">${esc(o.t)}</div>`).join('');
      h.insertAdjacentHTML('beforeend',`<div class="q"><div class="stem"><span class="n">${i+1}</span>${esc(q.s)}</div><div class="opts">${opts}</div><div class="exp">${esc(q.e||'')}</div></div>`);
      const box=h.lastElementChild;
      box.querySelectorAll('.opt').forEach(o=>o.onclick=()=>{
        if(box.dataset.done)return;box.dataset.done='1';
        box.querySelectorAll('.opt').forEach(x=>x.style.pointerEvents='none');
        box.querySelector(`.opt[data-k="${q.a}"]`).classList.add('right');
        if(+o.dataset.k!==q.a)o.classList.add('wrong');
        if(q.e)box.querySelector('.exp').classList.add('show');
      });
    });
  }

  /* ---------- 發音（Web Speech 聽力輔助；裝置沒有中文語音時按了沒聲音，不影響其他功能） ---------- */
  const hasTTS=('speechSynthesis' in window)&&('SpeechSynthesisUtterance' in window);
  function speak(t){
    if(!hasTTS||!t)return;
    try{
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(t);
      const v=speechSynthesis.getVoices().find(x=>/^zh([-_]|$)|cmn/i.test(x.lang||''));
      if(v)u.voice=v;
      u.lang='zh-TW';u.rate=.85;
      speechSynthesis.speak(u);
    }catch(e){}
  }
  if(hasTTS){
    document.addEventListener('click',e=>{
      const b=e.target.closest('.spk');
      if(b){e.stopPropagation();e.preventDefault();speak(b.dataset.t);}
    },true);
  }

  /* ---------- 鍵盤操作：Enter／空白鍵等同點擊（選項與配對卡） ---------- */
  document.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ')&&e.target.classList&&
       (e.target.classList.contains('opt')||e.target.classList.contains('item'))){
      e.preventDefault();e.target.click();
    }
  });

  /* ---------- reading + vocab ---------- */
  const rb=document.getElementById('readBody');
  function plainReading(){
    let parts=[];
    if(W.readingSections){W.readingSections.forEach(s=>{if(s.h)parts.push('【'+s.h+'】');(s.p||[]).forEach(p=>parts.push(p));});}
    else {(W.reading||[]).forEach(p=>parts.push(p));}
    return parts.join('\n').replace(/<rt>.*?<\/rt>/g,'').replace(/<[^>]+>/g,'');
  }
  if(W.readingSections){
    W.readingSections.forEach(s=>{
      if(s.h) rb.insertAdjacentHTML('beforeend',`<h3 class="rsub">${esc(s.h)}</h3>`);
      (s.p||[]).forEach(p=>rb.insertAdjacentHTML('beforeend',`<p>${p}</p>`));
    });
  } else {
    (W.reading||[]).forEach(p=>rb.insertAdjacentHTML('beforeend',`<p>${p}</p>`));
  }
  document.getElementById('wcReading').textContent='📏 課文約 '+plainReading().replace(/[\s\n【】]/g,'').length+' 字';
  const vg=document.getElementById('vgrid');
  W.vocab.forEach(v=>vg.insertAdjacentHTML('beforeend',
    `<div class="vc"><div class="w">${esc(v.w)}${hasTTS?` <button class="spk" data-t="${esc(v.w)}" title="聽發音">🔊</button>`:''}</div><div class="py">${esc(v.py)}</div><div class="vn">🇻🇳 ${esc(v.vn)}</div><div class="ex">${esc(v.df)}${v.ex?`<br><span style="color:var(--mut)">例：${esc(v.ex)}</span>`:''}</div></div>`));

  /* ---------- G1 match ---------- */
  (function(){
    const pairs=W.g1;let lsel,rsel,matched,err;
    function render(){
      matched=0;err=0;lsel=rsel=null;
      document.getElementById('g1prog').textContent=`0 / ${pairs.length}`;
      document.getElementById('g1err').textContent='0';
      document.getElementById('g1done').classList.remove('show');
      const L=document.getElementById('g1L'),R=document.getElementById('g1R');L.innerHTML='';R.innerHTML='';
      shuffle(pairs).forEach(p=>{const e=document.createElement('div');e.className='item';e.tabIndex=0;e.setAttribute('role','button');e.dataset.zh=p.zh;
        e.innerHTML=`<span><span class="zh">${esc(p.zh)}</span><span class="py">${esc(p.py||'')}</span></span>${hasTTS?`<button class="spk" data-t="${esc(p.zh)}" title="聽發音">🔊</button>`:''}`;e.onclick=()=>pick(e,'L');L.appendChild(e);});
      shuffle(pairs).forEach(p=>{const e=document.createElement('div');e.className='item';e.tabIndex=0;e.setAttribute('role','button');e.dataset.zh=p.zh;
        e.innerHTML=`<span class="df">${esc(p.df)}</span>`;e.onclick=()=>pick(e,'R');R.appendChild(e);});
    }
    function pick(elx,side){
      if(elx.classList.contains('ok'))return;
      document.querySelectorAll(side==='L'?'#g1L .item.sel':'#g1R .item.sel').forEach(x=>x.classList.remove('sel'));
      elx.classList.add('sel');if(side==='L')lsel=elx;else rsel=elx;check();
    }
    function check(){
      if(!lsel||!rsel)return;const fb=document.getElementById('g1fb');
      if(lsel.dataset.zh===rsel.dataset.zh){
        [lsel,rsel].forEach(x=>{x.classList.add('ok');x.classList.remove('sel');});matched++;
        document.getElementById('g1prog').textContent=`${matched} / ${pairs.length}`;
        fb.className='fb show ok';fb.textContent='✓ 配對成功！';setTimeout(()=>fb.classList.remove('show'),900);
        lsel=rsel=null;
        if(matched===pairs.length){const pts=Math.max(20,100-err*10);document.getElementById('g1pts').textContent=pts;
          document.getElementById('g1done').classList.add('show');award('g1',pts);}
      }else{
        err++;document.getElementById('g1err').textContent=err;const a=lsel,b=rsel;[a,b].forEach(x=>x.classList.add('bad'));
        fb.className='fb show no';fb.textContent='✗ 不對，再想想看！';
        setTimeout(()=>{[a,b].forEach(x=>x.classList.remove('bad','sel'));fb.classList.remove('show');},700);lsel=rsel=null;
      }
    }
    document.getElementById('g1reset').onclick=render;render();
  })();

  /* ---------- G2 true/false ---------- */
  (function(){
    const Q=W.g2;let picks=[];
    function render(){
      picks=Q.map(()=>null);const h=document.getElementById('g2host');h.innerHTML='';
      document.getElementById('g2done').classList.remove('show');document.getElementById('g2btn').style.display='';
      Q.forEach((q,i)=>{h.insertAdjacentHTML('beforeend',
        `<div class="q" id="g2q${i}"><div class="stem"><span class="n">${i+1}</span>${esc(q.t)}</div>
        <div class="opts"><div class="opt" role="button" tabindex="0" data-v="1">對 ✔</div><div class="opt" role="button" tabindex="0" data-v="0">錯 ✘</div></div><div class="exp">${esc(q.e)}</div></div>`);
        const box=h.lastElementChild;box.querySelectorAll('.opt').forEach(o=>o.onclick=()=>{
          picks[i]=o.dataset.v==='1';box.querySelectorAll('.opt').forEach(x=>x.classList.remove('pick'));o.classList.add('pick');});
      });
    }
    document.getElementById('g2btn').onclick=function(){
      if(picks.includes(null)){alert('還有題目沒作答喔！');return;}
      let c=0;Q.forEach((q,i)=>{const box=document.getElementById('g2q'+i),opts=box.querySelectorAll('.opt');
        opts.forEach(o=>o.style.pointerEvents='none');opts[q.a?0:1].classList.add('right');
        if(picks[i]===q.a)c++;else opts[picks[i]?0:1].classList.add('wrong');box.querySelector('.exp').classList.add('show');});
      const pts=Math.round(c/Q.length*100);document.getElementById('g2pts').textContent=pts;
      document.getElementById('g2msg').textContent=`答對 ${c} / ${Q.length} 題`;
      this.style.display='none';document.getElementById('g2done').classList.add('show');award('g2',pts);
    };
    document.getElementById('g2reset').onclick=render;render();
  })();

  /* ---------- G3 reorder ---------- */
  (function(){
    const S=W.g3;let state;
    function render(){
      state=S.map(s=>({ok:false}));const h=document.getElementById('g3host');h.innerHTML='';
      document.getElementById('g3done').classList.remove('show');
      S.forEach((s,i)=>{
        h.insertAdjacentHTML('beforeend',
        `<div style="margin-bottom:18px"><div class="rlabel">${esc(s.label)}（排對會變綠色）</div>
         <div class="rlabel">你的答案：</div><div class="answer" id="g3a${i}"></div>
         <div class="rlabel">點下面的詞：</div><div class="pool" id="g3p${i}"></div></div>`);
        const pool=document.getElementById('g3p'+i);
        shuffle(s.tokens.map((t,idx)=>({t,idx}))).forEach(o=>{
          const b=document.createElement('button');b.className='tok';b.textContent=o.t;b.dataset.idx=o.idx;
          b.onclick=()=>move(i,b,'a');pool.appendChild(b);});
      });
    }
    function move(i,btn,to){
      const a=document.getElementById('g3a'+i),p=document.getElementById('g3p'+i);
      if(to==='a'){a.appendChild(btn);btn.onclick=()=>move(i,btn,'p');}else{p.appendChild(btn);btn.onclick=()=>move(i,btn,'a');}
      const seq=[...a.querySelectorAll('.tok')].map(b=>+b.dataset.idx);
      const ok=seq.length===S[i].tokens.length&&seq.every((v,k)=>v===k);
      a.style.borderColor=ok?'var(--teal)':'var(--line)';a.style.background=ok?'#E8F4F2':'#FCFEF8';state[i].ok=ok;
      if(state.every(s=>s.ok)){document.getElementById('g3pts').textContent=100;document.getElementById('g3done').classList.add('show');award('g3',100);}
    }
    document.getElementById('g3reset').onclick=render;render();
  })();

  /* ---------- G4 decision ---------- */
  (function(){
    const Q=W.g4;let picks=[];
    function render(){
      picks=Q.map(()=>null);const h=document.getElementById('g4host');h.innerHTML='';
      document.getElementById('g4done').classList.remove('show');document.getElementById('g4btn').style.display='';
      Q.forEach((q,i)=>{
        const opts=shuffle(q.o.map((t,k)=>({t,k}))).map(o=>`<div class="opt" role="button" tabindex="0" style="flex:1 1 100%" data-k="${o.k}">${esc(o.t)}</div>`).join('');
        h.insertAdjacentHTML('beforeend',`<div class="q" id="g4q${i}"><div class="stem"><span class="n">${i+1}</span>${esc(q.s)}</div><div class="opts" style="flex-direction:column">${opts}</div><div class="exp">${esc(q.e||q.w||'')}</div></div>`);
        const box=h.lastElementChild;box.querySelectorAll('.opt').forEach(o=>o.onclick=()=>{
          picks[i]=+o.dataset.k;box.querySelectorAll('.opt').forEach(x=>x.classList.remove('pick'));o.classList.add('pick');});
      });
    }
    document.getElementById('g4btn').onclick=function(){
      if(picks.includes(null)){alert('還有情境沒選喔！');return;}
      let c=0;Q.forEach((q,i)=>{const box=document.getElementById('g4q'+i),opts=box.querySelectorAll('.opt');
        opts.forEach(o=>o.style.pointerEvents='none');box.querySelector(`.opt[data-k="${q.a}"]`).classList.add('right');
        if(picks[i]===q.a)c++;else box.querySelector(`.opt[data-k="${picks[i]}"]`).classList.add('wrong');box.querySelector('.exp').classList.add('show');});
      const pts=Math.round(c/Q.length*100);document.getElementById('g4pts').textContent=pts;
      document.getElementById('g4msg').textContent=`答對 ${c} / ${Q.length} 題`;
      this.style.display='none';document.getElementById('g4done').classList.add('show');award('g4',pts);
    };
    document.getElementById('g4reset').onclick=render;render();
  })();

  /* ---------- G5 fill ---------- */
  (function(){
    const Q=W.g5;let picks=[];
    const rights=Q.map(q=>q.o[q.a]); // 正解留在閉包內，不寫進 DOM 屬性
    function render(){
      picks=Q.map(()=>null);const h=document.getElementById('g5host');h.innerHTML='';
      document.getElementById('g5done').classList.remove('show');document.getElementById('g5btn').style.display='';
      Q.forEach((q,i)=>{
        const opts=shuffle(q.o.map(t=>t)).map(t=>`<div class="opt" role="button" tabindex="0" data-t="${esc(t)}">${esc(t)}</div>`).join('');
        h.insertAdjacentHTML('beforeend',`<div class="q" id="g5q${i}"><div class="stem"><span class="n">${i+1}</span>${esc(q.s)}</div><div class="opts">${opts}</div></div>`);
        const box=h.lastElementChild;box.querySelectorAll('.opt').forEach(o=>o.onclick=()=>{
          picks[i]=o.dataset.t;box.querySelectorAll('.opt').forEach(x=>x.classList.remove('pick'));o.classList.add('pick');});
      });
    }
    document.getElementById('g5btn').onclick=function(){
      if(picks.includes(null)){alert('還有空格沒填喔！');return;}
      let c=0;Q.forEach((q,i)=>{const box=document.getElementById('g5q'+i),right=rights[i],opts=box.querySelectorAll('.opt');
        opts.forEach(o=>{o.style.pointerEvents='none';if(o.dataset.t===right)o.classList.add('right');});
        if(picks[i]===right)c++;else opts.forEach(o=>{if(o.dataset.t===picks[i])o.classList.add('wrong');});});
      const pts=Math.round(c/Q.length*100);document.getElementById('g5pts').textContent=pts;
      document.getElementById('g5msg').textContent=`答對 ${c} / ${Q.length} 題`;
      this.style.display='none';document.getElementById('g5done').classList.add('show');award('g5',pts);
    };
    document.getElementById('g5reset').onclick=render;render();
  })();

  /* ---------- writing ---------- */
  const scaf=document.getElementById('scaf');
  (W.write.scaffold||[]).forEach((s,i)=>scaf.insertAdjacentHTML('beforeend',`<div class="step"><span class="b">${i+1}</span><span>${esc(s)}</span></div>`));
  const wc=document.getElementById('wchips');
  (W.write.chips||[]).forEach(c=>wc.insertAdjacentHTML('beforeend',`<span class="c">${esc(c)}</span>`));
  const wbox=document.getElementById('wbox');
  wbox.addEventListener('input',()=>{document.getElementById('wcount').textContent=wbox.value.replace(/\s/g,'').length;});

  /* ---------- 開寫暖身・句子快檢（離線機械檢核，不算分） ----------
     定位說明：句子級練習（詞彙造句／課前暖身）在課堂上用本檢核即時確認；
     段落級作文才由老師放到 Edcafe Assignment Grader 做 AI 批改
     （教師用整合頁：../semester1_Edcafe批改包.html）。 */
  const qcInput=document.getElementById('qcInput');
  if(qcInput){
    document.getElementById('qcBtn').onclick=function(){
      const v=(qcInput.value||'').trim();
      const list=document.getElementById('qcList');
      const say=(cls,msg)=>list.insertAdjacentHTML('beforeend','<li class="'+cls+'">'+msg+'</li>');
      list.innerHTML='';
      if(!v){say('bad','✗ 請先打一個句子。');return;}
      const vs=W.vocab||[];
      const hits=vs.filter(x=>v.indexOf(x.w)>=0);
      if(hits.length){say('ok','✓ 有用到本週詞彙：'+hits.map(x=>x.w).join('、'));}
      else{say('bad','✗ 還沒用到本週詞彙。試試看：'+vs.slice(0,5).map(x=>x.w).join('、'));}
      const n=v.replace(/\s/g,'').length;
      if(n>=6){say('ok','✓ 句子長度 OK（'+n+' 個字）。');}
      else{say('bad','✗ 太短了（'+n+' 個字），請至少寫 6 個字。');}
      if(/[。！？!?]$/.test(v)){say('ok','✓ 句尾有標點。');}
      else{say('bad','✗ 句尾要加標點（。／！／？）。');}
      const same=vs.some(x=>{
        const a=v.replace(/[，。！？、!?,.\s]/g,'');
        const b=String(x.ex||'').replace(/[，。！？、!?,.\s]/g,'');
        return b.length>=6&&a===b;
      });
      if(same){say('bad','✗ 這一句跟課本例句一樣——請換成你自己的句子！');}
    };
  }

  /* ---------- pager ---------- */
  const order=[1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17];
  const files={
    1:'w01_怎麼讀食品文章.html',2:'w02_六大類食物.html',3:'w03_均衡飲食餐盤.html',4:'w04_蔬果顏色營養.html',
    5:'w05_主食米飯麵包.html',6:'w06_台越水果.html',7:'w07_飲料含糖與水.html',8:'w08_早餐的重要.html',
    10:'w10_發酵食品.html',11:'w11_食品保存.html',12:'w12_食品添加物.html',13:'w13_看懂食品標示.html',
    14:'w14_食品安全衛生.html',15:'w15_台灣小吃文化.html',16:'w16_台越飲食比較.html',17:'w17_健康飲食統整.html'
  };
  const idx=order.indexOf(W.week);
  const prev=document.getElementById('prev'),next=document.getElementById('next');
  if(idx>0&&files[order[idx-1]]){prev.href=files[order[idx-1]];}else{prev.classList.add('disabled');}
  if(idx>=0&&idx<order.length-1&&files[order[idx+1]]){next.href=files[order[idx+1]];}else{next.classList.add('disabled');}

  refresh();
})();

/* Only the 13 remaining teaching weeks. The original W06–08 engine/video is untouched. */
(function () {
  'use strict';
  const W = typeof WEEK !== 'undefined' ? WEEK : window.WEEK;
  const tasks = {
    1:['看到標題的問號，先做什麼？',['先猜問題的答案，再讀文章','不用看文章'],0,'先看標題、提出問題，再用課文找答案。'],
    2:['哪一句是食物分類句？',['牛奶很白。','優格是乳品類。'],1,'「食物是某一類」才是分類句。'],
    3:['四句小段的第一句要做什麼？',['先說主題','只列兩個食物名字'],0,'主題句先告訴讀者整段重點，再寫做法與結尾。'],
    4:['分類前，要先確定什麼？',['分類依據，例如顏色','哪個顏色一定最健康'],0,'按顏色、按來源是不同分類依據；顏色不是健康保證。'],
    5:['要找甘藷口感的細節，應該怎麼做？',['只看品種名字猜答案','先問問題，再回到段落找證據'],1,'回到對應段落，分開記顏色、口感與做法。'],
    10:['哪一句有原因和結果？',['因為酵母產生氣體，所以麵團變大。','麵包很好吃。'],0,'因為後面是原因，所以後面是結果。'],
    11:['正確的包冰順序是？',['先冷凍海鮮，再形成表面冰衣','先讓海鮮壞掉，再冷凍'],0,'冰衣形成在已冷凍的海鮮表面，之後保持低溫。'],
    12:['怎樣同時寫出功能和限制？',['藻藍素能著色，可是它怕熱。','藍色很漂亮。'],0,'「能夠……可是……」把功能與限制連起來。'],
    13:['標章的「100% 台灣花生」指什麼？',['整包糖沒有加糖','使用的花生來自台灣'],1,'百分比要和旁邊的文字一起讀；這裡說的是花生來源。'],
    14:['看到嚇人的食品新聞標題，先做什麼？',['先查內容和重點句','直接猜吃一次一定生病'],0,'驗出與超標不同；讀內容，查證，依官方通知處理。'],
    15:['介紹小吃的五句骨架是？',['名字、材料、做法、味道、推薦','只重複五次很好吃'],0,'五欄填重點，再各寫成一句完整介紹。'],
    16:['比較兩地市場時，哪個做法合適？',['用一個市場代表整個國家','用課文和家鄉觀察當證據'],1,'相同用「都」，不同用「不同的是」，避免以偏概全。'],
    17:['健康計畫的完整結構是？',['主題句、三個做法、結尾','只寫我要健康'],0,'選可行做法，用學期詞彙寫成 80–100 字短文。']
  };
  if (!W || !Object.prototype.hasOwnProperty.call(tasks, W.week)) return;
  const slug='w'+String(W.week).padStart(2,'0'), base='animations/'+slug+'/'+slug+'_animation';
  const task=tasks[W.week], section=document.createElement('section');section.id='video';
  section.innerHTML=`<h2>🎬 本週旁白教學動畫</h2>
    <p class="lead">先看圖解，聽中文旁白，再練習「${W.rSkill}」與本週寫作。片內已有完整中文字幕；CC 可切換文字字幕。詞彙提供拼音與越南文提示。</p>
    <video controls playsinline preload="metadata" poster="animations/${slug}/poster.jpg" aria-label="第 ${W.week} 週中文旁白教學動畫">
      <source src="${base}.mp4" type="video/mp4">
      <track kind="subtitles" src="${base}.vtt" srclang="zh-Hant" label="繁體中文字幕">
      您的瀏覽器不支援影片；請使用下方下載連結。
    </video>
    <p class="animation-downloads"><a href="${base}.mp4" download>下載 MP4</a> · <a href="${base}.srt" download>下載 SRT 字幕</a> · <a href="${base}.vtt" download>下載 VTT 字幕</a></p>
    <div class="animation-check"><h3>看完想一想：${task[0]}</h3><div class="animation-options"></div><p class="animation-feedback" aria-live="polite"></p></div>`;
  task[1].forEach((label,i)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{
    section.querySelectorAll('.animation-options button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    section.querySelector('.animation-feedback').textContent=i===task[2]?'答對了！'+task[3]:'再試一次：回到動畫的閱讀與寫作提示。';
  });section.querySelector('.animation-options').appendChild(b);});
  document.querySelector('#read').before(section);
  const a=document.createElement('a');a.href='#video';a.textContent='🎬 動畫';document.querySelector('.nav .wrap').prepend(a);
  const style=document.createElement('style');style.textContent=`
    #video video{display:block;width:100%;max-width:100%;height:auto;aspect-ratio:16/9;border-radius:10px;background:#f4eee3;}
    #video .animation-downloads{font-size:.88rem;margin:10px 0;overflow-wrap:anywhere}
    #video a{color:var(--brown)}
    #video .animation-check{border-top:1px solid var(--line);padding-top:14px;margin-top:14px}
    #video h3{font-size:1rem;margin:0 0 8px}
    #video .animation-options{display:flex;flex-wrap:wrap;gap:8px}
    #video .animation-options button{flex:1 1 220px;white-space:normal;text-align:left;border:1px solid var(--line);border-radius:8px;background:#fff;padding:10px;font:inherit;cursor:pointer;min-width:0}
    #video .animation-options button[aria-pressed=true]{border-color:var(--brand);background:#f4eee3}
    #video .animation-feedback{margin-top:10px;min-height:1.7em;font-weight:bold;overflow-wrap:anywhere}
    @media(max-width:600px){#video .animation-options{flex-direction:column}#video .animation-options button{flex:auto;width:100%}}
  `;document.head.appendChild(style);
})();

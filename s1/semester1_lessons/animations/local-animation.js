(() => {
  const w = typeof WEEK !== 'undefined' ? WEEK.week : null;
  if (![6,7,8].includes(w)) return;
  const slug = `w${String(w).padStart(2,'0')}`;
  const config = {
    6: ['看圖表，寫比較句','依照課文圖表，哪一句有數字證據？',['柳橙的維生素 C 比芒果多。','所有台灣水果都比越南水果好。'],0,'先確認每 100 克與毫克的單位，再依課文約略值比較。'],
    7: ['用理由說明飲料選擇','「沒有加糖」一定等於什麼？',['完全沒有糖。','只說沒有另外加糖，仍可能有水果本來的糖。'],1,'沒有加糖不等於無糖；果汁也可能含有天然的糖。'],
    8: ['用順序詞寫早餐步驟','哪個順序合理？',['先洗臉，再吃早餐，最後出門上課。','先上課，再起床，最後吃早餐。'],0,'先、再、最後把步驟連起來。換你寫自己的三個步驟。']
  }[w];
  const section = document.querySelector('#video');
  if (!section) return;
  const originalLink = section.querySelector('.vid-link a')?.href;
  section.innerHTML = `<h2>教學動畫 · ${config[0]}</h2>
    <p class="lead">約 90 秒｜中文 A2 旁白＋完整燒錄字幕＋拼音／越南文詞彙。先看動畫，再讀課文與練習寫作。</p>
    <video controls playsinline preload="metadata" poster="animations/${slug}/poster.jpg" aria-label="第 ${w} 週教學動畫" style="width:100%;height:auto;display:block;border-radius:14px;background:#f4fafc">
      <source src="animations/${slug}/${slug}_animation.mp4" type="video/mp4">
      <track kind="subtitles" src="animations/${slug}/${slug}_animation.vtt" srclang="zh-Hant" label="繁體中文完整旁白">
      您的瀏覽器不支援影片，請下載 MP4。</video>
    <p>字幕已燒錄；播放器的字幕軌可另外開啟。<a href="animations/${slug}/${slug}_animation.mp4" download>下載 MP4</a> · <a href="animations/${slug}/${slug}_animation.srt" download>下載完整 SRT</a></p>
    <div class="animation-check" style="padding:16px;background:#edf8fc;border-radius:12px"><strong>${config[1]}</strong><div class="animation-options" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:12px"></div><p class="animation-feedback" role="status" aria-live="polite"></p></div>`;
  const options = section.querySelector('.animation-options');
  config[2].forEach((answer,i) => {
    const b=document.createElement('button');b.type='button';b.textContent=answer;
    b.style.cssText='padding:12px;white-space:normal;text-align:left;border:1px solid #9cc5d5;border-radius:8px;background:white;color:#193946;font:inherit;cursor:pointer;max-width:100%';
    b.addEventListener('click',()=>{section.querySelector('.animation-feedback').textContent=(i===config[3]?'答對了！':'再想一下。')+config[4];});options.appendChild(b);
  });
  if(originalLink){const p=document.createElement('p');const a=document.createElement('a');a.href=originalLink;a.target='_blank';a.rel='noopener';a.textContent='原課程 YouTube 影片（補充觀看）';p.appendChild(a);section.appendChild(p);}
})();

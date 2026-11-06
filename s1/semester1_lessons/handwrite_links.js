/* Handwriting entry points; no changes to existing scores or tracking. */
(function(){'use strict';
const M={"1":{"unit":"w01","titles":["閱讀：認識標題與文章","寫作：詞彙造句"],"ids":["w01-01-read","w01-02-write"]},"2":{"unit":"w02","titles":["閱讀：找關鍵詞","寫作：用名詞解釋寫句"],"ids":["w02-01-read","w02-02-write"]},"3":{"unit":"w03","titles":["閱讀：找主題句","寫作：寫主題句"],"ids":["w03-01-read","w03-02-write"]},"4":{"unit":"w04","titles":["閱讀：看懂分類","寫作：寫分類句"],"ids":["w04-01-read","w04-02-write"]},"5":{"unit":"w05","titles":["閱讀：找細節資訊","寫作：描述一種主食"],"ids":["w05-01-read","w05-02-write"]},"6":{"unit":"w06","titles":["閱讀：看簡單圖表","寫作：寫比較句"],"ids":["w06-01-read","w06-02-write"]},"7":{"unit":"w07","titles":["閱讀：猜詞義（看上下文）","寫作：寫意見句"],"ids":["w07-01-read","w07-02-write"]},"8":{"unit":"w08","titles":["閱讀：找順序詞","寫作：用順序詞寫步驟"],"ids":["w08-01-read","w08-02-write"]},"10":{"unit":"w10","titles":["閱讀：找原因","寫作：用「因為」找原因"],"ids":["w10-01-read","w10-02-write"]},"11":{"unit":"w11","titles":["閱讀：找步驟","寫作：依序寫出流程"],"ids":["w11-01-read","w11-02-write"]},"12":{"unit":"w12","titles":["閱讀：區分主要與次要","寫作：寫功能說明句"],"ids":["w12-01-read","w12-02-write"]},"13":{"unit":"w13","titles":["閱讀：看標示與數字","寫作：標示描述句"],"ids":["w13-01-read","w13-02-write"]},"14":{"unit":"w14","titles":["閱讀：找重點句","寫作：寫安全提醒"],"ids":["w14-01-read","w14-02-write"]},"15":{"unit":"w15","titles":["閱讀：抓段落大意","寫作：介紹一道菜"],"ids":["w15-01-read","w15-02-write"]},"16":{"unit":"w16","titles":["閱讀：比較異同（入門）","寫作：寫台越比較小段"],"ids":["w16-01-read","w16-02-write"]},"17":{"unit":"w17","titles":["閱讀：全學期閱讀策略統整","寫作：80–100 字短文"],"ids":["w17-01-read","w17-02-write"]}};
const style=document.createElement('style');style.textContent=`
.hw-banner{margin:20px 0;padding:20px;background:#e7f2ed;border:1px solid #b7d3c6;border-radius:14px;overflow-wrap:anywhere}
.hw-banner h2{margin:0 0 8px;font-size:1.25rem}.hw-banner p{margin:8px 0}.hw-banner a{color:#165e50;font-weight:700}
.hw-actions{display:flex;gap:10px;flex-wrap:wrap}.hw-actions a{display:block;padding:10px 13px;border:1px solid #a0c4b6;border-radius:9px;background:#fff;text-decoration:none;min-width:0}
.hw-course-card{display:flex;flex-direction:column;gap:7px;min-width:0}.hw-course-card>.card{flex:1}
.hw-course-card>.hw-week{display:block;text-align:center;background:#e7f2ed;border:1px solid #b7d3c6;border-radius:9px;padding:9px;color:#165e50;font-size:.9rem;text-decoration:none;font-weight:700}
.hw-banner a:focus-visible,.hw-week:focus-visible{outline:3px solid #c58e18;outline-offset:3px}`;document.head.appendChild(style);
const W=typeof WEEK!=='undefined'?WEEK:null;
if(W&&M[W.week]){
 const m=M[W.week];const box=document.createElement('section');box.id='handwrite';box.className='hw-banner';
 box.innerHTML='<h2>✍️ 本週手寫讀寫動畫</h2><p>先看逐步板書，再自己說、自己寫。題目會停下，準備好才按「繼續」。</p><div class="hw-actions"></div><p><a class="hw-week" href="handwrite/'+m.unit+'.html">本週兩章目錄</a> · <a href="handwrite/index.html">全部週次</a></p>';
 m.ids.forEach((id,i)=>{const a=document.createElement('a');a.className='hw-chapter';a.href='handwrite/'+id+'/player.html';a.textContent=m.titles[i];box.querySelector('.hw-actions').appendChild(a)});
 const read=document.querySelector('#read');if(read)read.before(box);
 const nav=document.querySelector('.nav .wrap');if(nav){const a=document.createElement('a');a.href='#handwrite';a.textContent='✍️ 手寫動畫';a.className='hw-top';nav.prepend(a)}
}else if(typeof L!=='undefined'){
 const box=document.createElement('div');box.id='handwrite-course';box.className='hw-banner';box.innerHTML='<h2>✍️ 閱讀與寫作手寫動畫</h2><p>16個教學週・32章・中文旁白、拼音與越南文詞彙・先作答再揭答。</p><a href="handwrite/index.html">開啟全部手寫動畫 →</a>';
 document.querySelector('.links').after(box);
 document.querySelectorAll('.grid a.card').forEach(card=>{const item=L.find(x=>x[4]===card.getAttribute('href'));if(!item)return;const m=M[item[0]];const wrap=document.createElement('div');wrap.className='hw-course-card';card.replaceWith(wrap);wrap.appendChild(card);const a=document.createElement('a');a.href='handwrite/'+m.unit+'.html';a.className='hw-week';a.textContent='✍️ 閱讀＋寫作手寫動畫';wrap.appendChild(a)});
}
})();

## 範圍
完成食品營養華語寫作 I 剩餘 **13 個授課週**：W01–W05、W10–W17。
**W06–W08 原 HTML、YouTube ID 與 lesson_engine.js 逐位元保持不變；排除 W09／W18。**
本 PR 不沿用已關閉 PR #1 的新影片；風格來源為原 W06–08 YouTube 影片實際取樣。

## 交付
- 13 支 1280×720 H.264/AAC 教學動畫，每支約 94–102 秒，合計 MP4 約 17.08 MiB。
- 9 場景／片、A2 中文 Hanhan 合成旁白、逐句實測同步完整燒錄字幕與 SRT／VTT、拼音／越南詞彙。
- 原創暖紙底細線手繪：糖堆、六類食物、餐盤、色素來源、甘藷、麵團氣泡、冷凍蝦冰衣、冰淇淋、食品標示、油鍋、夜市、市場及健康生活。
- 每週教學從實例走到原 HTML 的閱讀策略與寫作句型；不是通用營養卡片。
- 每週 MP4、SRT、VTT、poster、storyboard、render-result；重製／旁白／驗收程式及 README。
- 每個 HTML 只加一行 scoped enhancement script，保留原課文、詞彙、所有遊戲、計分、寫作與 W01／W02 已有圖解。

## 真實驗收
- 13／13 ffprobe 尺寸、音／視串流、完整 ffmpeg 解碼、每句實際音量與九段全旁白字幕一致；結尾約 2 秒保留。
- 13 張全場景取樣圖（共 117 場景）與全部開頭／結尾人工視覺檢查；修正餐盤／筆記重疊與場景物件不對應。
- 全 13 頁 × 1365px 桌機／390px 手機 = 26 組 Chromium 真實播放、native VTT 九段文字、正誤回饋、末尾 seek、media keyboard 不改遊戲分數與版面邊界測試。
- 截圖揭露 test Linux 缺少 CJK fallback 後已修正測試環境字型並重跑 26 組，沒有用 DOM presence 代替目視驗收。
- 報告保留 MP4／HTML／增強腳本 SHA-256；aggregate 重新檢查確為最後成品。
- 原 13 HTML 移除新增 script 後等於 origin/master，W06–08 與引擎完全原樣。

證據：`reports/food-animations/{summary,media,browser}.json`、`style-reference.md`、`visual-review.md`、全部截圖。
課程資產與操作說明：`s1/semester1_lessons/animations/README.md`。

**僅推送專用分支並開 PR，不合併，也尚未發布到 master GitHub Pages。**

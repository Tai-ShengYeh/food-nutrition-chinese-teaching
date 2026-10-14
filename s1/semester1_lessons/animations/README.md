# 食品營養華語寫作 I：剩餘授課週旁白動畫

只新增 W01–W05、W10–W17（13 支），不製作考試週 W09／W18。W06–W08 的原 HTML、YouTube ID 與共用 lesson_engine.js 都保持逐位元相同。

每支為 1280×720 H.264/AAC，9 個旁白段落，約 1 分 34 秒至 1 分 42 秒；Microsoft Hanhan Desktop 繁體中文合成旁白，完整燒錄字幕與句級實測同步 SRT／VTT。拼音、越南文是詞彙支援，不是完整越南文配音。

## 影片

| 週 | 教學內容 | 實測片長 | 檔案 |
|---|---|---:|---|
| W01 | 砂糖文章：看標題，再造句 | 96.2 秒 | [MP4](w01/w01_animation.mp4) |
| W02 | 六大類食物：找關鍵詞 | 94.2 秒 | [MP4](w02/w02_animation.mp4) |
| W03 | 均衡餐盤：找主題句 | 95.2 秒 | [MP4](w03/w03_animation.mp4) |
| W04 | 蔬果顏色：看懂分類 | 96.3 秒 | [MP4](w04/w04_animation.mp4) |
| W05 | 甘藷的世界：找細節資訊 | 96.7 秒 | [MP4](w05/w05_animation.mp4) |
| W10 | 發酵食品：用因為找原因 | 99.8 秒 | [MP4](w10/w10_animation.mp4) |
| W11 | 冷凍與包冰：依序寫流程 | 98.7 秒 | [MP4](w11/w11_animation.mp4) |
| W12 | 藻藍素：功能與限制 | 97.8 秒 | [MP4](w12/w12_animation.mp4) |
| W13 | 食品身分證：看標示與數字 | 98.7 秒 | [MP4](w13/w13_animation.mp4) |
| W14 | 食品安全：先找重點再提醒 | 97.0 秒 | [MP4](w14/w14_animation.mp4) |
| W15 | 夜市小吃：抓大意，寫五句 | 102.3 秒 | [MP4](w15/w15_animation.mp4) |
| W16 | 台越市場：比較異同 | 100.3 秒 | [MP4](w16/w16_animation.mp4) |
| W17 | 健康飲食計畫：統整閱讀與寫作 | 100.2 秒 | [MP4](w17/w17_animation.mp4) |

各資料夾包含 `wXX_animation.mp4`、`wXX_animation.srt`、`wXX_animation.vtt`、`poster.jpg`、`storyboard.json`、`render-result.json`。完整分鏡保留原 HTML 相對來源、閱讀技能、寫作目標、詞彙、旁白與每段實測時序。

## 課程嵌入

13 個 HTML 各只新增一行 `remaining_animations.js`，在原課程引擎和既有增強腳本之後執行。新增 #video、原生播放器、字幕／影片下載與一題閱讀寫作即時回饋。保留課文、詞彙、五個遊戲、計分、寫作任務、W01／W02 原有圖解互動與所有其他課程。

片內已燒錄字幕，因此原生 VTT **預設不顯示**，需要時用 CC 開啟，避免預設疊兩套字幕。

## 重製與驗收

在 repo 根目錄執行。需要 Python Pillow/fonttools、ffmpeg、node、Playwright Chromium；合成語音需要 WSL 可呼叫 Windows PowerShell 的 Microsoft Hanhan Desktop。Chinese font 預設 Windows 微軟正黑體，Latin/Vietnamese 預設 DejaVu Sans；可用 FOOD_FONT／FOOD_LATIN_FONT 指定合法可用字型。

```sh
python tools/render_food_animations.py 1 2 3 4 5
python tools/render_food_animations.py 10 11 12 13
python tools/render_food_animations.py 14 15 16 17
python tools/verify_food_animations.py media
python tools/verify_food_animations.py browser 1 2 3 4 5
python tools/verify_food_animations.py browser 10 11 12 13
python tools/verify_food_animations.py browser 14 15 16 17
python tools/verify_food_animations.py aggregate
```

`.wav`、`.render-cache`、`__pycache__` 是忽略的中間檔，不進 git。PowerShell `-ExecutionPolicy Bypass` 只作用於這次可信的腳本程序，不修改系統永久政策。

Linux headless 環境請先檢查 `fc-list :lang=zh family`；若沒有 CJK 字型，HTML／native CC 可能顯示方框，即使 MP4 本身正常。此次測試從 Windows 的合法現有字型加入測試環境並刷新 fc-cache 後，重新驗收全部 26 組。此 WSL 的 Chromium 相依庫透過 `LD_LIBRARY_PATH=/home/administrator/.hermes/cache/scratch/chem-browser-libs/usr/lib/x86_64-linux-gnu` 提供；其他環境請安裝自己的 Chromium 相依庫，不需要這個本機路徑。

## 實際證據

- [style-reference.md](../../../reports/food-animations/style-reference.md)：原 W06–08 YouTube 影片實際取樣與視覺規則。
- [summary.json](../../../reports/food-animations/summary.json)：13 支／26 桌機手機組合驗收、範圍與原檔保持證據。
- [media.json](../../../reports/food-animations/media.json)：各 MP4 SHA-256、片長、音量、尺寸、完整解碼、字幕與結尾時序。
- [browser.json](../../../reports/food-animations/browser.json)：1365px／390px 全 13 頁播放、9 段 VTT、正誤回饋、末尾 seek、版面與既有遊戲保留。
- [visual-review.md](../../../reports/food-animations/visual-review.md)：全部 117 場景及開頭／結尾的人工視覺檢查。
- 同一 reports 資料夾內有每週 9 場景 contact sheet、開頭／結尾截圖，以及 26 張實際課程播放器截圖。

分支與 PR 尚待人工審閱；不表示已合併或已部署到 GitHub Pages。

# 寫作 I：W06–W08 教學動畫

依據 s1/semester1_lessons/ 的 W06 台越水果、W07 飲料含糖與水、W08 早餐的重要製作，中文 A2 程度。每支约 90 秒、1280×720、12 fps，含中文旁白、完整燒錄字幕、拼音／越南文詞彙。字幕另附 SRT 與 WebVTT，非越南語配音版本。

- W06：先看圖表標題和單位；課文約略值（每 100g 維生素 C：柳橙 50、芒果 25、鳳梨 12、山竹 5 mg）僅作閱讀比較示例，非獨立實測／普遍定值。用「比／都」寫兩句。
- W07：「含糖」不等於「有另外加糖」；相關不等於因果；切塊水果也能保留纖維。用「我覺得……因為……」寫有理由的意見。
- W08：台越早餐各有特色，避免文化排名；圈出「先／再／最後」，描述自己的三個步驟。

課程頁原有 YouTube 影片保留為補充連結，本地 MP4 作為主要教學動畫。每頁增加一道即時回饋小測驗。

## 重製與驗收

```sh
python tools/render_food_animations.py 6 7 8
python tools/verify_food_animations.py
```

重製需要 Pillow、fontTools、ffmpeg 與 Windows System.Speech 的 Microsoft Hanhan Desktop，透過 WSL 呼叫。字型預設 Microsoft JhengHei 和 DejaVu Sans，可用 BIO_FONT/BIO_LATIN_FONT 改路徑。驗收需要 Playwright Chromium 與相依函式庫。

reports/food-animations/media.json 記錄三支影片完整解碼、音訊／視訊與完整字幕檢查、SHA-256；browser.json 記錄六次桌機／手機播放、VTT 載入、結尾跳轉、版面及測驗回饋。w06/w07/w08-all-scenes.jpg 為每支九個場景的實際畫面。每支在完整旁白後保留約 2 秒，不使用 shortest 裁切。

/* ============================================================
   每週學習週報：食品營養華語 寫作 I（course_code: vn-chinese-s1）
   由 GitHub Actions 每週五自動執行（.github/workflows/weekly-report.yml）。
   對 Supabase 的查詢本身兼作 keepalive，免費專案不會因閒置被暫停。

   注意：SB_KEY 是 anon 公開金鑰（RLS 只允許 select/insert），
   與所有已部署課件頁面內嵌的是同一把，放在這裡沒有額外風險。
   ============================================================ */
import fs from 'node:fs';

const SB_URL = 'https://qmldcjkllisvfgegkfsz.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGRjamtsbGlzdmZnZWdrZnN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMjM5ODYsImV4cCI6MjA4NjY5OTk4Nn0.Bfj0W7HN_n_vcjGe5502Chamk0YV-de8a0fxF4Nyczk';
const COURSE = 'vn-chinese-s1';
const HDRS = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

const tw = (d) => new Date(d).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
const twDate = (d) => new Date(d).toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }); // YYYY-MM-DD

async function q(pathAndQuery) {
  const r = await fetch(`${SB_URL}/rest/v1/${pathAndQuery}`, { headers: HDRS });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}

const now = Date.now();
const sinceIso = new Date(now - 7 * 86400e3).toISOString();

// 全學期資料一次撈（一學期 30 人 × 16 週 × 5 遊戲 ≈ 2400 筆，遠低於上限）
const rows = await q(`interactions?course_code=eq.${COURSE}&order=completed_at.desc&limit=10000`);
const weekRows = rows.filter(r => r.completed_at >= sinceIso);

const label = (r) => (r.student_name && r.student_name.trim()) || `（匿名 ${r.student_id}）`;
const avg = (a) => a.length ? Math.round(a.reduce((s, x) => s + (x.score || 0), 0) / a.length) : 0;

function byStudent(list) {
  const m = new Map();
  for (const r of list) {
    const k = label(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
}
const weekOf = (r) => ((r.client_meta && r.client_meta.week) ?? (String(r.game_id || '').match(/^w(\d+)/) || [])[1] ?? '?');

const lines = [];
lines.push(`# 食品營養華語 寫作 I — 學習週報`);
lines.push(``);
lines.push(`- 產生時間：${tw(now)}（台北時間）`);
lines.push(`- 課程代碼：\`${COURSE}\`　資料來源：Supabase \`interactions\`（與 Firestore \`vncs1_results\` 雙寫）`);
lines.push(``);
lines.push(`## 一、本週（近 7 天）`);
if (!weekRows.length) {
  lines.push(``, `本週沒有任何互動紀錄。若是上課週，請確認課件是否正常上傳（頁面右上 ☁️ 圖示）。`);
} else {
  const stu = byStudent(weekRows);
  lines.push(``, `| 指標 | 數值 |`, `|---|---|`);
  lines.push(`| 互動紀錄 | ${weekRows.length} 筆 |`);
  lines.push(`| 參與學生 | ${stu.length} 人 |`);
  lines.push(`| 平均分數 | ${avg(weekRows)} / 100 |`);
  lines.push(``, `### 每位學生`);
  lines.push(``, `| 學生 | 完成遊戲 | 平均分 | 涉及週次 |`, `|---|---|---|---|`);
  for (const [name, list] of stu) {
    const weeks = [...new Set(list.map(weekOf))].sort((a, b) => a - b).map(w => `W${w}`).join('、');
    lines.push(`| ${name} | ${list.length} | ${avg(list)} | ${weeks} |`);
  }
  const games = new Map();
  for (const r of weekRows) {
    const g = r.game_name || r.game_id;
    if (!games.has(g)) games.set(g, []);
    games.get(g).push(r);
  }
  lines.push(``, `### 各遊戲平均分（本週）`);
  lines.push(``, `| 遊戲 | 筆數 | 平均分 |`, `|---|---|---|`);
  for (const [g, list] of [...games.entries()].sort((a, b) => avg(a[1]) - avg(b[1]))) {
    lines.push(`| ${g} | ${list.length} | ${avg(list)} |`);
  }
  lines.push(``, `平均分最低的遊戲排最前面——那就是下週 Kahoot 複習的出題方向。`);
}
lines.push(``, `## 二、全學期累計`);
lines.push(``, `| 指標 | 數值 |`, `|---|---|`);
lines.push(`| 總紀錄 | ${rows.length} 筆 |`);
lines.push(`| 學生總數 | ${byStudent(rows).length} 人 |`);
lines.push(`| 全期平均分 | ${avg(rows)} / 100 |`);
if (rows.length) {
  const perWeek = new Map();
  for (const r of rows) {
    const w = weekOf(r);
    perWeek.set(w, (perWeek.get(w) || 0) + 1);
  }
  lines.push(``, `### 各週紀錄數`);
  lines.push(``, `| 週次 | 筆數 |`, `|---|---|`);
  for (const [w, n] of [...perWeek.entries()].sort((a, b) => a[0] - b[0])) lines.push(`| W${w} | ${n} |`);
}
lines.push(``, `---`, `此查詢同時作為 Supabase keepalive（防免費專案閒置休眠）。`);
lines.push(`即時儀表板：https://fsn-ai-teaching.web.app/master_dashboard`);

const md = lines.join('\n') + '\n';
fs.mkdirSync('reports/weekly', { recursive: true });
fs.writeFileSync(`reports/weekly/${COURSE}_${twDate(now)}.md`, md);
fs.writeFileSync(`reports/weekly/latest.md`, md);
console.log(`OK：本週 ${weekRows.length} 筆／累計 ${rows.length} 筆 → reports/weekly/${COURSE}_${twDate(now)}.md`);

/* ============================================================
   Supabase 雙寫整合 — mcd_packaging 補丁
   ============================================================
   2026-05-25 加入：把 mcd 的成績也同步到 Supabase interactions table
   讓跨課程 SQL 分析能涵蓋這門課
   ============================================================ */

const MCD_SB_URL = 'https://qmldcjkllisvfgegkfsz.supabase.co';
const MCD_SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGRjamtsbGlzdmZnZWdrZnN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMjM5ODYsImV4cCI6MjA4NjY5OTk4Nn0.Bfj0W7HN_n_vcjGe5502Chamk0YV-de8a0fxF4Nyczk';
const MCD_SB_TABLE = 'interactions';
const MCD_COURSE_CODE = 'mcd-packaging';

async function mcdSbRecord(payload) {
  try {
    const row = {
      course_code:  MCD_COURSE_CODE,
      session_id:   payload.sessionId,
      student_id:   payload.studentId,
      student_name: payload.studentName || '',
      game_id:      payload.gameId,
      game_name:    payload.gameName || '',
      score:        Number(payload.score) || 0,
      wrong:        Number(payload.wrong) || 0,
      total:        Number(payload.total) || 0,
      duration_ms:  Number(payload.durationMs) || 0,
      client_meta:  { ua: navigator.userAgent.substring(0, 100) }
    };
    const res = await fetch(`${MCD_SB_URL}/rest/v1/${MCD_SB_TABLE}`, {
      method: 'POST',
      headers: {
        'apikey':        MCD_SB_KEY,
        'Authorization': `Bearer ${MCD_SB_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=minimal'
      },
      body: JSON.stringify(row)
    });
    if (!res.ok) { console.warn('[mcd-Supabase] HTTP', res.status); return false; }
    return true;
  } catch (e) { console.warn('[mcd-Supabase] fail:', e); return false; }
}

window.MCDSupabase = { sbRecord: mcdSbRecord, COURSE_CODE: MCD_COURSE_CODE };

/* ============================================================
   Supabase 整合 — 食品包裝綠色革命 minigames
   ============================================================
   Project：qmldcjkllisvfgegkfsz
   資料表：public.interactions
   寫入策略：fetch + Bearer apikey（不依賴 supabase-js SDK，更輕量）

   建表 SQL 已寫在 week_food_packaging_vn/supabase_setup.sql
   ============================================================ */

const SUPABASE_URL = 'https://qmldcjkllisvfgegkfsz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGRjamtsbGlzdmZnZWdrZnN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMjM5ODYsImV4cCI6MjA4NjY5OTk4Nn0.Bfj0W7HN_n_vcjGe5502Chamk0YV-de8a0fxF4Nyczk';
const SB_TABLE = 'interactions';
const COURSE_CODE = 'food-packaging-vn';

async function sbRecordResult(payload) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  try {
    const row = {
      course_code:  COURSE_CODE,
      session_id:   payload.sessionId,
      student_id:   payload.studentId,
      student_name: payload.studentName || '',
      game_id:      payload.gameId,
      game_name:    payload.gameName || '',
      score:        Number(payload.score) || 0,
      wrong:        Number(payload.wrong) || 0,
      total:        Number(payload.total) || 0,
      duration_ms:  Number(payload.durationMs) || 0,
      client_meta:  {
        ua: navigator.userAgent.substring(0, 100),
        ...(payload.meta || {})
      }
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${SB_TABLE}`, {
      method: 'POST',
      headers: {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=minimal'
      },
      body: JSON.stringify(row)
    });
    if (!res.ok) {
      console.warn('[Supabase] HTTP', res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Supabase] write failed:', e);
    return false;
  }
}

async function sbQueryBySession(sessionId) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  try {
    const url = `${SUPABASE_URL}/rest/v1/${SB_TABLE}`
      + `?session_id=eq.${encodeURIComponent(sessionId)}`
      + `&order=completed_at.desc`;
    const res = await fetch(url, {
      headers: {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.warn('[Supabase] query failed:', e);
    return [];
  }
}

window.FPSupabase = {
  sbRecordResult, sbQueryBySession,
  SUPABASE_URL, SB_TABLE, COURSE_CODE,
  isReady: () => !!SUPABASE_URL && !!SUPABASE_ANON_KEY
};

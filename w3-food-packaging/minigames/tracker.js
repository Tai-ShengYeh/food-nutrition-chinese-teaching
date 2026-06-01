/* ============================================================
   FPTracker — 統一入口，平行寫入 Firestore + Supabase
   ============================================================
   依賴：先 load firebase-config.js + supabase-config.js

   遊戲只要呼叫：
     FPTracker.recordResult({
       gameId, gameName, score, wrong, total, durationMs, meta
     });

   學生身分：
     - studentName (姓名/學號)  ← 學生第一次打開時必填，存 localStorage fpvn_student_name
     - studentId   (匿名 S-XXXXXX) ← 同一瀏覽器永久不變，存 fpvn_student_id
   Session ID：從 URL ?session=YYYYMMDD_classCode → localStorage fpvn_session_id
   ============================================================ */

const STUDENT_ID_KEY   = 'fpvn_student_id';
const STUDENT_NAME_KEY = 'fpvn_student_name';
const SESSION_KEY      = 'fpvn_session_id';

function fpGetStudentId() {
  let id = localStorage.getItem(STUDENT_ID_KEY);
  if (!id) {
    id = 'S-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem(STUDENT_ID_KEY, id);
  }
  return id;
}

function fpGetStudentName() {
  return localStorage.getItem(STUDENT_NAME_KEY) || '';
}

function fpSetStudentName(n) {
  if (n && n.trim()) {
    localStorage.setItem(STUDENT_NAME_KEY, n.trim());
    return true;
  }
  return false;
}

function fpClearStudentName() {
  localStorage.removeItem(STUDENT_NAME_KEY);
}

function fpGetSessionId() {
  const params = new URLSearchParams(window.location.search);
  let sid = params.get('session');
  if (sid) {
    localStorage.setItem(SESSION_KEY, sid);
    return sid;
  }
  sid = localStorage.getItem(SESSION_KEY);
  if (sid) return sid;
  const d = new Date();
  return `auto-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

function fpSetSessionId(sid) {
  localStorage.setItem(SESSION_KEY, sid);
}

function fpResetStudentId() {
  localStorage.removeItem(STUDENT_ID_KEY);
  localStorage.removeItem(STUDENT_NAME_KEY);
  return fpGetStudentId();
}

// ============================================================
//  姓名 / 學號 彈窗（首次打開強制填寫）
// ============================================================
function fpShowNameModal(opts) {
  opts = opts || {};
  const current = fpGetStudentName();
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.id = 'fpvn-name-modal';
    wrap.innerHTML = `
      <style>
        #fpvn-name-modal{
          position:fixed; inset:0; background:rgba(45,26,15,.7);
          z-index:99999; display:flex; align-items:center; justify-content:center;
          font-family:'Noto Sans TC',-apple-system,sans-serif;
          animation:fpvnFade .3s ease;
        }
        @keyframes fpvnFade{ from{opacity:0;} to{opacity:1;} }
        #fpvn-name-modal .box{
          background:#FFFBF0; padding:28px 28px 24px; border-radius:18px;
          max-width:420px; width:92%; box-shadow:0 12px 40px rgba(0,0,0,.4);
          border-top:6px solid #E63946;
        }
        #fpvn-name-modal h3{
          font-size:1.3rem; color:#E63946; margin:0 0 10px; font-weight:900;
        }
        #fpvn-name-modal p{
          font-size:.92rem; color:#5A3D2E; line-height:1.6; margin-bottom:16px;
        }
        #fpvn-name-modal input{
          width:100%; padding:12px 14px; border:2px solid #C7B5A6;
          border-radius:10px; font-size:1.1rem; font-family:inherit;
          margin-bottom:14px; color:#2D1A0F; box-sizing:border-box;
        }
        #fpvn-name-modal input:focus{
          outline:none; border-color:#E63946;
        }
        #fpvn-name-modal input.err{
          border-color:#E63946; animation:fpvnShake .4s;
        }
        @keyframes fpvnShake{
          0%,100%{transform:translateX(0)}
          25%{transform:translateX(-6px)}
          75%{transform:translateX(6px)}
        }
        #fpvn-name-modal .actions{
          display:flex; gap:10px;
        }
        #fpvn-name-modal button{
          flex:1; padding:12px; border:none; border-radius:24px;
          font-weight:700; font-size:1rem; cursor:pointer;
          font-family:inherit;
        }
        #fpvn-name-modal .ok{
          background:#E63946; color:#fff;
        }
        #fpvn-name-modal .ok:hover{ background:#c12d3a; }
        #fpvn-name-modal .cancel{
          background:#fff; color:#5A3D2E; border:2px solid #C7B5A6;
        }
        #fpvn-name-modal .hint{
          margin-top:10px; font-size:.78rem; color:#8B6F5E; text-align:center;
        }
      </style>
      <div class="box">
        <h3>👋 請輸入你的姓名或學號</h3>
        <p>老師會用這個來看你的成績。<br>請照老師說的格式填（中文姓名 / 越南名 / 學號都可以）。</p>
        <input id="fpvn-name-in" type="text" placeholder="例：阮文明 / Nguyễn Văn Minh / B12345"
               maxlength="40" value="${current.replace(/"/g,'&quot;')}">
        <div class="actions">
          ${opts.cancellable ? '<button class="cancel" id="fpvn-cancel">取消</button>' : ''}
          <button class="ok" id="fpvn-ok">確定 →</button>
        </div>
        <div class="hint">填好後按 Enter 也可以</div>
      </div>
    `;
    document.body.appendChild(wrap);
    const input = wrap.querySelector('#fpvn-name-in');
    const okBtn = wrap.querySelector('#fpvn-ok');
    const cancelBtn = wrap.querySelector('#fpvn-cancel');
    setTimeout(() => input.focus(), 50);
    input.select();

    const submit = () => {
      const v = input.value.trim();
      if (!v) {
        input.classList.add('err');
        input.focus();
        setTimeout(() => input.classList.remove('err'), 500);
        return;
      }
      fpSetStudentName(v);
      wrap.remove();
      resolve(v);
    };

    okBtn.onclick = submit;
    if (cancelBtn) cancelBtn.onclick = () => { wrap.remove(); resolve(current); };
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') submit();
    });
  });
}

// 頁面載入時，若沒姓名 → 自動彈窗
function fpEnsureStudentName() {
  if (fpGetStudentName()) return Promise.resolve(fpGetStudentName());
  if (document.readyState === 'loading') {
    return new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', () =>
        fpShowNameModal({cancellable:false}).then(resolve));
    });
  }
  return fpShowNameModal({cancellable:false});
}

// ============================================================
//  寫入紀錄（平行寫 Firestore + Supabase）
// ============================================================
async function fpRecordResult(opts) {
  const payload = {
    studentId:   fpGetStudentId(),
    studentName: fpGetStudentName(),
    sessionId:   fpGetSessionId(),
    gameId:      opts.gameId || '',
    gameName:    opts.gameName || '',
    score:       Number(opts.score) || 0,
    wrong:       Number(opts.wrong) || 0,
    total:       Number(opts.total) || 0,
    durationMs:  Number(opts.durationMs) || 0,
    meta:        opts.meta || {}
  };

  const results = await Promise.allSettled([
    window.FPFirebase ? window.FPFirebase.fbRecordResult(payload) : Promise.resolve(false),
    window.FPSupabase ? window.FPSupabase.sbRecordResult(payload) : Promise.resolve(false)
  ]);
  const okFB = results[0].status === 'fulfilled' && results[0].value;
  const okSB = results[1].status === 'fulfilled' && results[1].value;

  const localKey = `fpvn_done_${payload.gameId}`;
  localStorage.setItem(localKey, JSON.stringify({
    ...payload, ok:{firebase:okFB, supabase:okSB}, ts:Date.now()
  }));
  console.log(`[FPTracker] ${payload.gameId} → FB:${okFB?'✅':'✗'} SB:${okSB?'✅':'✗'}`);
  return { firebase: okFB, supabase: okSB };
}

// ============================================================
//  UI helper
// ============================================================
function fpStatusBadge() {
  const fbOK = window.FPFirebase && window.FPFirebase.isReady();
  const sbOK = window.FPSupabase && window.FPSupabase.isReady();
  if (fbOK && sbOK) return '☁️ 已連雲端（FB + SB）';
  if (fbOK)         return '☁️ 已連 Firestore';
  if (sbOK)         return '☁️ 已連 Supabase';
  return '⚠️ 雲端未設定（成績只存本機）';
}

function fpRenderIdentityBadge(el) {
  if (!el) return;
  const name = fpGetStudentName() || '（未設定姓名）';
  el.innerHTML = `${fpStatusBadge()} · <b>${name}</b>
    <span style="opacity:.6;">(${fpGetStudentId()})</span>
    · 班 ${fpGetSessionId()}
    <a href="#" id="fpvn-change-name" style="color:#E63946; margin-left:8px;
       text-decoration:underline; font-size:.78rem;">換身分</a>`;
  const link = el.querySelector('#fpvn-change-name');
  if (link) link.onclick = e => {
    e.preventDefault();
    fpShowNameModal({cancellable:true}).then(() => fpRenderIdentityBadge(el));
  };
}

// ============================================================
//  匯出
// ============================================================
window.FPTracker = {
  getStudentId:       fpGetStudentId,
  getStudentName:     fpGetStudentName,
  setStudentName:     fpSetStudentName,
  clearStudentName:   fpClearStudentName,
  getSessionId:       fpGetSessionId,
  setSessionId:       fpSetSessionId,
  resetStudentId:     fpResetStudentId,
  recordResult:       fpRecordResult,
  statusBadge:        fpStatusBadge,
  renderIdentityBadge: fpRenderIdentityBadge,
  showNameModal:      fpShowNameModal,
  ensureStudentName:  fpEnsureStudentName
};

// 自動執行：頁面載入時若無姓名 → 強制彈窗
// （dashboard / index 不需要彈，由它們自行控制）
if (!window.FP_NO_AUTO_PROMPT) {
  fpEnsureStudentName();
}

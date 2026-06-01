/* ============================================================
   Firebase 整合設定 — 麥當勞無塑包裝小遊戲
   ============================================================

   📌 使用步驟：
   1. 到 Firebase Console（https://console.firebase.google.com）
   2. 進入您的專案 → 專案設定 → 一般 → 您的應用程式
   3. 複製「Firebase SDK snippet」中的 firebaseConfig 物件
   4. 貼到下方 FIREBASE_CONFIG 物件中（取代所有 YOUR_xxx）
   5. 在 Firebase Console → Firestore Database → 規則，貼上：
      （規則網址：https://console.firebase.google.com/u/0/project/[您的專案]/firestore/databases/-default-/security/rules）

      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          match /results/{doc} {
            allow create: if request.resource.data.studentId is string
                          && request.resource.data.sessionId is string;
            allow read: if true;
          }
        }
      }

   6. 學生玩遊戲時 → 自動寫到 Firestore
   7. 老師打開 teacher_dashboard.html?session=您的session → 即時看結果

   📍 班級 session 怎麼用：
   - 老師上課前決定一個 session ID（例如 20260519_3A）
   - 把這個 session 加到分享給學生的網址後面，例如：
     minigames/index.html?session=20260519_3A
   - session 會自動傳遞到 5 個遊戲（透過 localStorage）
   - 老師打開 teacher_dashboard.html?session=20260519_3A 看當班結果
   ============================================================ */

// Firebase 專案：my-teaching-tools-517a0
const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "my-teaching-tools-517a0.firebaseapp.com",
  projectId: "my-teaching-tools-517a0",
  storageBucket: "my-teaching-tools-517a0.firebasestorage.app",
  messagingSenderId: "244288457011",
  appId: "1:244288457011:web:4b3ff8a846a6c50b169646"
};

// ============================================================
// 以下不需要改動
// ============================================================

const FIREBASE_VERSION = '10.7.0';
const COLLECTION_NAME = 'results';

let _firebaseDb = null;
let _firebaseHelpers = null;

async function _ensureFirebase() {
  if (_firebaseDb) return { db: _firebaseDb, ..._firebaseHelpers };
  if (!FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
    return null;
  }
  try {
    const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`);
    const fs = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`);
    const app = initializeApp(FIREBASE_CONFIG);
    _firebaseDb = fs.getFirestore(app);
    _firebaseHelpers = {
      collection: fs.collection,
      addDoc: fs.addDoc,
      query: fs.query,
      where: fs.where,
      orderBy: fs.orderBy,
      onSnapshot: fs.onSnapshot,
      serverTimestamp: fs.serverTimestamp,
      getDocs: fs.getDocs
    };
    return { db: _firebaseDb, ..._firebaseHelpers };
  } catch (e) {
    console.warn('[Firebase] 連線失敗：', e);
    return null;
  }
}

// 取得 / 建立學生匿名 ID
function getStudentId() {
  let id = localStorage.getItem('mcd_student_id');
  if (!id) {
    id = 'S-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('mcd_student_id', id);
  }
  return id;
}

// 取得 session ID（從 URL ?session= 或 localStorage）
function getSessionId() {
  const params = new URLSearchParams(window.location.search);
  let sid = params.get('session');
  if (sid) {
    localStorage.setItem('mcd_session_id', sid);
    return sid;
  }
  sid = localStorage.getItem('mcd_session_id');
  if (sid) return sid;
  // 預設用當天日期
  const d = new Date();
  return `auto-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

// 記錄學生作答
async function recordResult({ gameId, gameName, score, wrong, total, durationMs }) {
  const fb = await _ensureFirebase();
  if (!fb) {
    console.log('[Firebase] 跳過（尚未設定 config）');
    return false;
  }
  const payload = {
    studentId: getStudentId(),
    sessionId: getSessionId(),
    gameId: gameId || '',
    gameName: gameName || '',
    score: Number(score) || 0,
    wrong: Number(wrong) || 0,
    total: Number(total) || 0,
    durationMs: Number(durationMs) || 0
  };
  let fbOK = false;
  try {
    await fb.addDoc(fb.collection(fb.db, COLLECTION_NAME), {
      ...payload,
      completedAt: fb.serverTimestamp(),
      ua: navigator.userAgent.substring(0, 100)
    });
    console.log(`[Firebase] ✅ ${gameId} 已記錄`);
    fbOK = true;
  } catch (e) {
    console.error('[Firebase] 寫入失敗：', e);
  }
  // 雙寫到 Supabase（若 supabase-config.js 已載入）
  if (window.MCDSupabase) {
    try {
      const sbOK = await window.MCDSupabase.sbRecord(payload);
      console.log(`[Supabase] ${sbOK?'✅':'✗'} ${gameId}`);
    } catch (e) { console.warn('[Supabase] error:', e); }
  }
  return fbOK;
}

// 訂閱即時結果（給老師儀表板用）
async function subscribeResults(sessionId, callback, errorCallback) {
  const fb = await _ensureFirebase();
  if (!fb) return null;
  const q = fb.query(
    fb.collection(fb.db, COLLECTION_NAME),
    fb.where('sessionId', '==', sessionId)
  );
  return fb.onSnapshot(q,
    (snap) => {
      const docs = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
      callback(docs);
    },
    (error) => {
      console.error('[Firebase] subscribeResults 失敗：', error);
      if (errorCallback) errorCallback(error);
    }
  );
}

// 顯示 Firebase 狀態（用在 UI）
function getFirebaseStatus() {
  if (!FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
    return { ready: false, message: '⚠️ 尚未設定 Firebase（成績只存本機）' };
  }
  return { ready: true, message: '☁️ 已連雲端' };
}

// 暴露給遊戲使用
window.MCDFirebase = {
  getStudentId,
  getSessionId,
  recordResult,
  subscribeResults,
  getFirebaseStatus,
  FIREBASE_CONFIG
};

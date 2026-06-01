/* ============================================================
   Firebase Firestore 整合 — 食品包裝綠色革命 minigames
   ============================================================
   集合：fpvn_results
   學生 ID 鍵：fpvn_student_id   (與 mcd_packaging 隔離)
   Session ID 鍵：fpvn_session_id

   Firestore 規則（請貼到 Firebase Console → Firestore → Rules）：

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /fpvn_results/{doc} {
         allow create: if request.resource.data.studentId is string
                       && request.resource.data.sessionId is string;
         allow read: if true;
       }
     }
   }
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCTLhRf7jcJH_AwUzbV4MawkrKNPrIVG5Y",
  authDomain: "my-teaching-tools-517a0.firebaseapp.com",
  projectId: "my-teaching-tools-517a0",
  storageBucket: "my-teaching-tools-517a0.firebasestorage.app",
  messagingSenderId: "244288457011",
  appId: "1:244288457011:web:4b3ff8a846a6c50b169646"
};

const FIREBASE_VERSION = '10.7.0';
const FB_COLLECTION = 'fpvn_results';

let _fbDb = null;
let _fbHelpers = null;

async function _ensureFB() {
  if (_fbDb) return { db: _fbDb, ..._fbHelpers };
  if (!FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') return null;
  try {
    const { initializeApp } = await import(
      `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`);
    const fs = await import(
      `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`);
    const app = initializeApp(FIREBASE_CONFIG);
    _fbDb = fs.getFirestore(app);
    _fbHelpers = {
      collection: fs.collection, addDoc: fs.addDoc,
      query: fs.query, where: fs.where, orderBy: fs.orderBy,
      onSnapshot: fs.onSnapshot, serverTimestamp: fs.serverTimestamp,
      getDocs: fs.getDocs
    };
    return { db: _fbDb, ..._fbHelpers };
  } catch (e) {
    console.warn('[Firebase] init failed:', e);
    return null;
  }
}

async function fbRecordResult(payload) {
  const fb = await _ensureFB();
  if (!fb) return false;
  try {
    await fb.addDoc(fb.collection(fb.db, FB_COLLECTION), {
      ...payload,
      completedAt: fb.serverTimestamp(),
      ua: navigator.userAgent.substring(0, 100)
    });
    return true;
  } catch (e) {
    console.warn('[Firebase] write failed:', e);
    return false;
  }
}

async function fbSubscribeResults(sessionId, cb, errCb) {
  const fb = await _ensureFB();
  if (!fb) return null;
  const q = fb.query(
    fb.collection(fb.db, FB_COLLECTION),
    fb.where('sessionId', '==', sessionId)
  );
  return fb.onSnapshot(q,
    snap => {
      const docs = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
      cb(docs);
    },
    err => { console.error('[Firebase] subscribe err:', err); errCb && errCb(err); }
  );
}

window.FPFirebase = {
  fbRecordResult, fbSubscribeResults,
  FB_COLLECTION, FIREBASE_CONFIG,
  isReady: () => !!FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY'
};

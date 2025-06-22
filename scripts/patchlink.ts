/* ------------------------------------------------------------------ */
/*  1. 內建與第三方匯入                                               */
/* ------------------------------------------------------------------ */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

/* ------------------------------------------------------------------ */
/*  2. 讀取服務帳戶金鑰                                               */
/* ------------------------------------------------------------------ */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const keyPath = path.join(__dirname, '../serviceAccountKey.json');

console.log('🚀 讀取 serviceAccountKey.json ...');
const serviceAccount = JSON.parse(await fs.readFile(keyPath, 'utf8'));

/* ------------------------------------------------------------------ */
/*  3. 初始化 Firebase Admin (ESM 寫法)                               */
/* ------------------------------------------------------------------ */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin 初始化完成');
}

/* Firestore 取用 */
const db = admin.firestore();

/* ------------------------------------------------------------------ */
/*  4. 共用工具：去重 unifiedLinks / links                            */
/* ------------------------------------------------------------------ */
import type { UnifiedLinkItem } from '@/types/unified-link';

function deduplicateLinks(links: UnifiedLinkItem[]): UnifiedLinkItem[] {
  const seen = new Set<string>();
  const out: UnifiedLinkItem[] = [];

  for (const link of links) {
    const key =
      link.type === 'text'
        ? `text:${(link as any).content?.slice(0, 20) ?? ''}`
        : link.type === 'objekt'
        ? `objekt:${link.id}:${(link as any).objekts?.length ?? 0}`
        : `${link.type}:${(link as any).platform?.toLowerCase()}:${(link as any).url}`;

    if (!seen.has(key)) {
      seen.add(key);
      out.push(link);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  5. 主程式：把 links 與 unifiedLinks 合併、去重、寫回              */
/* ------------------------------------------------------------------ */
async function migrateUnifiedLinks() {
  const snaps = await db.collection('profiles').get();

  console.log(`📄 共 ${snaps.size} 份 profiles`);

  for (const doc of snaps.docs) {
    const data = doc.data();
    const legacy = (data.links ?? []) as UnifiedLinkItem[];
    const unified = (data.unifiedLinks ?? []) as UnifiedLinkItem[];

    if (legacy.length === 0) continue; // 沒舊欄位可跳過

    const merged   = [...unified, ...legacy];
    const cleaned  = deduplicateLinks(merged).map((l, i) => ({
      ...l,
      order: i,
      // 如果 id 基於平台字串，換成 uuid 以免衝突
      id: /^[\w-]+(-legacy)?$/.test(l.id) ? crypto.randomUUID() : l.id,
    }));

    await doc.ref.update({
      unifiedLinks: cleaned,
      links: admin.firestore.FieldValue.delete(),       // 移除舊欄位
      socialLinks: admin.firestore.FieldValue.delete(),
      socialPlatforms: admin.firestore.FieldValue.delete(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`🛠️  ${doc.id} → 合併 ${legacy.length} 筆 legacy，總計 ${cleaned.length} 筆`);
  }

  console.log('🎉 批次遷移完成');
}

/* ------------------------------------------------------------------ */
/*  6. 執行                                                            */
/* ------------------------------------------------------------------ */
migrateUnifiedLinks()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 遷移失敗：', err);
    process.exit(1);
  });

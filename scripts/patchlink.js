// scripts/patchLinks.js (注意：改為 .js 文件)
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 讀取服務帳戶金鑰
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../serviceAccountKey.json'), 'utf8')
);

// 初始化 Firebase Admin（檢查是否已經初始化）
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function patchLinksType() {
  try {
    console.log('🚀 開始批次更新 links 的 type 屬性...');
    
    const snapshot = await db.collection('profiles').get();
    
    if (snapshot.empty) {
      console.log('📭 沒有找到任何 profiles 文件');
      return;
    }

    console.log(`📄 找到 ${snapshot.size} 個 profiles 文件`);
    
    let updatedCount = 0;
    let totalLinksPatched = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const links = data.links || [];
      
      if (!Array.isArray(links) || links.length === 0) {
        console.log(`⏭️  跳過 ${doc.id}：沒有 links 或 links 不是陣列`);
        continue;
      }

      let hasUpdates = false;
      let linksPatchedInDoc = 0;

      const patchedLinks = links.map((link) => {
        // 檢查是否缺少 type 屬性
        if (!link.type) {
          hasUpdates = true;
          linksPatchedInDoc++;
          console.log(`  🔧 修補連結：${link.platform || 'Unknown'} -> type: 'social'`);
          return { ...link, type: 'social' };
        }
        return link;
      });

      if (hasUpdates) {
        console.log(`🛠️  更新文件：${doc.id}（${linksPatchedInDoc} 個連結）`);
        await db.collection('profiles').doc(doc.id).update({ 
          links: patchedLinks 
        });
        updatedCount++;
        totalLinksPatched += linksPatchedInDoc;
      } else {
        console.log(`✅ 跳過 ${doc.id}：所有連結都已有 type 屬性`);
      }
    }

    console.log('\n📊 批次更新完成統計：');
    console.log(`   - 總文件數：${snapshot.size}`);
    console.log(`   - 更新文件數：${updatedCount}`);
    console.log(`   - 修補連結數：${totalLinksPatched}`);
    console.log('✅ 所有作業完成！');

  } catch (error) {
    console.error('❌ 批次更新失敗：', error);
    throw error;
  }
}

// 執行腳本
patchLinksType()
  .then(() => {
    console.log('🎉 腳本執行成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 腳本執行失敗：', error);
    process.exit(1);
  });
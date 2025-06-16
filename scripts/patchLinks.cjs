// scripts/patchLinks.js
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

console.log('🚀 開始初始化 Firebase Admin...');

// 讀取服務帳戶金鑰
let serviceAccount;
try {
  const keyPath = path.join(__dirname, '../serviceAccountKey.json');
  console.log(`📁 讀取金鑰文件：${keyPath}`);
  serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  console.log('✅ 金鑰文件讀取成功');
} catch (error) {
  console.error('❌ 無法讀取服務帳戶金鑰:', error.message);
  process.exit(1);
}

// 初始化 Firebase Admin（檢查是否已經初始化）
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin 初始化成功');
  } else {
    console.log('ℹ️  Firebase Admin 已經初始化');
  }
} catch (error) {
  console.error('❌ Firebase Admin 初始化失敗:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function patchLinksType() {
  try {
    console.log('\n🚀 開始批次更新 links 的 type 屬性...');
    
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
      
      console.log(`\n🔍 檢查文件：${doc.id}`);
      
      if (!Array.isArray(links) || links.length === 0) {
        console.log(`⏭️  跳過 ${doc.id}：沒有 links 或 links 不是陣列`);
        continue;
      }

      console.log(`   📎 找到 ${links.length} 個連結`);

      let hasUpdates = false;
      let linksPatchedInDoc = 0;

      const patchedLinks = links.map((link, index) => {
        console.log(`   📝 連結 ${index + 1}:`, {
          id: link.id || 'no-id',
          platform: link.platform || 'no-platform',
          type: link.type || 'no-type',
          url: link.url ? '(有網址)' : '(無網址)'
        });

        // 檢查是否缺少 type 屬性
        if (!link.type) {
          hasUpdates = true;
          linksPatchedInDoc++;
          console.log(`      🔧 修補：新增 type: 'social'`);
          return { ...link, type: 'social' };
        } else {
          console.log(`      ✅ 已有 type: ${link.type}`);
        }
        return link;
      });

      if (hasUpdates) {
        console.log(`🛠️  更新文件：${doc.id}（${linksPatchedInDoc} 個連結需要修補）`);
        try {
          await db.collection('profiles').doc(doc.id).update({ 
            links: patchedLinks 
          });
          console.log(`   ✅ 更新成功`);
          updatedCount++;
          totalLinksPatched += linksPatchedInDoc;
        } catch (updateError) {
          console.error(`   ❌ 更新失敗:`, updateError.message);
        }
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
console.log('🎬 開始執行腳本...');
patchLinksType()
  .then(() => {
    console.log('\n🎉 腳本執行成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 腳本執行失敗：', error);
    process.exit(1);
  });

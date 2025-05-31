import { app, db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { Template } from '@/types/Template';

const templates: Record<string, Template> = {
  minimal: {
    name: '極簡風',
    templateEngName: 'Minimal',
    bgImage: '/templates/gradient_01.jpg', // ✅ 相對於 public 路徑
    fontFamily: 'Poppins',
    color: {
      buttonPrimary: '#2563eb',
      buttonSecondary: '#e0e7ff',
      fontPrimary: '#111827',
      fontSecondary: '#6b7280',
    },
    border: { style: 'solid', radius: 12 },
  },
  colorful: {
    name: '酷炫黑',
    templateEngName: 'Black',
    bgImage: '/templates/black_01.jpg',
    fontFamily: 'Montserrat',
    color: {
      buttonPrimary: '#030303',
      buttonSecondary: '#666666',
      fontPrimary: '#ffffff',
      fontSecondary: '#333333',
    },
    border: { style: 'dashed', radius: 20 },
  },
};

async function seed() {
  const col = collection(db, 'templates');

  await Promise.all(
    Object.entries(templates).map(async ([id, data]) => {
      const docRef = doc(col, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, data);
        console.log(`✅ Created: ${id}`);
      } else {
        console.log(`⏭️ Skipped: ${id} already exists`);
      }
    })
  );

  console.log('🎉 Seeding complete!');
}

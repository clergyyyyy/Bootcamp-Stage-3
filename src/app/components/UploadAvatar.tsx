'use client';

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';   // 你的 Firestore
import { auth } from '@/lib/firebase'; // 已登入使用者

export async function UploadAvatar(file: File) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('未登入');

  //上傳到 Storage
  const storage   = getStorage();
  const avatarRef = ref(storage, `avatars/${uid}`);
  await uploadBytes(avatarRef, file);

  //取得公開下載 URL
  const url = await getDownloadURL(avatarRef);

  //寫入 db profile
  await setDoc(
    doc(db, 'profiles', uid),
    { avatarUrl: url },
    { merge: true }
  );

  return url;
}

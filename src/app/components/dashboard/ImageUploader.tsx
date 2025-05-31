'use client';

import { useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';

export default function ImageUploader({ onUpload }: { onUpload: (url: string) => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const snap = await getDoc(doc(db, 'profiles', user.uid));
      const data = snap.data();
      if (data?.avatarUrl) setPreviewUrl(data.avatarUrl);
    });
    return () => unsubscribe();
  }, []);

  const uploadFile = async (file: File) => {
    try {
      const apiKey = '799956b901b3d647e5dc198601d9040d';
      const form = new FormData();
      form.append('image', file);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: form,
      });
      const json = await res.json();
      const url = json.data.url;
      onUpload(url);              // ✅ 使用 onUpload
    } catch (err) {
      console.error('圖片上傳失敗', err);
      alert('圖片上傳失敗，請稍後再試');
    }
  };

  /* 選檔：預覽 + 自動上傳 ------------------- */
  const handlePreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    uploadFile(file);
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      {previewUrl && (
        <div className="relative w-32 h-32 rounded-full border border-gray-300 p-[2px]">
          <Image
            src={previewUrl}
            alt="預覽圖"
            fill
            sizes="128px"
            className="object-cover rounded-full"
          />
        </div>
      )}

      {/* 隱藏原生 input */}
      <input
        type="file"
        accept="image/*"
        onChange={handlePreview}
        ref={fileInputRef}
        className="hidden"
      />

      {/* 自訂按鈕 */}
      <button
        type="button"
        className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
        onClick={() => fileInputRef.current?.click()}
      >
        選擇檔案
      </button>
    </div>
  );
}

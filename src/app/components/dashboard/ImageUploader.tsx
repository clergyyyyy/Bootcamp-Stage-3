'use client';

import { useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';

type Props = {
  /** 暫存選中的檔案；若想「移除頭貼」可傳 null */
  onSelect: (file: File | null) => void;
  /** 現存 avatarUrl（從父層帶入即可，不強制） */
  initialUrl?: string;
};

export default function ImageUploader({ onSelect, initialUrl }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ------- 若使用者已有上傳過頭貼，先抓一次 Firestore ------- */
  useEffect(() => {
    if (initialUrl) return; // 父層已給 URL，跳過抓取
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const snap = await getDoc(doc(db, 'profiles', user.uid));
      const data = snap.data();
      if (data?.avatarUrl) setPreviewUrl(data.avatarUrl);
    });
    return () => unsub();
  }, [initialUrl]);

  /* ------- 選檔：只做預覽與回傳 File ------- */
  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    onSelect(file);
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      {previewUrl && (
        <div className="relative w-32 h-32 rounded-full border border-gray-300 p-[2px]">
          <Image
            src={previewUrl}
            alt="頭貼預覽"
            fill
            sizes="128px"
            className="object-cover rounded-full"
          />
        </div>
      )}

      {}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleSelect}
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

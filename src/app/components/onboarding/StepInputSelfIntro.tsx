'use client';

import React, { useRef, useState } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { FormData } from './OnboardingLayout';
import { useRouter } from 'next/navigation';
import Image from 'next/image';


type Props = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onNext: () => void;
  onBack: () => void;
};

export default function StepInputSelfIntro({
  formData,
  setFormData,
  onBack,
}: Omit<Props, 'onNext'>) { 
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const imgbbApiKey = '799956b901b3d647e5dc198601d9040d'; // ⬅️ 換成你的 API 金鑰

    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
      method: 'POST',
      body: uploadFormData,
    });

    const data = await res.json();
    const url = data.data.url;

    setFormData(prev => ({ ...prev, avatarUrl: url }));
  } catch (err) {
    console.error('圖片上傳失敗', err);
    alert('圖片上傳失敗，請稍後再試');
  }
};

  const handleGenerateAI = async () => {
    const snapshot = await getDocs(collection(db, 'introduction-template'));
    const docs = snapshot.docs.map((d) => d.data().text as string);
    if (docs.length === 0) return;
    const random = docs[Math.floor(Math.random() * docs.length)];
    setFormData(prev => ({ ...prev, bio: random.slice(0, 80) }));
  };

    const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('請先登入');
      return;
    }

    try {
      setLoading(true);
      await setDoc(doc(db, 'profiles', user.uid), formData, { merge: true });
      router.push(`/complete?uid=${user.uid}`);
    } catch (err) {
      console.error('提交失敗', err);
      alert('無法提交，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">設定大頭貼與自我介紹</h1>

      <div className="flex flex-col items-center gap-3">
        {formData.avatarUrl ? (
        <div className="relative w-32 h-32">
          <Image
            src={formData.avatarUrl}
            alt="預覽圖"
            fill
            sizes="128px"
            className="object-cover rounded-full"
          />
        </div>
        ) : (
          <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
            無大頭貼
          </div>
        )}
        <button
          type="button"
          className="bg-gray text-white px-3 py-1 rounded hover:bg-[#A9A8B3]"
          onClick={() => fileInputRef.current?.click()}
        >
          選擇圖片
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Bio Title */}
      <div>
        <label className="block font-semibold mb-1">Bio 標題</label>
        <input
          type="text"
          value={formData.bioTitle}
          onChange={(e) => setFormData(prev => ({ ...prev, bioTitle: e.target.value }))}
          className="w-full border px-3 py-2 rounded"
          maxLength={30}
          placeholder="如：關於我 / About Me"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block font-semibold mb-1">Bio 內容 (最多 160 字)</label>
        <textarea
          value={formData.bio}
          onChange={(e) =>
            setFormData(prev => ({ ...prev, bio: e.target.value.slice(0, 160) }))
          }
          className="w-full border px-3 py-2 rounded resize-none"
          rows={4}
          maxLength={160}
          placeholder="簡短自我介紹..."
        />
        <div className="text-right text-xs text-gray-500">
          {formData.bio.length}/160
        </div>
      </div>

      {/* AI button */}
      <button
        type="button"
        className="bg-secondary text-l text-white px-2 py-2 mb-16 rounded hover:bg-secondary/90"
        onClick={handleGenerateAI}
      >
        由 AI 產生
      </button>

      {/* nav */}
      <div className="fixed bottom-0 left-0 w-full bg-white shadow-md px-6 py-4 z-50">
        <div className="flex justify-between">
      <button type="button" onClick={onBack} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">
        上一步
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? '提交中...' : '完成註冊'}
      </button>
    </div>
    </div>
    </div>
  );
}

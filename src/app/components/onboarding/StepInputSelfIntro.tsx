'use client';

import React, { useRef } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FormData } from './OnboardingLayout';
import Image from 'next/image';


type Props = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
};

export default function StepInputSelfIntro({
  formData,
  setFormData,
}: Omit<Props, 'onNext'>) { 
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Set FanLink Title and Introduction</h1>

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
            No Avatar
          </div>
        )}
        <button
          type="button"
          className="bg-gray text-white px-3 py-1 rounded hover:bg-[#A9A8B3]"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose Pic
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
        <label className="block font-semibold mb-1">FanLink Title</label>
        <input
          type="text"
          value={formData.bioTitle}
          onChange={(e) => setFormData(prev => ({ ...prev, bioTitle: e.target.value }))}
          className="w-full border px-3 py-2 rounded"
          maxLength={30}
          placeholder="Your name or nickname..."
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block font-semibold mb-1">Introduction</label>
        <textarea
          value={formData.bio}
          onChange={(e) =>
            setFormData(prev => ({ ...prev, bio: e.target.value.slice(0, 160) }))
          }
          className="w-full border px-3 py-2 rounded resize-none"
          rows={4}
          maxLength={160}
          placeholder="Tell us more about yourself..."
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
        Generate with AI
      </button>
    </div>
    
  );
}

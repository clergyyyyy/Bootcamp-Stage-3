'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FormData } from './OnboardingLayout';
import Image from 'next/image';

type Props = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
};

function InlineTextarea({
  value,
  onChange,
  maxLength = 160,
}: {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const finish = useCallback(() => {
    setEditing(false);
    if (ref.current) onChange(ref.current.innerText.trim());
  }, [onChange]);

  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) finish();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [editing, finish]);

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      finish();
    } else if (
      maxLength &&
      ref.current &&
      ref.current.innerText.length >= maxLength &&
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault();
    }
  };

  if (!editing) {
    return (
      <div
        className="cursor-text whitespace-pre-line border px-3 py-2 rounded min-h-[2.5rem]"
        onClick={() => setEditing(true)}
      >
        {value || <span className="text-gray-400">Tell us more about yourself…</span>}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={handleKey}
      className="whitespace-pre-wrap border px-3 py-2 rounded outline-none min-h-[2.5rem]"
    >
      {value}
    </div>
  );
}

export default function StepInputSelfIntro({
  formData,
  setFormData,
}: Omit<Props, 'onNext'>) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ⭐ 釋放舊的 blob URL
  useEffect(() => {
    return () => {
      if (formData.avatarUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(formData.avatarUrl);
      }
    };
  }, [formData.avatarUrl]);

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, avatarFile: file, avatarUrl: previewUrl }));
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
          onChange={handleSelectFile}
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

      {/* Introduction */}
      <div>
        <label className="block font-semibold mb-1">Introduction</label>
        <InlineTextarea
          value={formData.bio}
          maxLength={160}
          onChange={v => setFormData(prev => ({ ...prev, bio: v }))}
        />
        <div className="text-right text-xs text-gray-500">
          {formData.bio.length}/160
        </div>
      </div>

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

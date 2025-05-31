'use client';

import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function EditableText({
  label,
  value: initialValue,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialValue || '');

  useEffect(() => {
    setDraft(initialValue || '');
  }, [initialValue]);

  useEffect(() => {
    if (initialValue !== undefined) return;

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const profileRef = doc(db, 'profiles', user.uid);
      const snapshot = await getDoc(profileRef);
      const data = snapshot.data();
      if (data?.bio) {
        setDraft(data.bio);
        onChange(data.bio);
      }
    });

    return () => unsubscribe();
  }, [initialValue, onChange]);

  const handleBlur = () => {
    onChange(draft);
    setEditing(false);
  };

  return (
    <div className="relative">
      <label className="text-sm flex justify-center !text-gray-500 font-semibold mb-2 bg-gray-100">{label}</label>
      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
          rows={4}
          className="border px-2 py-1 w-full rounded"
          autoFocus
        />
      ) : (
        <div
          className="border px-2 py-1 rounded min-h-[6rem] cursor-pointer hover:bg-gray-100"
          onClick={() => setEditing(true)}
        >
          {draft || '點擊編輯...'}
        </div>
      )}
    </div>
  );
}

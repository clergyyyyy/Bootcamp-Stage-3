'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Props = {
  label: string;
  value?: string;
  onChange: (v: string) => void;  
  fieldKey?: 'bio' | 'bioTitle';  
  maxLength?: number;             
  minRows?: number;               
};

export function EditableText({
  label,
  value: initialValue,
  onChange,
  fieldKey = 'bio',
  maxLength = 160,
  minRows = 4,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialValue || '');
  const ref = useRef<HTMLDivElement>(null);

  const finish = useCallback(() => {
    if (ref.current) setDraft(ref.current.innerText);
    setEditing(false);
    onChange(ref.current?.innerText.trim() || '');
  }, [onChange]);

  /* ---------- 點外面自動結束 ---------- */
useEffect(() => {
  if (!editing) return;
  const h = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) finish();
  };
  document.addEventListener('mousedown', h);
  return () => document.removeEventListener('mousedown', h);
}, [editing, finish]);

  /* ---------- 外部 props 改變 ---------- */
  useEffect(() => setDraft(initialValue || ''), [initialValue]);

  /* ---------- 從 Firestore 補值 (初次進入) ---------- */
  useEffect(() => {
    if (initialValue !== undefined) return; // 已有值就不撈
    const unsub = onAuthStateChanged(getAuth(), async (u) => {
      if (!u) return;
      const snap = await getDoc(doc(db, 'profiles', u.uid));
      const raw = snap.data();
      if (raw?.[fieldKey]) {
        setDraft(raw[fieldKey]);
        onChange(raw[fieldKey]);
      }
    });
    return () => unsub();
  }, [initialValue, fieldKey, onChange]);

  /* ---------- 進入編輯時放內容 ---------- */
  useEffect(() => {
    if (editing && ref.current) ref.current.innerText = draft;
  }, [editing, draft]);

  /* ---------- 鍵盤 ---------- */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Esc -> 結束
    if (e.key === 'Escape') {
      e.preventDefault();
      finish();
      return;
    }
    // 字數上限
    if (
      maxLength &&
      ref.current &&
      ref.current.innerText.length >= maxLength &&
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault();
    }
    // 其餘保持預設 (Enter 換行)
  };

  return (
    <div className="relative">
      <label className="text-sm flex justify-center text-gray-500 font-semibold mb-2 bg-gray-100">
        {label}
      </label>

      {editing ? (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onKeyDown={handleKeyDown}
          className="whitespace-pre-wrap border px-2 py-1 w-full rounded outline-none"
          style={{ minHeight: `${minRows * 1.5}rem`, wordBreak: 'break-word' }}
        />
      ) : (
        <div
          className="border px-2 py-1 rounded cursor-pointer hover:bg-gray-100 whitespace-pre-line"
          style={{ minHeight: `${minRows * 1.5}rem` }}
          onClick={() => setEditing(true)}
        >
          {draft || <span className="text-gray-400">點擊編輯...</span>}
        </div>
      )}

      <div className="absolute right-1 -bottom-5 text-xs text-gray-400 select-none">
        {draft.length}/{maxLength}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

type Props = {
  formData: { siteID: string };
  updateForm: (data: Partial<{ siteID: string }>) => void;
  onNext: () => void;
};

export default function StepChooseUsername({ formData, updateForm, onNext }: Props) {
  const [error, setError] = useState('');

  /* 只有這裡──submit 時才呼叫 onNext */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.siteID.trim()) {
      setError('請填寫完整的 Site ID 與 Site 名稱');
      return;
    }

    setError('');
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold">建立 FanLink 基本資料</h1>

      <input
        className="w-full border px-2 py-1 rounded"
        placeholder="Site ID"
        value={formData.siteID}
        onChange={(e) => updateForm({ siteID: e.target.value })}
        required
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="fixed bottom-0 left-0 w-full bg-white shadow-md px-6 py-4 z-50">
        <div className="flex justify-between flex-row-reverse">
          <button
            type="button"
            onClick={onNext}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            下一步
          </button>
        </div>
      </div>
    </form>
  );
}

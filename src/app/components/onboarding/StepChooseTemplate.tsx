'use client';

import { useState } from 'react';

type Props = {
  formData: { template: string };
  updateForm: (data: Partial<{ template: string }>) => void;
  onNext: () => void;
  onBack: () => void;
};

const templateOptions = [
  { id: 'minimal',  name: '極簡風' },
  { id: 'colorful', name: '繽紛風' },
  { id: 'dark',     name: '深色風' },
];

export default function StepChooseTemplate({
  formData,
  updateForm,
  onNext,
  onBack,
}: Props) {
  const [error, setError] = useState('');

  /** 下一步時：若尚未選擇模板 → 顯示錯誤 */
  const handleNext = () => {
    if (!formData.template) {
      setError('請先選擇一個模板');
      return;
    }
    setError('');
    onNext();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">選擇你的模板樣式</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {templateOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => updateForm({ template: option.id })}
            className={`border p-4 rounded-md transition
              ${formData.template === option.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400'}`}
          >
            {option.name}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* 底部按鈕 */}
      <div className="fixed bottom-0 left-0 w-full bg-white shadow-md px-6 py-4 z-50">
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            上一步
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            下一步
          </button>
        </div>
      </div>
    </div>
  );
}

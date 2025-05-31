'use client';

import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { LinkItem } from './LinkItem';

const platforms = [
  'Instagram',
  'Threads',
  'Facebook',
  'LINE',
  'TikTok',
  'X',
  'Shopee',
];

export default function AddPlatformCard({ onAdd }: { onAdd: (item: LinkItem) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [url, setUrl] = useState('');
  const [btnWidth, setBtnWidth] = useState<number>();
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleConfirm = () => {
    if (!selectedPlatform) return;
    onAdd({ id: selectedPlatform, platform: selectedPlatform, url });
    setExpanded(false);
    setSelectedPlatform('');
    setUrl('');
  };

  if (!expanded) {
    return (
      <button
        ref={btnRef}
        onClick={() => {
          setBtnWidth(btnRef.current?.offsetWidth || undefined);
          setExpanded(true);
        }}
        className="w-full flex items-center justify-center gap-2 my-4 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        <Plus size={16} /> <span>Add</span>
      </button>
    );
  }

  return (
    <div
      className="transition-all duration-300 bg-white border border-gray-300 my-4 rounded p-4 space-y-4 w-full box-border"
      style={{ width: btnWidth }}
    >
      {/* 橫向平台清單 */}
      <div className="overflow-x-auto -mx-4 px-4 w-full">
        <div className="flex w-max gap-3">
          {platforms.map((platform) => (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`bg-gray-400 whitespace-nowrap border rounded px-4 py-2 text-sm font-medium font-black transition hover:bg-gray-500 ${
                selectedPlatform === platform ? 'bg-gray-700 text-white' : ''
              }`}
            >
              {platform}
            </button>
          ))}
        </div>
      </div>

      {/* URL 輸入 */}
      <input
        type="text"
        placeholder="輸入平台網址"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full border px-3 py-2 rounded text-sm"
      />

      {/* 操作按鈕 */}
      <div className="flex justify-end gap-2">
        <button onClick={() => setExpanded(false)} className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300">
          取消
        </button>
        <button onClick={handleConfirm} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
          確認新增
        </button>
      </div>
    </div>
  );
}

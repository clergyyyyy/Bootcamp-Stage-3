'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [isAnimating, setIsAnimating] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleExpand = () => {
    setBtnWidth(btnRef.current?.offsetWidth || undefined);
    setIsAnimating(true);
    setExpanded(true);
  };

  const handleCollapse = () => {
    setIsAnimating(true);
    setExpanded(false);
    setSelectedPlatform('');
    setUrl('');
  };

  const handleConfirm = () => {
    if (!selectedPlatform) return;
    onAdd({ id: selectedPlatform, platform: selectedPlatform, url });
    handleCollapse();
  };

  // 處理動畫完成
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300); // 與 CSS transition 時間保持一致
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  return (
    <div className="my-4 w-full">
      {/* 摺疊狀態的按鈕 */}
      <button
        ref={btnRef}
        onClick={handleExpand}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 ease-out transform hover:scale-[1.02] active:scale-[0.98] ${
          expanded ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 pointer-events-auto scale-100'
        }`}
        style={{
          position: expanded ? 'absolute' : 'static',
          zIndex: expanded ? -1 : 1,
        }}
      >
        <Plus size={16} className="transition-transform duration-300" /> 
        <span>Add</span>
      </button>

      {/* 展開狀態的內容 */}
      <div
        ref={contentRef}
        className={`bg-white border border-gray-300 rounded-lg p-4 space-y-4 w-full transition-all duration-300 ease-out transform-gpu ${
          expanded 
            ? 'opacity-100 scale-100 translate-y-0 max-h-96 pointer-events-auto' 
            : 'opacity-0 scale-95 -translate-y-2 max-h-0 pointer-events-none overflow-hidden p-0 border-0'
        }`}
        style={{ 
          width: btnWidth,
          transformOrigin: 'top center',
        }}
      >
        <div className={`space-y-4 transition-opacity duration-200 ${expanded ? 'opacity-100 delay-100' : 'opacity-0'}`}>
          {/* 橫向平台清單 */}
          <div className="overflow-x-auto overflow-y-hidden -mx-4 px-4 w-full hide-scrollbar">
            <div className="flex w-max gap-3  hide-scrollbar">
              {platforms.map((platform, index) => (
                <button
                  key={platform}
                  onClick={() => setSelectedPlatform(platform)}
                  className={`whitespace-nowrap border rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ease-out transform ${
                    selectedPlatform === platform 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                      : 'bg-gray-400 text-gray-700 border-gray-300 hover:bg-gray-500 hover:border-gray-400'
                  }`}
                  style={{
                    transitionDelay: expanded ? `${index * 30}ms` : '0ms', // 錯開動畫時間
                  }}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* URL 輸入 */}
          <div className="relative">
            <input
              type="text"
              placeholder="輸入平台網址"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
              autoFocus={expanded}
            />
            {url && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="flex justify-end gap-2 pt-2">
            <button 
              onClick={handleCollapse} 
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              取消
            </button>
            <button 
              onClick={handleConfirm} 
              disabled={!selectedPlatform}
              className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                selectedPlatform 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              確認新增
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { UnifiedLinkItem } from '@/types/unified-link';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';
import ObjektQueryCard from './ObjektQueryCard';

const platforms = [
  'Instagram',
  'Threads',
  'Facebook',
  'LINE',
  'TikTok',
  'X',
  'Shopee',
  'YouTube',
  'Spotify',
];

interface ObjektNFT {
  name: string;
  image: string;
  id: string;
}

export default function AddPlatformCard({ onAdd }: { onAdd: (item: UnifiedLinkItem) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [url, setUrl] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [btnWidth, setBtnWidth] = useState<number>();
  const [isAnimating, setIsAnimating] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'link' | 'text' | 'objekt'>('link');

  const [showObjektModal, setShowObjektModal] = useState(false);
  const [selectedObjekts, setSelectedObjekts] = useState<ObjektNFT[]>([]);

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
    setTextTitle('');
    setTextContent('');
    setMode('link');
    setShowObjektModal(false);
    setSelectedObjekts([]);
  };

  const handleConfirm = () => {
    if (mode === 'link') {
      if (!selectedPlatform || !url) return;

      let linkItem: UnifiedLinkItem;

      if (selectedPlatform === 'YouTube') {
        linkItem = {
          id: uuidv4(),
          type: 'youtube',
          platform: 'YouTube',
          url,
          order: 0,
        };
      } else if (selectedPlatform === 'Spotify') {
        linkItem = {
          id: uuidv4(),
          type: 'spotify',
          platform: 'Spotify',
          url,
          order: 0,
        };
      } else {
        linkItem = {
          id: uuidv4(),
          type: 'social',
          platform: selectedPlatform,
          url,
          order: 0,
        };
      }

      onAdd(linkItem);
    }

    if (mode === 'text') {
      const textBlock: UnifiedLinkItem = {
        id: uuidv4(),
        type: 'text',
        title: textTitle.trim() || '',
        content: textContent.trim(),
        order: 0,
      };
      onAdd(textBlock);
    }

    if (mode === 'objekt' && selectedObjekts.length > 0) {
      const objektItem: UnifiedLinkItem = {
        id: uuidv4(),
        type: 'objekt',
        objekts: selectedObjekts,
        title: `${selectedObjekts.length} 個 Objekt NFT`,
        order: 0,
      };
      onAdd(objektItem);
    }

    handleCollapse();
  };

  const handleModeChange = (newMode: 'link' | 'text' | 'objekt') => {
    setMode(newMode);
    setSelectedPlatform('');
    setUrl('');
    setTextTitle('');
    setTextContent('');
    setSelectedObjekts([]);
  };

  const handleObjektAdd = () => {
    setShowObjektModal(true);
  };

  const handleObjektConfirm = (objekts: ObjektNFT[]) => {
    setSelectedObjekts(objekts);
  };

  const handleObjektClose = () => {
    setShowObjektModal(false);
  };

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  const getPlaceholderText = () => {
    if (selectedPlatform === 'YouTube') {
      return '輸入 YouTube 影片網址';
    } else if (selectedPlatform === 'Spotify') {
      return '輸入 Spotify 歌曲、專輯或播放清單網址';
    }
    return '輸入平台網址';
  };

  const canConfirm = () => {
    if (mode === 'link') {
      return selectedPlatform && url;
    } else if (mode === 'text') {
      return textContent.trim();
    } else if (mode === 'objekt') {
      return selectedObjekts.length > 0;
    }
    return false;
  };

  return (
    <>
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
              ? 'opacity-100 scale-100 translate-y-0 max-h-108 pointer-events-auto' 
              : 'opacity-0 scale-95 -translate-y-2 max-h-0 pointer-events-none overflow-hidden p-0 border-0'
          }`}
          style={{ 
            width: btnWidth,
            transformOrigin: 'top center',
          }}
        >
          <div className={`space-y-4 transition-opacity duration-200 ${expanded ? 'opacity-100 delay-100' : 'opacity-0'}`}>
            {/* 模式切換按鈕 */}
            <div className="flex gap-2">
              <button
                onClick={() => handleModeChange('link')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                  mode === 'link' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Link
              </button>
              <button
                onClick={() => handleModeChange('text')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                  mode === 'text' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Text Block
              </button>
              <button
                onClick={() => handleModeChange('objekt')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                  mode === 'objekt' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Objekt NFT
              </button>
            </div>

            {/* 根據mode顯示對應內容 */}
            {mode === 'link' ? (
              <>
                <div className="overflow-x-auto overflow-y-hidden -mx-4 px-4 w-full hide-scrollbar">
                  <div className="flex w-max gap-3 hide-scrollbar">
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
                          transitionDelay: expanded ? `${index * 30}ms` : '0ms',
                        }}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder={getPlaceholderText()}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                    autoFocus={expanded && mode === 'link'}
                  />
                  {url && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </>
            ) : mode === 'text' ? (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Title <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Input Text Block Title..."
                        value={textTitle}
                        onChange={(e) => setTextTitle(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                        maxLength={50}
                      />
                      {textTitle && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 內容輸入（必填） */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      內容 <span className="text-red-500 text-xs">*</span>
                    </label>
                    <div className="relative">
                      <textarea
                        placeholder="Enter text..."
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 resize-none"
                        autoFocus={expanded && mode === 'text'}
                        maxLength={200}
                      />
                      {textContent && (
                        <div className="absolute right-3 top-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Show as individual text block</span>
                      <span>{textContent.length}/200</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Objekt NFT 模式 */}
                <div className="space-y-4">
                  {/* Add Objekt 區塊 */}
                  <div
                    onClick={handleObjektAdd}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                  >
                    <div className="text-gray-500 text-sm">
                      <Plus size={24} className="mx-auto mb-2" />
                      點擊新增 Objekt NFT
                    </div>
                  </div>

                  {/* 已選擇的 Objekts 預覽 */}
                  {selectedObjekts.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        已選擇 {selectedObjekts.length} 個 Objekt
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {selectedObjekts.map((objekt) => (
                          <div
                            key={objekt.id}
                            className="relative group"
                          >
                            <Image
                              src={objekt.image}
                              alt={objekt.name}
                              width={48}
                              height={48}
                              className="rounded border"
                            />
                            <button
                              onClick={() => setSelectedObjekts(prev => prev.filter(item => item.id !== objekt.id))}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

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
                disabled={!canConfirm()}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  canConfirm()
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

      {/* Objekt 搜尋模態框 */}
      <ObjektQueryCard
        isOpen={showObjektModal}
        onClose={handleObjektClose}
        onConfirm={handleObjektConfirm}
        initialSelected={selectedObjekts}
      />
    </>
  );
}
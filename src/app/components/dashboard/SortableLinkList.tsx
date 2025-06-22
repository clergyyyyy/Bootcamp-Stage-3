'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Trash2, GripVertical, AlertCircle, CheckCircle, ExternalLink, Edit3 } from 'lucide-react';
import Image from 'next/image';
import type { UnifiedLinkItem, ObjektNFT } from '@/types/unified-link';
import ObjektQueryCard from './ObjektQueryCard';

export interface SortableLinkListProps {
  unifiedLinks: UnifiedLinkItem[];
  onUpdateUnifiedLink: (id: string, updates: Partial<UnifiedLinkItem>) => void;
  onRemoveUnifiedLink: (id: string) => void;
  onReorderUnifiedLinks: (newOrder: UnifiedLinkItem[]) => void;
}

const ItemType = 'UNIFIED_LINK';

const deduplicateLinks = (links: UnifiedLinkItem[]): UnifiedLinkItem[] => {
  const seen = new Set<string>();

  return links.filter((link) => {
    let key: string;

    if (isTextItem(link)) {
      key = `text:${link.content.slice(0, 20)}`;
    } else if (isObjektItem(link)) {
      key = `objekt:${link.id}:${link.objekts.length}`;
    } else if (isLinkItem(link)) {
      key = `${link.type}:${(link.platform ?? '').toLowerCase()}:${link.url}`;
    } else {
      return false; // 理論上不會到這裡
    }

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// URL 檢核函數
const validateUrl = (url: string, platform: string): { isValid: boolean; message?: string; suggestion?: string } => {
  if (!url.trim()) {
    return { isValid: false, message: '請輸入網址' };
  }

  // 基本 URL 格式檢查
  const urlPattern = /^https?:\/\/.+\..+/;
  if (!urlPattern.test(url)) {
    const suggestion = url.startsWith('http') ? url : `https://${url}`;
    return { isValid: false, message: '請輸入完整網址', suggestion };
  }

  // 平台特定檢核
  const platformChecks: Record<string, RegExp> = {
    Instagram: /instagram\.com\//,
    TikTok: /tiktok\.com\/|douyin\.com\//,
    Facebook: /facebook\.com\/|fb\.com\//,
    X: /x\.com\/|twitter\.com\//,
    LINE: /line\.me\//,
    Shopee: /shopee\./,
    Threads: /threads\.net\//,
  };

  const platformRegex = platformChecks[platform];
  if (platformRegex && !platformRegex.test(url)) {
    return { isValid: false, message: `這似乎不是 ${platform} 的網址` };
  }

  return { isValid: true };
};

// 判斷是否為連結
const isLinkItem = (item: UnifiedLinkItem): item is Extract<UnifiedLinkItem, { type: 'social' | 'youtube' | 'spotify' | 'custom' }> => {
  return ['social', 'youtube', 'spotify', 'custom'].includes(item.type);
};

// 判斷是否為文字
const isTextItem = (item: UnifiedLinkItem): item is Extract<UnifiedLinkItem, { type: 'text' }> => {
  return item.type === 'text';
};

// 判斷是否為 Objekt
const isObjektItem = (item: UnifiedLinkItem): item is Extract<UnifiedLinkItem, { type: 'objekt' }> => {
  return item.type === 'objekt';
};

interface DraggableItemProps {
  item: UnifiedLinkItem;
  index: number;
  moveItem: (from: number, to: number) => void;
  onUpdateUnifiedLink: (id: string, updates: Partial<UnifiedLinkItem>) => void;
  onRemoveUnifiedLink: (id: string) => void;
}

function DraggableItem({ 
  item, 
  index, 
  moveItem, 
  onUpdateUnifiedLink, 
  onRemoveUnifiedLink 
}: DraggableItemProps) {
  const [editing, setEditing] = useState(false);
  const [draftUrl, setDraftUrl] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [validation, setValidation] = useState<{ isValid: boolean; message?: string; suggestion?: string }>({ isValid: true });
  const [showObjektModal, setShowObjektModal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLinkItem(item)) {
      setDraftUrl(item.url);
    } else if (isTextItem(item)) {
      setDraftContent(item.content);
      setDraftTitle(item.title || '');
    }
  }, [item]);

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    canDrag: () => !editing,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (dragItem: { index: number }, monitor) => {
      if (!ref.current) return;
      const dragIndex = dragItem.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverRect = ref.current.getBoundingClientRect();
      const hoverClientY = monitor.getClientOffset()?.y ?? 0;
      const hoverY = hoverClientY - hoverRect.top;

      const height = hoverRect.bottom - hoverRect.top;
      const upper = height * 0.3;
      const lower = height * 0.7;

      if (dragIndex < hoverIndex && hoverY < lower) return;
      if (dragIndex > hoverIndex && hoverY > upper) return;

      moveItem(dragIndex, hoverIndex);
      dragItem.index = hoverIndex;
    },
  });

  // 處理連結輸入變化
  const handleInputChange = (value: string) => {
    setDraftUrl(value);
    if (isLinkItem(item)) {
      const result = validateUrl(value, item.platform || '');
      setValidation(result);
      
      if (result.isValid && value !== item.url) {
        onUpdateUnifiedLink(item.id, { url: value });
      }
    }
  };

  // 處理文字內容變化
  const handleTextChange = (content: string, title?: string) => {
    setDraftContent(content);
    if (title !== undefined) setDraftTitle(title);
    
    if (isTextItem(item)) {
      onUpdateUnifiedLink(item.id, { 
        content, 
        ...(title !== undefined && { title }) 
      });
    }
  };

  // 處理 Objekt 編輯
  const handleObjektEdit = () => {
    setShowObjektModal(true);
  };

  // 處理 Objekt 更新
  const handleObjektUpdate = (objekts: ObjektNFT[]) => {
    if (isObjektItem(item)) {
      onUpdateUnifiedLink(item.id, { objekts });
    }
  };

  // 失去焦點時退出編輯模式
  const handleBlur = () => {
    if (isLinkItem(item) && validation.isValid && draftUrl !== item.url) {
      onUpdateUnifiedLink(item.id, { url: draftUrl });
    }
    setEditing(false);
  };

  // 鍵盤操作
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setEditing(false);
    } else if (e.key === 'Escape') {
      if (isLinkItem(item)) {
        setDraftUrl(item.url);
        setValidation({ isValid: true });
      } else if (isTextItem(item)) {
        setDraftContent(item.content);
        setDraftTitle(item.title || '');
      }
      setEditing(false);
    }
  };

  const applySuggestion = () => {
    if (validation.suggestion) {
      const newUrl = validation.suggestion;
      setDraftUrl(newUrl);
      const result = validateUrl(newUrl, isLinkItem(item) ? (item.platform || '') : '');
      setValidation(result);
      
      if (result.isValid) {
        onUpdateUnifiedLink(item.id, { url: newUrl });
      }
    }
  };

  drag(drop(ref));

  // 渲染不同類型的項目
  const renderItemContent = () => {
    if (isLinkItem(item)) {
      const linkValidation = validateUrl(item.url, item.platform || '');
      
      return (
        <div
          ref={ref}
          className={`flex items-center gap-2 border px-3 py-2 rounded bg-white shadow-sm transition-all duration-300 ease-out ${
            isDragging 
              ? 'opacity-0 scale-95' 
              : 'opacity-100 scale-100 transform-gpu'
          } ${!linkValidation.isValid && !editing ? 'border-red-300 bg-red-50' : ''}`}
        >
          <div className={`cursor-move transition-opacity duration-200 ${editing ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            <GripVertical size={16} />
          </div>
          <span className="text-sm font-medium w-20">{item.platform}</span>
          
          {editing ? (
            <div className="flex-1 flex flex-col h-14">
              <div className="relative mb-2">
                <input
                  value={draftUrl}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  className={`w-full border px-2 py-1 text-sm rounded focus:ring-2 transition-all duration-200 ${
                    validation.isValid 
                      ? 'focus:ring-blue-500 focus:border-blue-500 border-gray-300' 
                      : 'focus:ring-red-500 focus:border-red-500 border-red-300'
                  }`}
                  placeholder="https://..."
                  autoFocus
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  {validation.isValid ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <AlertCircle size={16} className="text-red-500" />
                  )}
                </div>
              </div>
              
              <div className="h-8 flex items-start justify-between">
                <div className="text-xs text-gray-500">
                  按 Enter 完成編輯，按 Esc 取消
                </div>
                
                {!validation.isValid && (
                  <div className="text-xs text-red-600 text-right flex-shrink-0 max-w-[60%]">
                    <p>{validation.message}</p>
                    {validation.suggestion && (
                      <button
                        onClick={applySuggestion}
                        className="text-blue-600 hover:underline block"
                      >
                        建議：{validation.suggestion}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2">
              <div
                className="flex-1 text-sm cursor-pointer hover:underline transition-all duration-200 hover:text-blue-600"
                onClick={() => setEditing(true)}
              >
                {item.url || '點此編輯'}
              </div>
              
              {item.url && (
                <>
                  {linkValidation.isValid ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={14} />
                    </a>
                  ) : (
                    <AlertCircle size={14} className="text-red-500" />
                  )}
                </>
              )}
            </div>
          )}
          
          <button
            onClick={() => {
              if (confirm('確定要刪除這個連結嗎？')) {
                onRemoveUnifiedLink(item.id);
              }
            }}
            className="transition-all duration-200 hover:scale-110"
          >
            <Trash2 size={16} className="text-red-500 hover:text-red-700 transition-colors duration-200" />
          </button>
        </div>
      );
    }

    if (isTextItem(item)) {
      return (
        <div
          ref={ref}
          className={`flex items-center gap-2 border px-3 py-2 rounded bg-white shadow-sm transition-all duration-300 ease-out ${
            isDragging 
              ? 'opacity-0 scale-95' 
              : 'opacity-100 scale-100 transform-gpu'
          }`}
        >
          <div className={`cursor-move transition-opacity duration-200 ${editing ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            <GripVertical size={16} />
          </div>
          <span className="text-sm font-medium w-20">Text Block</span>
          
          {editing ? (
            <div className="flex-1 space-y-2">
              <input
                value={draftTitle}
                onChange={(e) => handleTextChange(draftContent, e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full border px-2 py-1 text-sm rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="標題（選填）"
              />
              <textarea
                value={draftContent}
                onChange={(e) => handleTextChange(e.target.value, draftTitle)}
                onKeyDown={handleKeyDown}
                className="w-full border px-2 py-1 text-sm rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={2}
                placeholder="文字內容"
                autoFocus
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2">
              <div
                className="flex-1 cursor-pointer hover:bg-gray-50 p-1 rounded transition-all duration-200"
                onClick={() => setEditing(true)}
              >
                {item.title && (
                  <div className="text-sm font-medium text-gray-800">{item.title}</div>
                )}
                <div className="text-sm text-gray-600 truncate">
                  {item.content || '點此編輯文字內容'}
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={() => {
              if (confirm('確定要刪除這個文字方塊嗎？')) {
                onRemoveUnifiedLink(item.id);
              }
            }}
            className="transition-all duration-200 hover:scale-110"
          >
            <Trash2 size={16} className="text-red-500 hover:text-red-700 transition-colors duration-200" />
          </button>
        </div>
      );
    }

    if (isObjektItem(item)) {
      return (
        <div
          ref={ref}
          className={`flex items-center gap-2 border px-3 py-2 rounded bg-white shadow-sm transition-all duration-300 ease-out ${
            isDragging 
              ? 'opacity-0 scale-95' 
              : 'opacity-100 scale-100 transform-gpu'
          }`}
        >
          <div className="cursor-move">
            <GripVertical size={16} />
          </div>
          <span className="text-sm font-medium w-20">Objekt NFT</span>
          
          <div className="flex-1 flex items-center gap-2">
            {/* NFT 預覽區域 */}
            <div className="flex-1">
              {item.objekts && item.objekts.length > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2 overflow-hidden">
                    {item.objekts.slice(0, 3).map((objekt) => (
                      <Image
                        key={objekt.id}
                        src={objekt.image}
                        alt={objekt.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded border-2 border-white object-cover"
                        title={objekt.name}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {item.objekts.length} 個 Objekt{item.objekts.length > 3 && ' ...'}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">尚未選擇 Objekt</span>
              )}
            </div>
            
            {/* 編輯按鈕 */}
            <button
              onClick={handleObjektEdit}
              className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
              title="編輯 Objekt"
            >
              <Edit3 size={14} />
            </button>
          </div>
          
          <button
            onClick={() => {
              if (confirm('確定要刪除這個 Objekt 區塊嗎？')) {
                onRemoveUnifiedLink(item.id);
              }
            }}
            className="transition-all duration-200 hover:scale-110"
          >
            <Trash2 size={16} className="text-red-500 hover:text-red-700 transition-colors duration-200" />
          </button>

          {/* Objekt 編輯模態框 */}
          <ObjektQueryCard
            isOpen={showObjektModal}
            onClose={() => setShowObjektModal(false)}
            onConfirm={handleObjektUpdate}
            initialSelected={item.objekts || []}
          />
        </div>
      );
    }

    return null;
  };

  return renderItemContent();
}

export default function SortableLinkList({ 
  unifiedLinks, 
  onUpdateUnifiedLink, 
  onRemoveUnifiedLink, 
  onReorderUnifiedLinks 
}: SortableLinkListProps) {
  const [localItems, setLocalItems] = useState<UnifiedLinkItem[]>(
    deduplicateLinks(unifiedLinks)
  );

  useEffect(() => {
    setLocalItems(deduplicateLinks(unifiedLinks));
  }, [unifiedLinks]);

  const moveItem = useCallback((from: number, to: number) => {
    const updated = [...localItems];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setLocalItems(updated);
    onReorderUnifiedLinks(updated);
  }, [localItems, onReorderUnifiedLinks]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-3">
        {localItems.map((item, index) => (
          <DraggableItem
            key={item.id}
            item={item}
            index={index}
            moveItem={moveItem}
            onUpdateUnifiedLink={onUpdateUnifiedLink}
            onRemoveUnifiedLink={onRemoveUnifiedLink}
          />
        ))}
      </div>
    </DndProvider>
  );
}
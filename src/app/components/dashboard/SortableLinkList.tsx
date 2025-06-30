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
  onDragStart?: () => void;      // ✅ 新增：拖曳開始回調
  onDragComplete?: () => void; 
}

const socials = [
  'Instagram',
  'Threads',
  'Facebook',
  'LINE',
  'TikTok',
  'X',
  'Shopee',
  'GitHub',
  'YouTube',
  'Spotify'
];

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
      return false;
    }

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// URL 檢核函數
const validateUrl = (
  url: string,
  platform: string
): { isValid: boolean; message?: string; suggestion?: string } => {
  if (!url.trim()) {
    return { isValid: false, message: '請輸入網址' };
  }

  // 基本 https 開頭檢查
  const urlPattern = /^https?:\/\/.+\..+/;
  if (!urlPattern.test(url)) {
    const suggestion = url.startsWith('http') ? url : `https://${url}`;
    return { isValid: false, message: '請輸入完整網址', suggestion };
  }

  // 若非內建平台，略過檢查
  if (!socials.includes(platform)) {
    return { isValid: true };
  }

  const platformChecks: Record<string, RegExp> = {
    Instagram: /instagram\.com\//,
    TikTok: /tiktok\.com\/|douyin\.com\//,
    Facebook: /facebook\.com\/|fb\.com\//,
    X: /x\.com\/|twitter\.com\//,
    LINE: /line\.me\//,
    Shopee: /shopee\./,
    Threads: /threads\.com\//,
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
  onDragStart?: () => void;  // ✅ 新增
  onDragEnd?: () => void;    // ✅ 新增
  isDragInProgress?: boolean; // ✅ 新增
}

function DraggableItem({ 
  item, 
  index, 
  moveItem, 
  onUpdateUnifiedLink, 
  onRemoveUnifiedLink,
  onDragStart, // ✅ 接收 props
  onDragEnd,   // ✅ 接收 props
  isDragInProgress // ✅ 接收 props
}: DraggableItemProps) {
  const [editing, setEditing] = useState(false);
  const [draftUrl, setDraftUrl] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [platformEditing, setPlatformEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftPlatform, setDraftPlatform] = useState('');
  const [validation, setValidation] = useState<{ isValid: boolean; message?: string; suggestion?: string }>({ isValid: true });
  const [showObjektModal, setShowObjektModal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLinkItem(item)) {
      setDraftUrl(item.url);
      setDraftPlatform(item.platform || '');
    }
    if (isTextItem(item)) {
      setDraftContent(item.content);
      setDraftTitle(item.title || '');
    }
  }, [item]);

  const [{ isDragging }, drag] = useDrag<
    { index: number },
    void,
    { isDragging: boolean }
  >({
    type: ItemType,
    item: { index },
    canDrag: () => !editing && !platformEditing && !showObjektModal,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // ✅ 使用 useEffect 來監聽拖曳狀態變化
  useEffect(() => {
    if (isDragging && onDragStart) {
      onDragStart();
    } else if (!isDragging && onDragEnd && isDragInProgress) {
      // 只有在拖曳剛結束時才觸發
      setTimeout(() => {
        onDragEnd();
      }, 100);
    }
  }, [isDragging, onDragStart, onDragEnd, isDragInProgress]);

  const [{ isOver }, drop] = useDrop<
    { index: number },
    void,
    { isOver: boolean }
  >({
    accept: ItemType,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    hover: (dragItem, monitor) => {
      if (!ref.current) return;
      const dragIndex = dragItem.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverRect = ref.current.getBoundingClientRect();
      const hoverClientY = monitor.getClientOffset()?.y ?? 0;
      const hoverY = hoverClientY - hoverRect.top;

      const height = hoverRect.bottom - hoverRect.top;
      const threshold = height * 0.5; // 簡化判斷邏輯

      // 只在跨越中點時觸發重新排序
      if (
        (dragIndex < hoverIndex && hoverY > threshold) ||
        (dragIndex > hoverIndex && hoverY < threshold)
      ) {
        moveItem(dragIndex, hoverIndex);
        dragItem.index = hoverIndex;
      }
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

  // ✅ 處理文字內容變化 - 支援即時更新
  const handleTextChange = (field: 'title' | 'content', value: string) => {
    if (field === 'title') {
      setDraftTitle(value);
      if (isTextItem(item)) {
        onUpdateUnifiedLink(item.id, { title: value });
      }
    } else {
      setDraftContent(value);
      if (isTextItem(item)) {
        onUpdateUnifiedLink(item.id, { content: value });
      }
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

  // ✅ 改進的失去焦點處理 - 使用延遲檢查避免在編輯區域內切換焦點時退出
  const handleBlur = (e: React.FocusEvent) => {
    // 延遲檢查，讓新的焦點事件有時間觸發
    setTimeout(() => {
      // 檢查新的焦點是否仍在當前編輯區域內
      const activeElement = document.activeElement;
      const currentContainer = ref.current?.querySelector('[data-editing-container]');
      
      // 如果焦點不在當前編輯容器內，才退出編輯模式
      if (!currentContainer || !currentContainer.contains(activeElement)) {
        if (isLinkItem(item) && validation.isValid && draftUrl !== item.url) {
          onUpdateUnifiedLink(item.id, { url: draftUrl });
        }
        setEditing(false);
      }
    }, 0);
  };

  // 鍵盤操作
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Shift+Enter 允許換行
      e.preventDefault();
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

  // 統一的容器樣式
  const containerClassName = `
    flex items-center gap-2 border px-3 py-2 rounded bg-white shadow-sm 
    transition-all duration-200 ease-out transform-gpu
    ${isDragging 
      ? 'opacity-50 scale-[0.98] shadow-lg ring-2 ring-blue-300 z-10' 
      : 'opacity-100 scale-100 hover:shadow-md'
    }
    ${isOver ? 'ring-2 ring-blue-200' : ''}
    ${!editing && !platformEditing && !showObjektModal ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
  `;

  // 渲染不同類型的項目
  const renderItemContent = () => {
    if (isLinkItem(item)) {
      const linkValidation = validateUrl(item.url, item.platform || '');

      return (
        <div
          ref={ref}
          className={`${containerClassName} ${
            !linkValidation.isValid && !editing ? 'border-red-300 bg-red-50' : ''
          }`}
          style={{
            transform: isDragging ? 'rotate(2deg)' : 'rotate(0deg)',
            transition: isDragging ? 'none' : 'all 0.2s ease-out',
          }}
        >
          {/* 拖拉把手 */}
          <div className={`
            transition-all duration-200
            ${editing || platformEditing 
              ? 'opacity-30 pointer-events-none cursor-not-allowed' 
              : 'opacity-70 hover:opacity-100 cursor-grab active:cursor-grabbing'
            }
          `}>
            <GripVertical size={16} />
          </div>

          {/* 平台名稱區域 */}
          {item.type === 'custom' &&
          !['spotify', 'youtube'].includes((item.platform || '').toLowerCase()) ? (
            platformEditing ? (
              <input
                value={draftPlatform}
                onChange={(e) => setDraftPlatform(e.target.value)}
                onBlur={() => {
                  setPlatformEditing(false);
                  if (draftPlatform !== item.platform) {
                    onUpdateUnifiedLink(item.id, { platform: draftPlatform });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPlatformEditing(false);
                    if (draftPlatform !== item.platform) {
                      onUpdateUnifiedLink(item.id, { platform: draftPlatform });
                    }
                  } else if (e.key === 'Escape') {
                    setPlatformEditing(false);
                    setDraftPlatform(item.platform || '');
                  }
                }}
                className="w-24 text-sm font-medium border px-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <span
                className="w-24 text-sm font-medium cursor-pointer hover:underline text-blue-600 transition-colors duration-200"
                onClick={() => setPlatformEditing(true)}
                title="點擊修改平台名稱"
              >
                {item.platform || '自訂平台'}
              </span>
            )
          ) : (
            <span className="w-20 text-sm font-medium">{item.platform}</span>
          )}

          {/* URL 區域 */}
          {editing ? (
            <div className="flex-1 flex flex-col">
              <div className="relative">
                <input
                  value={draftUrl}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  className={`
                    w-full border px-2 py-1 text-sm rounded transition-all duration-200
                    ${validation.isValid
                      ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300'
                      : 'focus:ring-2 focus:ring-red-500 focus:border-red-500 border-red-300'
                    }
                  `}
                  placeholder="https://..."
                  autoFocus
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {validation.isValid ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <AlertCircle size={16} className="text-red-500" />
                  )}
                </div>
              </div>

              {!validation.isValid && (
                <div className="text-xs text-red-600 mt-1">
                  {validation.message}{' '}
                  {validation.suggestion && (
                    <button
                      onClick={applySuggestion}
                      className="text-blue-600 hover:underline"
                    >
                      建議：{validation.suggestion}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2">
              <div
                className="flex-1 text-sm cursor-pointer hover:underline transition-colors duration-200"
                onClick={() => setEditing(true)}
              >
                {item.url || '點此編輯'}
              </div>
              {item.url && (
                linkValidation.isValid ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <AlertCircle size={14} className="text-red-500" />
                )
              )}
            </div>
          )}

          {/* 刪除按鈕 */}
          <button
            onClick={() => {
              if (confirm('確定要刪除這個連結嗎？')) {
                onRemoveUnifiedLink(item.id);
              }
            }}
            className="hover:scale-110 transition-transform duration-200 p-1"
          >
            <Trash2 size={16} className="text-red-500 hover:text-red-700" />
          </button>
        </div>
      );
    }

    if (isTextItem(item)) {
      return (
        <div
          ref={ref}
          className={containerClassName}
          style={{
            transform: isDragging ? 'rotate(-1deg)' : 'rotate(0deg)',
            transition: isDragging ? 'none' : 'all 0.2s ease-out',
          }}
        >
          {/* 拖曳把手 */}
          <div className={`
            transition-all duration-200
            ${editing 
              ? 'opacity-30 pointer-events-none cursor-not-allowed' 
              : 'opacity-70 hover:opacity-100 cursor-grab active:cursor-grabbing'
            }
          `}>
            <GripVertical size={16} />
          </div>

          {/* 平台名稱 */}
          <span className="text-sm font-medium w-20">Text Block</span>

          {/* ✅ 內容編輯區域 - 現在支援 Title 和 Content */}
          <div className="flex-1">
            {editing ? (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()} data-editing-container>
                {/* Title 輸入框 */}
                <input
                  type="text"
                  className="w-full text-sm font-medium border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="標題（選填）"
                  value={draftTitle}
                  onChange={(e) => handleTextChange('title', e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  onClick={(e) => e.stopPropagation()}
                />
                
                {/* Content 文字區域 */}
                <textarea
                  className="w-full text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  rows={3}
                  placeholder="輸入文字內容..."
                  value={draftContent}
                  onChange={(e) => handleTextChange('content', e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
                
                {/* 編輯提示 */}
                <div className="text-xs text-gray-500">
                  按 Enter 完成編輯，Shift+Enter 換行，Esc 取消
                </div>
              </div>
            ) : (
              <div
                className="cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors duration-200"
                onClick={() => setEditing(true)}
              >
                {/* ✅ 始終顯示 Title 區域 */}
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {item.title || '（點擊添加標題）'}
                </div>
                
                {/* ✅ 顯示 Content */}
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {item.content || '（點擊編輯文字內容）'}
                </div>
              </div>
            )}
          </div>

          {/* 刪除按鈕 */}
          <button
            onClick={() => {
              if (confirm('確定要刪除這個文字方塊嗎？')) {
                onRemoveUnifiedLink(item.id);
              }
            }}
            className="transition-all duration-200 hover:scale-110 p-1"
          >
            <Trash2 size={16} className="text-red-500 hover:text-red-700" />
          </button>
        </div>
      );
    }

    if (isObjektItem(item)) {
      return (
        <div
          ref={ref}
          className={containerClassName}
          style={{
            transform: isDragging ? 'rotate(1deg)' : 'rotate(0deg)',
            transition: isDragging ? 'none' : 'all 0.2s ease-out',
          }}
        >
          <div className="cursor-grab active:cursor-grabbing opacity-70 hover:opacity-100 transition-opacity duration-200">
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
                        className="w-8 h-8 rounded border-2 border-white object-cover transition-transform duration-200 hover:scale-105"
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
              className="text-blue-500 hover:text-blue-700 transition-colors duration-200 p-1"
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
            className="transition-all duration-200 hover:scale-110 p-1"
          >
            <Trash2 size={16} className="text-red-500 hover:text-red-700" />
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
  onReorderUnifiedLinks,
  onDragStart,     // ✅ 接收新的回調
  onDragComplete// ✅ 接收拖曳完成回調
}: SortableLinkListProps) {
  const [localItems, setLocalItems] = useState<UnifiedLinkItem[]>(
    deduplicateLinks(unifiedLinks)
  );
  const [isDragInProgress, setIsDragInProgress] = useState(false); // ✅ 追蹤拖曳狀態

  useEffect(() => {
    const processed = unifiedLinks.map((link) => {
      if (isLinkItem(link)) {
        const isKnown = socials.includes(link.platform || '');
        return {
          ...link,
          type: isKnown ? link.type : 'custom',
        };
      }
      return link;
    });

    setLocalItems(deduplicateLinks(processed));
  }, [unifiedLinks]);

  const moveItem = useCallback((from: number, to: number) => {
    const updated = [...localItems];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setLocalItems(updated);
    onReorderUnifiedLinks(updated);
  }, [localItems, onReorderUnifiedLinks]);

  // ✅ 處理拖曳開始
  const handleDragStart = useCallback(() => {
    console.log('Drag started in SortableLinkList');
    setIsDragInProgress(true);
    onDragStart?.(); // 通知父組件
  }, [onDragStart]);

  // ✅ 處理拖曳結束
  const handleDragEnd = useCallback(() => {
    console.log('Drag ended in SortableLinkList');
    setIsDragInProgress(false);
    // 延遲一點點再觸發，確保 DOM 更新完成
    setTimeout(() => {
      onDragComplete?.(); // 通知父組件
    }, 100);
  }, [onDragComplete]);

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
            onDragStart={handleDragStart}     // ✅ 傳遞給 DraggableItem
            onDragEnd={handleDragEnd}        // ✅ 傳遞給 DraggableItem
            isDragInProgress={isDragInProgress} // ✅ 傳遞拖曳狀態
          />
        ))}
      </div>
    </DndProvider>
  );
}
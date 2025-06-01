// components/SortableLinkList.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useCallback } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Trash2, GripVertical, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { LinkItem } from './LinkItem';

export type SortableLinkListProps = {
  links: LinkItem[];
  onUpdateLink: (id: string, newUrl: string) => void;
  onRemoveLink: (id: string) => void;
  onDragEnd: (newOrder: LinkItem[]) => void;
};

const ItemType = 'LINK';

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

function DraggableLink({ link, index, moveLink, onUpdateLink, onRemoveLink }: {
  link: LinkItem;
  index: number;
  moveLink: (from: number, to: number) => void;
  onUpdateLink: (id: string, newUrl: string) => void;
  onRemoveLink: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftUrl, setDraftUrl] = useState(link.url);
  const [validation, setValidation] = useState<{ isValid: boolean; message?: string; suggestion?: string }>({ isValid: true });
  const ref = useRef<HTMLDivElement>(null);

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
    hover: (item: { index: number }, monitor) => {
      if (!ref.current) return;
      const dragIndex = item.index;
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

      moveLink(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  // 實時檢核和自動保存
  const handleInputChange = (value: string) => {
    setDraftUrl(value);
    const result = validateUrl(value, link.platform);
    setValidation(result);
    
    // 如果驗證通過，立即保存
    if (result.isValid && value !== link.url) {
      onUpdateLink(link.id, value);
    }
  };

  // 失去焦點時退出編輯模式
  const handleBlur = () => {
    // 如果當前內容有效，確保已保存
    if (validation.isValid && draftUrl !== link.url) {
      onUpdateLink(link.id, draftUrl);
    }
    setEditing(false);
  };

  // 鍵盤操作
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Enter 鍵退出編輯
      setEditing(false);
    } else if (e.key === 'Escape') {
      // Escape 鍵取消編輯並恢復原值
      setDraftUrl(link.url);
      setValidation({ isValid: true });
      setEditing(false);
    }
  };

  const applySuggestion = () => {
    if (validation.suggestion) {
      const newUrl = validation.suggestion;
      setDraftUrl(newUrl);
      const result = validateUrl(newUrl, link.platform);
      setValidation(result);
      
      // 如果建議的 URL 有效，立即保存
      if (result.isValid) {
        onUpdateLink(link.id, newUrl);
      }
    }
  };

  drag(drop(ref));

  const linkValidation = validateUrl(link.url, link.platform);

  return (
    <div
      ref={ref}
      className={`flex items-center gap-2 border px-3 py-2 rounded bg-white shadow-sm transition-all duration-300 ease-out ${
        isDragging 
          ? 'opacity-0 scale-95' 
          : 'opacity-100 scale-100 transform-gpu'
      } ${!linkValidation.isValid && !editing ? 'border-red-300 bg-red-50' : ''}`}
      style={{
        transform: isDragging ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className={`cursor-move transition-opacity duration-200 ${editing ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
        <GripVertical size={16} />
      </div>
      <span className="text-sm font-medium w-20">{link.platform}</span>
      
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
          
          {/* 固定高度的底部區域：操作提示和錯誤訊息並排 */}
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
            {link.url || '點此編輯'}
          </div>
          
          {link.url && (
            <>
              {linkValidation.isValid ? (
                <a
                  href={link.url}
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
            onRemoveLink(link.id);
          }
        }}
        className="transition-all duration-200 hover:scale-110"
      >
        <Trash2 size={16} className="text-red-500 hover:text-red-700 transition-colors duration-200" />
      </button>
    </div>
  );
}

export default function SortableLinkList({ links, onUpdateLink, onRemoveLink, onDragEnd }: SortableLinkListProps) {
  const [items, setItems] = useState<LinkItem[]>(links);
  
  useEffect(() => {
    setItems(links);
  }, [links]);

  const moveLink = useCallback((from: number, to: number) => {
    const updated = [...items];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setItems(updated);
    onDragEnd(updated);
  }, [items, onDragEnd]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-3">
        {items.map((link, index) => (
          <DraggableLink
            key={link.id}
            link={link}
            index={index}
            moveLink={moveLink}
            onUpdateLink={onUpdateLink}
            onRemoveLink={onRemoveLink}
          />
        ))}
      </div>
    </DndProvider>
  );
}
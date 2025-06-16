'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Trash2, GripVertical, AlertCircle, CheckCircle, ExternalLink, Play, Music } from 'lucide-react';
import { LinkItem, LinkType } from '@/types/link';

/* ------------------------------------------------------------------ */
/* 型別定義                                                             */
/* ------------------------------------------------------------------ */
export type UnifiedLinkItem = {
  id: string;
  type: 'social' | 'youtube' | 'spotify' | 'custom';
  platform?: string;
  title?: string;
  url: string;
  order: number;
};

export type SortableLinkListProps = {
  links?: LinkItem[];                   // legacy
  unifiedLinks?: UnifiedLinkItem[];     // new
  onUpdateLink?: (id: string, url: string) => void;
  onRemoveLink?: (id: string) => void;
  onDragEnd?: (newOrder: LinkItem[]) => void;

  onUpdateUnifiedLink?: (id: string, updates: Partial<UnifiedLinkItem>) => void;
  onRemoveUnifiedLink?: (id: string) => void;
  onReorderUnifiedLinks?: (newOrder: UnifiedLinkItem[]) => void;
};

const ItemType = 'LINK';

/* ------------------------------------------------------------------ */
/* URL 驗證                                                             */
/* ------------------------------------------------------------------ */
const validateUrl = (
  url: string,
  platform?: string,
  type?: string,
): { isValid: boolean; message?: string; suggestion?: string } => {
  if (!url.trim()) return { isValid: false, message: '請輸入網址' };

  if (!/^https?:\/\/.+/.test(url)) {
    return {
      isValid: false,
      message: '請輸入完整網址',
      suggestion: url.startsWith('http') ? url : `https://${url}`,
    };
  }

  if (type === 'youtube') {
    const yt = /(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/channel\/|youtube\.com\/c\/|youtube\.com\/@)/;
    if (!yt.test(url)) return { isValid: false, message: '請輸入有效的 YouTube 網址' };
  } else if (type === 'spotify') {
    const sp = /(open\.)?spotify\.com\/(track|album|playlist|artist)\//;
    if (!sp.test(url)) return { isValid: false, message: '請輸入有效的 Spotify 網址' };
  } else if (platform) {
    const checks: Record<string, RegExp> = {
      Instagram: /instagram\.com\//,
      TikTok: /tiktok\.com\/|douyin\.com\//,
      Facebook: /facebook\.com\/|fb\.com\//,
      X: /x\.com\/|twitter\.com\//,
      LINE: /line\.me\//,
      Shopee: /shopee\./,
      Threads: /threads\.com\//,
    };
    const rx = checks[platform];
    if (rx && !rx.test(url)) return { isValid: false, message: `這似乎不是 ${platform} 的網址` };
  }

  return { isValid: true };
};

/* ------------------------------------------------------------------ */
/* 判斷是否使用 Unified 格式                                             */
/* ------------------------------------------------------------------ */
const isUsingUnifiedFormat = (p: SortableLinkListProps) =>
  !!p.unifiedLinks || !!p.onUpdateUnifiedLink;

/* ------------------------------------------------------------------ */
/* legacy -> unified 轉換                                              */
/* ------------------------------------------------------------------ */
const convertToUnified = (links: LinkItem[] = []): UnifiedLinkItem[] =>
  links.map((l, idx) => {
    const plat = l.platform ?? '';

    if (plat === 'YouTube') {
      return { id: l.id, type: 'youtube', url: l.url, order: idx };
    }
    if (plat === 'Spotify') {
      return { id: l.id, type: 'spotify', url: l.url, order: idx };
    }

    const socials = ['Instagram', 'Threads', 'Facebook', 'LINE', 'TikTok', 'X', 'Shopee', 'GitHub'];
    if (socials.includes(plat)) {
      return { id: l.id, type: 'social', platform: plat, url: l.url, order: idx };
    }

    return { id: l.id, type: 'custom', title: plat, url: l.url, order: idx };
  });

/* ------------------------------------------------------------------ */
/* 單筆可拖曳 row                                                       */
/* ------------------------------------------------------------------ */
function DraggableUnifiedLink({
  link,
  index,
  moveLink,
  onUpdateLink,
  onRemoveLink,
}: {
  link: UnifiedLinkItem;
  index: number;
  moveLink: (from: number, to: number) => void;
  onUpdateLink: (id: string, updates: Partial<UnifiedLinkItem>) => void;
  onRemoveLink: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftUrl, setDraftUrl] = useState(link.url);
  const [validation, setValidation] = useState<{ isValid: boolean; message?: string; suggestion?: string }>({ isValid: true });

  const ref = useRef<HTMLDivElement>(null);

  /* DnD hooks */
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    canDrag: () => !editing,
    collect: (m) => ({ isDragging: m.isDragging() }),
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item: { index: number }, monitor) => {
      if (!ref.current) return;
      const dragIdx = item.index;
      const hoverIdx = index;
      if (dragIdx === hoverIdx) return;

      const rect = ref.current.getBoundingClientRect();
      const hoverY = (monitor.getClientOffset()?.y ?? 0) - rect.top;
      const third = (rect.bottom - rect.top) / 3;

      if (dragIdx < hoverIdx && hoverY < third * 2) return;
      if (dragIdx > hoverIdx && hoverY > third) return;

      moveLink(dragIdx, hoverIdx);
      item.index = hoverIdx;
    },
  });

  drag(drop(ref));

  /* input handler */
  const handleChange = (val: string) => {
    setDraftUrl(val);
    const pName = link.platform || link.title || '';
    const v = validateUrl(val, pName, link.type);
    setValidation(v);
    if (v.isValid && val !== link.url) onUpdateLink(link.id, { url: val });
  };

  /* blur / key */
  const handleBlur = () => {
    if (validation.isValid && draftUrl !== link.url) onUpdateLink(link.id, { url: draftUrl });
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') setEditing(false);
    if (e.key === 'Escape') {
      setDraftUrl(link.url);
      setValidation({ isValid: true });
      setEditing(false);
    }
  };

  const applySuggestion = () => {
    if (!validation.suggestion) return;
    const val = validation.suggestion;
    setDraftUrl(val);
    const pName = link.platform || link.title || '';
    const v = validateUrl(val, pName, link.type);
    setValidation(v);
    if (v.isValid) onUpdateLink(link.id, { url: val });
  };

  /* render helpers */
  const iconInfo =
    link.type === 'youtube'
      ? { txt: 'YouTube', icon: <Play size={16} className="text-red-600" /> }
      : link.type === 'spotify'
      ? { txt: 'Spotify', icon: <Music size={16} className="text-green-600" /> }
      : link.type === 'social'
      ? { txt: link.platform || '', icon: null }
      : { txt: link.title || '', icon: null };

  const isEmbed = link.type === 'youtube' || link.type === 'spotify';
  const platformName = link.platform || link.title || '';
  const linkValid = validateUrl(link.url, platformName, link.type);

  /* JSX */
  return (
    <div
      ref={ref}
      className={`flex items-center gap-2 border px-3 py-2 rounded shadow-sm transition-all ${
        isDragging ? 'opacity-0 scale-95' : 'opacity-100'
      } ${!linkValid.isValid && !editing ? 'border-red-300 bg-red-50' : ''} ${
        isEmbed ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200' : 'bg-white'
      }`}
    >
      {/* drag handle */}
      <div className={`cursor-move ${editing && 'opacity-30 pointer-events-none'}`}>
        <GripVertical size={16} />
      </div>

      {/* name / icon */}
      <div className="flex items-center gap-2 w-24">
        {iconInfo.icon}
        <span className={`text-sm font-medium truncate ${isEmbed && 'text-purple-800'}`}>{iconInfo.txt}</span>
      </div>

      {/* url / input */}
      {editing ? (
        <div className="flex-1 flex flex-col h-14">
          <div className="relative mb-2">
            <input
              value={draftUrl}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className={`w-full border px-2 py-1 text-sm rounded focus:ring-2 ${
                validation.isValid ? 'focus:ring-blue-500 border-gray-300' : 'focus:ring-red-500 border-red-300'
              }`}
              placeholder="https://..."
              autoFocus
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {validation.isValid ? <CheckCircle size={16} className="text-green-500" /> : <AlertCircle size={16} className="text-red-500" />}
            </div>
          </div>

          {!validation.isValid && (
            <div className="text-xs text-red-600 text-right">
              <p>{validation.message}</p>
              {validation.suggestion && (
                <button onClick={applySuggestion} className="text-blue-600 hover:underline">
                  建議：{validation.suggestion}
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 text-sm cursor-pointer hover:underline" onClick={() => setEditing(true)}>
            {link.url || '點此編輯'}
          </div>

          {/* embed 標籤 */}
          {isEmbed && <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">{link.type === 'youtube' ? '影片' : '音樂'}</span>}

          {/* open / error icon */}
          {link.url &&
            (linkValid.isValid ? (
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-500" onClick={(e) => e.stopPropagation()}>
                <ExternalLink size={14} />
              </a>
            ) : (
              <AlertCircle size={14} className="text-red-500" />
            ))}
        </div>
      )}

      {/* delete */}
      <button
        onClick={() => confirm('確定要刪除這個連結嗎？') && onRemoveLink(link.id)}
        className="hover:scale-110 transition-transform"
      >
        <Trash2 size={16} className="text-red-500 hover:text-red-700" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 主元件                                                              */
/* ------------------------------------------------------------------ */
export default function SortableLinkList(props: SortableLinkListProps) {
  const useUnified = isUsingUnifiedFormat(props);
  const initial = useUnified ? props.unifiedLinks ?? [] : convertToUnified(props.links ?? []);
  const [items, setItems] = useState<UnifiedLinkItem[]>(initial);

  /* 外部資料變動 */
  useEffect(() => {
    setItems(useUnified ? props.unifiedLinks ?? [] : convertToUnified(props.links ?? []));
  }, [props.links, props.unifiedLinks, useUnified]);

  /* 拖曳排序 */
  const moveLink = useCallback(
    (from: number, to: number) => {
      const clone = [...items];
      const [moved] = clone.splice(from, 1);
      clone.splice(to, 0, moved);
      const reordered = clone.map((it, idx) => ({ ...it, order: idx }));
      setItems(reordered);

      if (useUnified && props.onReorderUnifiedLinks) props.onReorderUnifiedLinks(reordered);
      if (!useUnified && props.onDragEnd) {
        const legacy: LinkItem[] = reordered.map((it) => ({
          id: it.id,
          url: it.url,
          type: it.type as LinkType,
          platform: it.type === 'social' ? it.platform : undefined,
          title: it.type === 'custom' ? it.title : undefined,
          order: it.order,
        }));
        props.onDragEnd(legacy);
      }
    },
    [items, useUnified, props],
  );

  /* 更新 / 刪除 */
  const handleUpdate = (id: string, upd: Partial<UnifiedLinkItem>) => {
    if (useUnified && props.onUpdateUnifiedLink) props.onUpdateUnifiedLink(id, upd);
    else if (!useUnified && props.onUpdateLink && upd.url) props.onUpdateLink(id, upd.url);
  };

  const handleRemove = (id: string) => {
    if (useUnified && props.onRemoveUnifiedLink) props.onRemoveUnifiedLink(id);
    else if (!useUnified && props.onRemoveLink) props.onRemoveLink(id);
  };

  /* JSX */
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">還沒有任何連結</p>
            <p className="text-xs mt-1">點擊上方的「Add Link」按鈕開始新增</p>
          </div>
        ) : (
          items.map((lk, idx) => (
            <DraggableUnifiedLink key={lk.id} link={lk} index={idx} moveLink={moveLink} onUpdateLink={handleUpdate} onRemoveLink={handleRemove} />
          ))
        )}
      </div>
    </DndProvider>
  );
}

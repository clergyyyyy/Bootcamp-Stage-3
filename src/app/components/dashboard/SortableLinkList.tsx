// components/SortableLinkList.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Trash2, GripVertical } from 'lucide-react';
import { LinkItem } from './LinkItem';

export type SortableLinkListProps = {
  links: LinkItem[];
  onUpdateLink: (id: string, newUrl: string) => void;
  onRemoveLink: (id: string) => void;
  onDragEnd: (newOrder: LinkItem[]) => void;
};

const ItemType = 'LINK';

function DraggableLink({ link, index, moveLink, onUpdateLink, onRemoveLink }: {
  link: LinkItem;
  index: number;
  moveLink: (from: number, to: number) => void;
  onUpdateLink: (id: string, newUrl: string) => void;
  onRemoveLink: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftUrl, setDraftUrl] = useState(link.url);
  const ref = useRef<HTMLDivElement>(null);

  const [, drag] = useDrag({
    type: ItemType,
    item: { index },
    canDrag: () => !editing,
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveLink(item.index, index);
        item.index = index;
      }
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className="flex items-center gap-2 border px-3 py-2 rounded bg-white shadow-sm"
    >
      <div className={`cursor-move ${editing ? 'opacity-30 pointer-events-none' : ''}`}>
        <GripVertical size={16} />
      </div>
      <span className="text-sm font-medium w-20">{link.platform}</span>
      {editing ? (
        <input
          value={draftUrl}
          onChange={(e) => setDraftUrl(e.target.value)}
          onBlur={() => {
            onUpdateLink(link.id, draftUrl);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onUpdateLink(link.id, draftUrl);
              setEditing(false);
            }
          }}
          className="flex-1 border px-2 py-1 text-sm rounded"
          autoFocus
        />
      ) : (
        <div
          className="flex-1 text-sm cursor-pointer hover:underline"
          onClick={() => {
            setEditing(true);
          }}
        >
          {link.url || '點此編輯'}
        </div>
      )}
      <button
        onClick={() => {
          if (confirm('確定要刪除這個連結嗎？')) {
            onRemoveLink(link.id);
          }
        }}
      >
        <Trash2 size={16} className="text-red-500 hover:text-red-700" />
      </button>
    </div>
  );
}

export default function SortableLinkList({ links, onUpdateLink, onRemoveLink, onDragEnd }: SortableLinkListProps) {
  const [items, setItems] = useState<LinkItem[]>(links);
    useEffect(() => {
    setItems(links);
  }, [links]);

  const moveLink = (from: number, to: number) => {
    const updated = [...items];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setItems(updated);
    onDragEnd(updated);
  };

  

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

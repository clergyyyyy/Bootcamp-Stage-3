'use client';

import { useState } from 'react';
import ImageUploader from './ImageUploader';
import { EditableText } from './EditableText';
import SortableLinkList from './SortableLinkList';
import AddPlatformCard from './AddPlatformCard';
import PreviewCard from './PreviewCard';
import type { LinkItem } from './LinkItem';
import type { Template } from '@/types/Template';
import { PencilLine, Eye } from 'lucide-react';

/**
 * 行動版 Dashboard，改成兩個分頁（編輯 / 預覽）
 * - Page 依賴父層傳入的資料與 setter；不自行抓取 Firestore。
 */
export default function MobileDashboard({
  avatarUrl,
  setAvatarUrl,
  bio,
  setBio,
  links,
  setLinks,
  siteID,
  template,
  loading,
}: {
  avatarUrl: string;
  setAvatarUrl: (url: string) => void;
  bio: string;
  setBio: (bio: string) => void;
  links: LinkItem[];
  setLinks: (links: LinkItem[]) => void;
  siteID: string;
  template: Template | null;
  loading: boolean;
}) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');

  /* -------- skeleton -------- */
  const Skeleton = ({ className }: { className?: string }) => (
    <div
      className={`rounded animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left ${className}`}
    />
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 內容區域 */}
      <div className="flex-1 overflow-auto p-4">
        {tab === 'edit' ? (
          loading ? (
            <div className="space-y-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-20" />
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <>
              {/* Avatar */}
              <section className="mb-6">
                <h2 className="text-sm text-center text-gray-400 font-semibold mb-2 bg-gray-100">頭貼</h2>
                <ImageUploader onUpload={setAvatarUrl} />
              </section>
              {/* Bio */}
              <section className="mb-6">
                <EditableText label="自我介紹" value={bio} onChange={setBio} />
              </section>
              {/* Links */}
              <section className="mb-6">
                <h2 className="text-sm text-center text-gray-400 font-semibold mb-2 bg-gray-100">我的連結</h2>
                <AddPlatformCard onAdd={(nl) => setLinks([...links, nl])} />
                <SortableLinkList
                  links={links}
                  onUpdateLink={(id, url) => setLinks(links.map((l) => (l.id === id ? { ...l, url } : l)))}
                  onRemoveLink={(id) => setLinks(links.filter((l) => l.id !== id))}
                  onDragEnd={(order) => setLinks(order)}
                />
              </section>
            </>
          )
        ) : loading ? (
          <div className="space-y-6 max-w-[600px] mx-auto">
            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <PreviewCard
            profile={{ avatarUrl, introduction: bio, links, siteID }}
            template={template ?? undefined}
          />
        )}
      </div>

      {/* Bottom Tab */}
      <nav className="flex h-20 border-t bg-gray-400">
        <button
          onClick={() => setTab('edit')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 text-sm ${
            tab === 'edit' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
        <PencilLine className="h-24 w-24" />
          編輯
        </button>
        <button
          onClick={() => setTab('preview')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 text-sm ${
            tab === 'preview' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
        <Eye className="h-24 w-24" />   
          預覽
        </button>
      </nav>
    </div>
  );
}

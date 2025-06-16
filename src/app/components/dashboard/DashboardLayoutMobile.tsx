'use client';

import { useState } from 'react';
import { EditableText } from './EditableText';
import SortableLinkList from './SortableLinkList';
import AddPlatformCard from './AddPlatformCard';
import PreviewCard from './PreviewCard';
import type { LinkItem } from '@/types/link';
import type { Template } from '@/types/Template';
import { PencilLine, Eye } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { uploadToImgbb } from '@/lib/uploadToImgbb';

/**
 * 行動版 Dashboard，改成兩個分頁（編輯 / 預覽）
 * - Page 依賴父層傳入的資料與 setter；不自行抓取 Firestore。
 */
export default function MobileDashboard({
  avatarUrl,
  setAvatarUrl,
  bioTitle, setBioTitle, 
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
  bioTitle: string;
  setBioTitle: (title: string) => void;
  bio: string;
  setBio: (bio: string) => void;
  links: LinkItem[];
  setLinks: (links: LinkItem[]) => void;
  siteID: string;
  template: Template | null;
  loading: boolean;
}) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');

  const handleAvatarSelect = async (file: File | null) => {
    if (!file) {
     setAvatarUrl('');
     return;
    }
    const url = await uploadToImgbb(file);
    setAvatarUrl(url);
  };

  
  const Skeleton = ({ className }: { className?: string }) => (
    <div
      className={`rounded animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left ${className}`}
    />
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {}
      <div className="flex-1 overflow-auto p-6">
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
              {}
              <section className="mb-6">
                <h2 className="text-sm text-center !text-gray-600 font-semibold mb-2 bg-gray-100">My Avatar</h2>
                <ImageUploader onSelect={handleAvatarSelect} initialUrl={avatarUrl} />
              </section>
              {}
              <section className="mb-6">
                <EditableText
                  label="Title"
                  value={bioTitle}
                  onChange={(v) => setBioTitle(v)}
                  fieldKey="bioTitle"
                  maxLength={30}
                  minRows={1}
                />
                <div className="mb-6"></div>

                <EditableText
                  label="Introduction"
                  value={bio}
                  onChange={(v) => setBio(v)}
                  fieldKey="bio"
                  maxLength={500}
                  minRows={4}
                />
              </section>
              {/* Links */}
              <section className="mb-6">
                <h2 className="text-sm text-center !text-gray-600 font-semibold mb-2 bg-gray-100">My Links</h2>
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
            profile={{
              avatarUrl,
              bioTitle,
              introduction: bio,
              links,
              siteID,
            }}
            template={template ?? undefined}
          />
        )}
      </div>

{/* Bottom Tab */}
<nav className="flex h-24 p-3">
  <button
    onClick={() => setTab('edit')}
    className={`flex-1 flex flex-col items-center justify-center gap-1 text-sm mx-1 rounded-xl shadow-sm transition-all duration-200 ${
      tab === 'edit' 
        ? '!text-blue-600 bg-blue-50 shadow-md' 
        : '!text-gray-600 bg-white hover:bg-gray-50'
    }`}
  >
    <PencilLine className="h-6 w-6" />
    Edit
  </button>
  <button
    onClick={() => setTab('preview')}
    className={`flex-1 flex flex-col items-center justify-center gap-1 text-sm mx-1 rounded-xl shadow-sm transition-all duration-200 ${
      tab === 'preview' 
        ? '!text-white bg-blue-500 shadow-md' 
        : '!text-gray-600 bg-white hover:bg-gray-50'
    }`}
  >
    <Eye className="h-6 w-6" />   
    Preview
  </button>
</nav>
</div>
  );
}

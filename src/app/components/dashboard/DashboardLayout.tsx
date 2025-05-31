'use client';

import ImageUploader from './ImageUploader';
import { EditableText } from './EditableText';
import SortableLinkList from './SortableLinkList';
import PreviewCard from './PreviewCard';
import { Template } from '@/types/Template';
import { LinkItem } from './LinkItem';
import { getAuth } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AddPlatformCard from './AddPlatformCard';

export default function DashboardLayout({
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
  const handleSave = async () => {
    const user = getAuth().currentUser;
    if (!user) return alert('未登入，無法儲存');

    const socialLinks = links.reduce<Record<string, string>>((a, l) => {
      a[l.platform] = l.url;
      return a;
    }, {});

    await updateDoc(doc(db, 'profiles', user.uid), {
      avatarUrl,
      bio,
      socialLinks,
      siteID,
      template: template ? template.templateEngName : undefined, // 若有樣板 id 可存
    });
    alert('✅ 已儲存成功！');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 側欄 */}
      <aside className="flex-shrink-0 w-[200px] bg-gray-100 p-4 border-r-2 border-gray-200">
        <div className="font-bold mb-4">My Fanlink</div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="flex justify-between items-center p-4 border-b-2 border-gray-200">
          <h1 className="text-xl font-bold m-0">My Site</h1>
          <button onClick={handleSave} className="bg-black text-white px-4 py-2 rounded">
            Save
          </button>
        </header>

        {/* 中間 + PreviewCard */}
        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row min-w-0">
          {/* 編輯 */}
                    {loading ? (
            <main className="flex-1 lg:flex-[3_3_0%] min-w-0 p-6 space-y-6">
              <div className="h-40 rounded skeleton animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left" />
              <div className="h-20 rounded skeleton animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left" />
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded skeleton animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left"
                />
              ))}
            </main>
          ) : (
          <main className="flex-1 lg:flex-[3_3_0%] min-w-0 p-6 overflow-auto">
            {/* avatar */}
            <section className="mb-6">
              <h2 className="text-sm text-center !text-gray-500 font-semibold mb-2 bg-gray-100">頭貼</h2>
              <ImageUploader onUpload={setAvatarUrl} />
            </section>
            {/* bio */}
            <section className="mb-6">
              <EditableText label="自我介紹" value={bio} onChange={setBio} />
            </section>
            {/* links */}
            <section className="mb-6">
              <h2 className="text-sm text-center !text-gray-500 font-semibold mb-2 bg-gray-100">我的連結</h2>
              <AddPlatformCard onAdd={(nl) => setLinks([...links, nl])} />
              <SortableLinkList
                links={links}
                onUpdateLink={(id, url) => setLinks(links.map((l) => (l.id === id ? { ...l, url } : l)))}
                onRemoveLink={(id) => setLinks(links.filter((l) => l.id !== id))}
                onDragEnd={(order) => setLinks(order)}
              />
            </section>
          </main>)}

          {/* PreviewCard */}
          {loading ? (
            <aside className="flex-[2_2_0%] min-w-[360px] max-w-[600px] bg-gray-100 p-4 border-l-2 border-gray-200 min-h-0">
              <div className="mx-auto max-w-[600px] space-y-6">
         <div className="h-24 w-24 rounded-full skeleton animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left mx-auto" />
                <div className="h-6 w-1/2 rounded skeleton animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left mx-auto" />
                <div className="h-4 w-3/4 rounded skeleton animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left mx-auto" />
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 rounded skeleton animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left"
                  />
                ))}
              </div>
            </aside>
          ) : (
          <aside className="flex-[2_2_0%] min-w-[360px] max-w-[600px] bg-gray-100 p-4 border-l-2 border-gray-200 min-h-0">
            <PreviewCard
              profile={{ avatarUrl, introduction: bio, links, siteID }}
              template={template ?? undefined}
            />
          </aside>)}
        </div>
      </div>
    </div>
  );
}

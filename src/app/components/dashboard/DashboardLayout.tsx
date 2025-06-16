'use client';

import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { ChevronDown } from 'lucide-react';

import ImageUploader from './ImageUploader';
import { EditableText } from './EditableText';
import SortableLinkList from './SortableLinkList';
import PreviewCard from './PreviewCard';
import { Template } from '@/types/Template';
import { LinkItem } from '@/types/link';
import { getAuth } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AddPlatformCard from './AddPlatformCard';
import { uploadToImgbb } from '@/lib/uploadToImgbb';
import { Profile } from '@/types/profile';

export default function DashboardLayout({
  avatarUrl,
  setAvatarUrl,
  bioTitle, 
  setBioTitle, 
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
  setBioTitle: (v: string) => void;
  bio: string;
  setBio: (bio: string) => void;
  links: LinkItem[];
  setLinks: (links: LinkItem[]) => void;
  siteID: string;
  template: Template | null;
  loading: boolean;
}) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSave = async () => {
    const user = getAuth().currentUser;
    if (!user) return alert('未登入，無法儲存');

    let url = avatarUrl;
    if (pendingFile) {
      url = await uploadToImgbb(pendingFile);
      setAvatarUrl(url);
      setPendingFile(null);
    } else {
    }

    const updateData: Partial<Profile> & { avatarUrl: string; links: LinkItem[]; template?: string } = {
      bioTitle, 
      introduction: bio,
      siteID,
      avatarUrl: url,
      links,
      ...(template?.templateEngName ? { template: template.templateEngName.toLowerCase() } : {}),
    };

    try {
      await updateDoc(doc(db, 'profiles', user.uid), updateData);
      alert('✅ 已儲存成功！');
    } catch {
      alert('❌ 儲存失敗，請稍後再試');
    }
  };

  /** 既存 onSelect 傳進來的 callback */
  const handleSelectFile = (file: File | null) => {
    if (!file) return;
    // 1. 暫存檔案（之後 Save 時上傳到 imgbb）
    setPendingFile(file);
    // 2. 產生本地 blob URL，立即給 PreviewCard
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl);
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      setShowDropdown(false);
      setIsAnimating(false);
    } catch {
      alert('登出失敗，請稍後再試');
    }
  };

  const toggleDropdown = () => {
    if (showDropdown) {
      setIsAnimating(true);
      setTimeout(() => {
        setShowDropdown(false);
        setIsAnimating(false);
      }, 150); 
    } else {
      setShowDropdown(true);
    }
  };

  const handleAddLink = (newLink: LinkItem) => {
    setLinks([...links, newLink]);
  };

  const handleUpdateLink = (id: string, url: string) => {
    setLinks(links.map((l) => (l.id === id ? { ...l, url } : l)));
  };

  const handleRemoveLink = (id: string) => {
    setLinks(links.filter((l) => l.id !== id));
  };

  const handleDragEnd = (newOrder: LinkItem[]) => {
    setLinks(newOrder);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {}
      <aside className="flex-shrink-0 w-[200px] bg-gray-100 p-4 border-r-2 border-gray-200">
        <div className="flex justify-between items-center mb-4 relative">
          <div className="font-bold">My Fanlink</div>
          <button 
            onClick={toggleDropdown}
            className="p-1 !text-gray-700 hover:text-gray-900 cursor-pointer transition-colors"
          >
            <ChevronDown size={18} />
          </button>
          
          {}
          {showDropdown && (
            <div 
              className={`absolute top-full right-0 mt-2 w-32 bg-white !text-gray-700 rounded-lg shadow-lg border border-gray-200 z-50 transition-all duration-100 ${
                isAnimating 
                  ? 'opacity-0 scale-95 translate-y-[-8px]' 
                  : 'opacity-100 scale-100 translate-y-0'
              }`}
            >
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm !text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {}
        <header className="flex justify-between items-center p-4 border-b-2 border-gray-200">
          <h1 className="text-xl font-bold m-0">My Site</h1>
          <button onClick={handleSave} className="bg-black text-white px-4 py-2 rounded">
            Save
          </button>
        </header>

        {}
        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row min-w-0">
          {}
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
              {}
              <section className="mb-6">
                <h2 className="text-sm text-center !text-gray-500 font-semibold mb-2 bg-gray-100">My Avatar</h2>
                <ImageUploader
                  onSelect={handleSelectFile}
                  initialUrl={avatarUrl}
                />
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
              <div className="mb-2"></div>
                <EditableText
                  label="Introduction"
                  value={bio}
                  onChange={(v) => setBio(v)}
                  fieldKey="bio"
                  maxLength={500}
                  minRows={4}
                />
              </section>
              
              {}
              <section className="mb-6">
                <h2 className="text-sm text-center !text-gray-500 font-semibold mb-2 bg-gray-100">My Links</h2>
                
                <AddPlatformCard onAdd={handleAddLink} />
                
                <SortableLinkList
                  links={links}
                  onUpdateLink={handleUpdateLink}
                  onRemoveLink={handleRemoveLink}
                  onDragEnd={handleDragEnd}
                />
              </section>
            </main>
          )}

          {}
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
            <aside className="flex-[2_2_0%] min-w-[360px] max-w-[600px] bg-gray-100 border-l-2 border-gray-200 min-h-0 overflow-y-auto">
              <PreviewCard
                profile={{
                  avatarUrl,
                  bioTitle,
                  introduction: bio,
                  links,
                  siteID,
                }}
                template={template || undefined}
              />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
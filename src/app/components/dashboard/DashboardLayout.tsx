'use client';

import { useState, useRef } from 'react';
import { signOut, getAuth } from 'firebase/auth';
import { ChevronDown, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { doc, updateDoc } from 'firebase/firestore';

import ImageUploader from './ImageUploader';
import { EditableText } from './EditableText';
import SortableLinkList from './SortableLinkList';
import PreviewCard from './PreviewCard';
import AddPlatformCard from './AddPlatformCard';
import { uploadToImgbb } from '@/lib/uploadToImgbb';
import { db } from '@/lib/firebase';
import { Template } from '@/types/Template';
import type { UnifiedLinkItem, ObjektNFT } from '@/types/unified-link';
import ClaimNavBar from './ClaimNavBar';

/* ------------------------------------------------------------------
 * type helpers
 * ------------------------------------------------------------------ */

// 具有基礎 id / order 欄位的交集型別
interface BaseMappedLink {
  id: string;
  order: number;
}

type TextLink   = UnifiedLinkItem & { type: 'text';   content?: string };
type ObjektLink = UnifiedLinkItem & { type: 'objekt'; objekts?: ObjektNFT[] };
type OtherLink  = UnifiedLinkItem & {
  type: Exclude<UnifiedLinkItem['type'], 'text' | 'objekt'>;
  platform?: string;
  url?: string;
};

type AnyLink = TextLink | ObjektLink | OtherLink;

/* ------------------------------------------------------------------
 * util: deep‑clean undefined / null (保留 Array 原樣)
 * ------------------------------------------------------------------ */

const cleanObject = <T extends Record<string, unknown>>(obj: T): T => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      out[k] = v;
    } else if (typeof v === 'object') {
      const nested = cleanObject(v as Record<string, unknown>);
      if (Object.keys(nested).length) out[k] = nested;
    } else {
      out[k] = v;
    }
  }
  return out as T;
};

const generateUid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const dedupeIds = (items: UnifiedLinkItem[]): UnifiedLinkItem[] => {
  const seen = new Set<string>();
  return items.map((l, idx) => {
    const id = !l.id || seen.has(l.id) ? generateUid(l.type) : l.id;
    seen.add(id);
    return { ...l, id, order: idx };
  });
};

/* ------------------------------------------------------------------
 * component
 * ------------------------------------------------------------------ */

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
  setBio: (v: string) => void;
  links: UnifiedLinkItem[];
  setLinks: (l: UnifiedLinkItem[]) => void;
  siteID: string;
  template: Template | null;
  loading: boolean;
}) {
  /* ------------------------- local states ------------------------ */
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownAnimating, setDropdownAnimating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  /* ------------------------- export image ------------------------ */
  const handleExportImage = async () => {
    if (!previewRef.current) return alert('找不到預覽區域');

    setIsExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const canvas = await html2canvas(previewRef.current, {
        useCORS: true,
        allowTaint: true,
      });
      canvas.toBlob((blob) => {
        if (!blob) return alert('圖片生成失敗');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${siteID || 'fanlink'}-preview.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png', 0.95);
    } catch (e) {
      console.error(e);
      alert('匯出失敗');
    } finally {
      setIsExporting(false);
    }
  };

  /* ------------------------- save ------------------------ */
  const handleSave = async () => {
    const user = getAuth().currentUser;
    if (!user) return alert('未登入');

    try {
      let finalAvatar = avatarUrl;
      if (pendingFile) {
        finalAvatar = await uploadToImgbb(pendingFile);
        setAvatarUrl(finalAvatar);
        setPendingFile(null);
      }

      const validated: UnifiedLinkItem[] = links.map((l, i) => {
        const base: BaseMappedLink = { id: l.id || `link-${i}`, order: i };

        switch (l.type) {
          case 'text': {
            const t = l as TextLink;
            return cleanObject({ ...base, ...t, content: t.content ?? '' });
          }
          case 'objekt': {
            const o = l as ObjektLink;
            return cleanObject({ ...base, ...o, objekts: o.objekts ?? [] });
          }
          default: {
            const n = l as OtherLink;
            return cleanObject({
              ...base,
              ...n,
              platform: n.platform ?? '',
              url: n.url ?? '',
            });
          }
        }
      });

      const payload = cleanObject({
        bioTitle: bioTitle || '',
        introduction: bio || '',
        siteID: siteID || '',
        avatarUrl: finalAvatar,
        links: validated,
        template: template?.templateEngName?.toLowerCase() || 'default',
        updatedAt: new Date().toISOString(),
      });

      await updateDoc(doc(db, 'profiles', user.uid), payload);
      alert('✅ 已儲存成功');
    } catch (e) {
      console.error(e);
      alert(`儲存失敗: ${(e as Error).message}`);
    }
  };

  /* ------------------------- link ops ------------------------ */
  const handleSelectFile = (f: File | null) => {
    if (!f) return;
    setPendingFile(f);
    setAvatarUrl(URL.createObjectURL(f));
  };

  const handleAddLink = (l: UnifiedLinkItem) => {
    const newLink = cleanObject({
      ...l,
      id: l.id || generateUid(l.type),
      order: links.length,
    });
    setLinks([...links, newLink]);
  };

  const handleUpdateUnifiedLink = (id: string, upd: Partial<UnifiedLinkItem>) => {
    setLinks(
      links.map((origin) => {
        if (origin.id !== id) return origin;
        const merged = { ...origin, ...upd } as AnyLink;

        if (merged.type === 'text')
          return cleanObject({ ...merged, content: merged.content ?? '' });
        if (merged.type === 'objekt')
          return cleanObject({ ...merged, objekts: merged.objekts ?? [] });
        return cleanObject({
          ...merged,
          platform: merged.platform ?? '',
          url: merged.url ?? '',
        });
      })
    );
  };

  const handleRemoveLink = (id: string) => setLinks(links.filter((l) => l.id !== id));

  const handleReorderUnifiedLinks = (order: UnifiedLinkItem[]) =>
    setLinks(dedupeIds(order));

  /* ------------------------- ui helpers ------------------------ */
  const logout = async () => {
    try {
      await signOut(getAuth());
      setShowDropdown(false);
      setDropdownAnimating(false);
    } catch {
      alert('登出失敗');
    }
  };

  /* ------------------------- dropdown animation ------------------------ */
  const toggleDropdown = () => {
    if (showDropdown) {
      setDropdownAnimating(true);
      setTimeout(() => {
        setShowDropdown(false);
        setDropdownAnimating(false);
      }, 140);
    } else {
      setShowDropdown(true);
    }
  };

  /* ------------------------- JSX ------------------------ */
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[200px] flex-shrink-0 border-r-2 border-gray-200 bg-gray-100 p-4">
        <div className="relative mb-4 flex items-center justify-between">
          <div className="font-bold">My Fanlink</div>
          <button
            onClick={toggleDropdown}
            className="cursor-pointer p-1 text-gray-700 transition-colors hover:text-gray-900"
          >
            <ChevronDown size={18} />
          </button>
          {showDropdown && (
            <div
              className={`absolute right-0 top-full z-50 mt-2 w-32 rounded-lg border border-gray-200 bg-white text-gray-700 shadow-lg transition-all duration-100 ${dropdownAnimating ? 'translate-y-[-8px] scale-95 opacity-0' : 'translate-y-0 scale-100 opacity-100'}`}
            >
              <button onClick={logout} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">
                Log out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b-2 border-gray-200 p-4">
          <h1 className="m-0 text-xl font-bold">My Site</h1>
          <div className="flex gap-2">
            <button
              onClick={handleExportImage}
              disabled={isExporting || loading}
              className={`flex items-center gap-2 rounded px-4 py-2 transition-all duration-200 ${isExporting || loading ? 'cursor-not-allowed bg-gray-300 text-gray-500' : 'bg-blue-600 text-white hover:scale-105 hover:bg-blue-700'}`}
            >
              {isExporting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Export as Image</span>
                </>
              )}
            </button>
            <button onClick={handleSave} className="rounded bg-black px-4 py-2 text-white transition-colors duration-200 hover:bg-gray-800">
              Save
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Edit panel */}
          {/* Edit panel */}
          {loading ? (
            <main className="flex-1 lg:flex-[3_3_0%] min-w-0 p-6 space-y-6">
              <div className="h-40 rounded skeleton animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left" />
              <div className="h-20 rounded skeleton animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 rounded skeleton animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left" />
              ))}
            </main>
          ) : (
            <main className="flex-1 lg:flex-[3_3_0%] min-w-0 p-6 overflow-auto">
            {siteID && (
            <ClaimNavBar siteID={siteID} className="max-w-100% mb-4" />
          )}
              {/* Avatar */}
              <section className="mb-6">
                <h2 className="mb-2 bg-gray-100 text-center text-sm font-semibold !text-gray-500">My Avatar</h2>
                <ImageUploader onSelect={handleSelectFile} initialUrl={avatarUrl} />
              </section>

              {/* Bio */}
              <section className="mb-6">
                <EditableText
                  label="Title"
                  value={bioTitle}
                  onChange={setBioTitle}
                  fieldKey="bioTitle"
                  maxLength={30}
                  minRows={1}
                />
                <div className="mb-2" />
                <EditableText
                  label="Introduction"
                  value={bio}
                  onChange={setBio}
                  fieldKey="bio"
                  maxLength={500}
                  minRows={4}
                />
              </section>

              {/* Links */}
              <section className="mb-6">
                <h2 className="mb-2 bg-gray-100 text-center text-sm font-semibold !text-gray-500">My Links</h2>
                <AddPlatformCard onAdd={handleAddLink} />
                <SortableLinkList
                  unifiedLinks={links}
                  onUpdateUnifiedLink={handleUpdateUnifiedLink}
                  onRemoveUnifiedLink={handleRemoveLink}
                  onReorderUnifiedLinks={handleReorderUnifiedLinks}
                />
              </section>
            </main>
          )}

          <aside className="flex-[2_2_0%] min-w-[360px] max-w-[600px] overflow-y-auto border-l-2 border-gray-200 bg-gray-100 lg:block">
            <div ref={previewRef}>
              <PreviewCard
                profile={{
                  avatarUrl: avatarUrl || '',
                  bioTitle: bioTitle || '',
                  introduction: bio || '',
                  links,
                  siteID: siteID || '',
                }}
                template={template || undefined}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

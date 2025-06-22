'use client';

import { useState, useEffect, useRef } from 'react';
import { signOut, getAuth } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ChevronDown, Download, Save, PencilLine, Eye } from 'lucide-react';
import html2canvas from 'html2canvas';

import { EditableText } from './EditableText';
import SortableLinkList from './SortableLinkList';
import AddPlatformCard from './AddPlatformCard';
import PreviewCard from './PreviewCard';
import ImageUploader from './ImageUploader';
import { uploadToImgbb } from '@/lib/uploadToImgbb';
import { db } from '@/lib/firebase';
import type { Template } from '@/types/Template';
import type { UnifiedLinkItem, ObjektNFT } from '@/types/unified-link';
import ClaimNavBar from './ClaimNavBar';

/* ------------------------------------------------------------------
 * type helpers
 * ------------------------------------------------------------------ */
interface BaseMappedLink { id: string; order: number }

type TextLink   = UnifiedLinkItem & { type: 'text';   content?: string };
type ObjektLink = UnifiedLinkItem & { type: 'objekt'; objekts?: ObjektNFT[] };
// 其餘 link 類型（social / youtube / spotify / custom ...）
type OtherLink  = UnifiedLinkItem & {
  type: Exclude<UnifiedLinkItem['type'], 'text' | 'objekt'>;
  platform?: string;
  url?: string;
};

type AnyLink = TextLink | ObjektLink | OtherLink;

/* ------------------------------------------------------------------
 * utils
 * ------------------------------------------------------------------ */
const cleanObject = <T extends Record<string, unknown>>(o: T): T => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
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

const generateUid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
export default function MobileDashboard({
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
  setBioTitle: (t: string) => void;
  bio: string;
  setBio: (t: string) => void;
  links: UnifiedLinkItem[];
  setLinks: (l: UnifiedLinkItem[]) => void;
  siteID: string;
  template: Template | null;
  loading: boolean;
}) {
  /* ------------------------- local states ------------------------ */
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showHeader, setShowHeader] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownAnimating, setDropdownAnimating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  /* ------------------------- scroll header ----------------------- */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setShowHeader(el.scrollTop < 50);
    el.addEventListener('scroll', onScroll);
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  /* ------------------------- avatar select ----------------------- */
  const handleAvatarSelect = (file: File | null) => {
    if (!file) {
      setAvatarUrl('');
      setPendingFile(null);
      return;
    }
    setPendingFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  };

  /* ------------------------- dropdown ---------------------------- */
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

  const logout = async () => {
    try {
      await signOut(getAuth());
      setShowDropdown(false);
    } catch {
      alert('登出失敗');
    }
  };

  /* ------------------------- export ------------------------------ */
  const handleExportImage = async () => {
    if (!previewRef.current || tab !== 'preview') return alert('請先切到預覽');
    setIsExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const canvas = await html2canvas(previewRef.current, { useCORS: true, allowTaint: true });
      canvas.toBlob((blob) => {
        if (!blob) return alert('匯出失敗');
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

  /* ------------------------- save ------------------------------ */
  const handleSave = async () => {
    const user = getAuth().currentUser;
    if (!user) return alert('未登入');
    setIsSaving(true);
    try {
      let finalAvatar = avatarUrl;
      if (pendingFile) {
        finalAvatar = await uploadToImgbb(pendingFile);
        setAvatarUrl(finalAvatar);
        setPendingFile(null);
      }

      const validated: UnifiedLinkItem[] = links.map((l, i) => {
        const base: BaseMappedLink = { id: l.id || generateUid(l.type), order: i };
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
    } finally {
      setIsSaving(false);
    }
  };

  /* ------------------------- link ops --------------------------- */
  const handleAddLink = (l: UnifiedLinkItem) => {
    const newLink = cleanObject({ ...l, id: l.id || generateUid(l.type), order: links.length });
    setLinks([...links, newLink]);
  };

  const handleUpdateUnifiedLink = (id: string, upd: Partial<UnifiedLinkItem>) => {
    setLinks(
      links.map((origin) => {
        if (origin.id !== id) return origin;
        const merged = { ...origin, ...upd } as AnyLink;
        if (merged.type === 'text') return cleanObject({ ...merged, content: merged.content ?? '' });
        if (merged.type === 'objekt') return cleanObject({ ...merged, objekts: merged.objekts ?? [] });
        return cleanObject({ ...merged, platform: merged.platform ?? '', url: merged.url ?? '' });
      })
    );
  };

  const handleRemoveUnifiedLink = (id: string) => setLinks(links.filter((l) => l.id !== id));
  const handleReorderUnifiedLinks = (order: UnifiedLinkItem[]) => setLinks(dedupeIds(order));

  /* ------------------------- skeleton --------------------------- */
  const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse rounded bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left ${className}`} />
  );

  /* ------------------------- JSX ------------------------ */
  return (
    <div className="relative flex h-full flex-col min-h-0">
      {/* sticky header */}
      <header className={`fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white px-4 py-3 transition-transform duration-300 ease-out ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800">My Fanlink</span>
            <div className="relative">
              <button onClick={toggleDropdown} className="cursor-pointer p-1 text-gray-700 transition-colors hover:text-gray-900">
                <ChevronDown size={18} />
              </button>
              {showDropdown && (
                <div className={`absolute left-0 top-full z-50 mt-2 w-32 rounded-lg border border-gray-200 bg-white text-gray-700 shadow-lg transition-all duration-100 ${dropdownAnimating ? 'translate-y-[-8px] scale-95 opacity-0' : 'translate-y-0 scale-100 opacity-100'}`}>
                  <button onClick={logout} className="w-full rounded-lg px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50">Log out</button>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportImage} disabled={isExporting || tab !== 'preview'} className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${tab === 'preview' && !isExporting ? 'bg-blue-600 text-white hover:bg-blue-700' : 'cursor-not-allowed bg-gray-300 text-gray-500'}`}>
              {isExporting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Export...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Export</span>
                </>
              )}
            </button>
            <button onClick={handleSave} disabled={isSaving} className={`flex items-center gap-1 rounded-lg bg-black px-3 py-2 text-sm text-white transition-all duration-200 ${isSaving ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-800'}`}>
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      {/* content */}
      <div ref={scrollRef} className="flex-1 overflow-auto" style={{ paddingTop: showHeader ? '64px' : 0 }}>
        <div className="p-6">
          {tab === 'edit' ? (
            loading ? (
              <div className="space-y-6">
                <Skeleton className="h-40" />
                <Skeleton className="h-20" />
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : (
              <>
                {/* avatar */}
                <section className="mb-6">
                  <h2 className="mb-2 rounded bg-gray-100 py-2 text-center text-sm font-semibold !text-gray-600">My Avatar</h2>
                  <ImageUploader onSelect={handleAvatarSelect} initialUrl={avatarUrl} />
                </section>

                {/* bio */}
                <section className="mb-6">
                  <EditableText label="Title" value={bioTitle} onChange={setBioTitle} fieldKey="bioTitle" maxLength={30} minRows={1} />
                  <div className="mb-6"></div>
                  <EditableText label="Introduction" value={bio} onChange={setBio} fieldKey="bio" maxLength={500} minRows={4} />
                </section>

                {/* links */}
                <section className="mb-6">
                  <h2 className="mb-2 rounded bg-gray-100 py-2 text-center text-sm font-semibold !text-gray-600">My Links</h2>
                  <AddPlatformCard onAdd={handleAddLink} />
                  <SortableLinkList unifiedLinks={links} onUpdateUnifiedLink={handleUpdateUnifiedLink} onRemoveUnifiedLink={handleRemoveUnifiedLink} onReorderUnifiedLinks={handleReorderUnifiedLinks} />
                </section>
              </>
            )
          ) : loading ? (
            <div className="mx-auto max-w-[600px] space-y-6">
              <Skeleton className="mx-auto h-24 w-24 rounded-full" />
              <Skeleton className="mx-auto h-6 w-1/2" />
              <Skeleton className="mx-auto h-4 w-3/4" />
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : (
            <div ref={previewRef}>
                        {siteID && (
            <ClaimNavBar siteID={siteID} className="max-w-100% mb-4" />
          )}
              <PreviewCard profile={{ avatarUrl: avatarUrl || '', bioTitle: bioTitle || '', introduction: bio || '', links, siteID: siteID || '' }} template={template ?? undefined} />
            </div>
          )}
        </div>
      </div>

      {/* bottom tab */}
      <nav className="flex h-25 border-t border-gray-200 bg-white p-3">
        <button onClick={() => setTab('edit')} className={`mx-1 flex flex-1 flex-col items-center justify-center gap-1 rounded-xl shadow-sm transition-all duration-200 ${tab === 'edit' ? 'bg-blue-50 !text-blue-600 shadow-md' : 'bg-white !text-gray-600 hover:bg-gray-50'}`}>
          <PencilLine className="h-15 w-15" />
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
          <Eye className="h-15 w-15" />   
          Preview
        </button>
      </nav>
    </div>
  );
}
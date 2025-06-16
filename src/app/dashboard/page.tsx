// dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import MobileDashboard  from '../components/dashboard/DashboardLayoutMobile';
import { LinkItem, LinkType } from '@/types/link';
import type { Profile } from '@/types/profile';

import type { Template } from '@/types/Template';

type RawLinkItem = {
  id?: string;
  url: string;
  platform?: string;
  type?: string;
};

const ALLOWED = ['youtube','spotify','social','custom'] as const;
const autoDetectType = (url: string): LinkType =>
  /youtu\.?be/.test(url)   ? 'youtube'
: /spotify\.com/.test(url) ? 'spotify'
:                            'social';
const normalizeType = (raw: unknown, url: string): LinkType =>
  typeof raw === 'string' && (ALLOWED as readonly string[]).includes(raw.toLowerCase())
    ? (raw.toLowerCase() as LinkType)
    : autoDetectType(url);
const normalizeKey = (plat = '', url = '') =>
  `${plat.trim().toLowerCase()}|${url.trim()}`;

const buildLinkItems = (
  rawLinks: RawLinkItem[] = [],
  socials: Record<string, string> = {},
): LinkItem[] => {
  const list: LinkItem[] = [];
  const seen = new Set<string>();

  rawLinks.forEach((l, idx) => {
    if (!l?.url) return;
    const key = normalizeKey(l.platform, l.url);
    if (seen.has(key)) return;
    list.push({
      id: l.id || `link-${idx}`,
      type: normalizeType(l.type, l.url),
      platform: l.platform || '',
      url: l.url,
    });
    seen.add(key);
  });

  Object.entries(socials).forEach(([plat, url]) => {
    if (!url) return;
    const key = normalizeKey(plat, url);
    if (seen.has(key)) return;
    list.push({
      id: `social-${plat}`,
      type: 'social',
      platform: plat,
      url,
    });
    seen.add(key);
  });

  return list;
};

/* ---------------------------------------------------------- */

export default function DashboardPage() {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bioTitle,  setBioTitle]  = useState('');           // ★ 新增
  const [bio,       setBio]       = useState('');
  const [links,     setLinks]     = useState<LinkItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [siteID,    setSiteID]    = useState('');
  const [template,  setTemplate]  = useState<Template | null>(null);

  useEffect(() => {
    const un = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace('/'); return; }

      const snap = await getDoc(doc(db, 'profiles', user.uid));
      if (!snap.exists()) { setLoading(false); return; }

      const raw = snap.data();
      const data: Profile = {
        avatarUrl: raw.avatarUrl || '',              // ✅ 修正：不是 raw.url
        bioTitle: raw.bioTitle || '',
        introduction: raw.bio || '',                 // ✅ bio → introduction 映射
        links: raw.links || [],
        siteID: raw.siteID || '',
        templateKey: raw.template || '',          // ✅ 若後續還有讀 template 建議加這行
        socialLinks: raw.socialLinks || {},          // ✅ 若有社群連結記得加上
      };

      setAvatarUrl(data.avatarUrl);
      setBioTitle(data.bioTitle);
      setBio(data.introduction);
      setSiteID(data.siteID);

      /* ★ 合併 links + socialLinks，帶入 type */
      const merged = buildLinkItems(data.links, data.socialLinks || {});
      setLinks(merged);

      /* 讀 template */
      if (data.templateKey) {
        const tplSnap = await getDoc(doc(db, 'templates', data.templateKey));
        if (tplSnap.exists()) setTemplate(tplSnap.data() as Template);
      }
      setLoading(false);
    });
    return un;
  }, [router]);

  return (
    <>
      <div className="hidden lg:block h-screen">
        <DashboardLayout
          avatarUrl={avatarUrl}   setAvatarUrl={setAvatarUrl}
          bioTitle={bioTitle}     setBioTitle={setBioTitle}
          bio={bio}               setBio={setBio}
          links={links}           setLinks={setLinks}
          siteID={siteID}
          template={template}
          loading={loading}
        />
      </div>
      <div className="block lg:hidden h-screen">
        <MobileDashboard
          avatarUrl={avatarUrl}   setAvatarUrl={setAvatarUrl}
          bioTitle={bioTitle}     setBioTitle={setBioTitle}
          bio={bio}               setBio={setBio}
          links={links}           setLinks={setLinks}
          siteID={siteID}
          template={template}
          loading={loading}
        />
      </div>
    </>
  );
}

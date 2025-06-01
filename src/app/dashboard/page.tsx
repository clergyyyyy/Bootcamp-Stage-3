'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import MobileDashboard  from '../components/dashboard/DashboardLayoutMobile';  // 新增的行動版
import { LinkItem } from '../components/dashboard/LinkItem';
import type { Template } from '@/types/Template';

export default function DashboardPage() {
  const router = useRouter();

  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio]             = useState('');
  const [links, setLinks]         = useState<LinkItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [siteID, setSiteID] = useState('');
  const [template, setTemplate] = useState<Template | null>(null);

  

  /* 讀取 Firestore */
  useEffect(() => {
    const un = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/');
        return;
      }

      const snap = await getDoc(doc(db, 'profiles', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setAvatarUrl(data.avatarUrl || '');
        setBio(data.bio || '');

        if (data?.socialLinks) {
          const raw = data.socialLinks as Record<string, string>;
          const mapped = Object.entries(raw)
            .filter(([, url]) => typeof url === 'string' && url.trim())
            .map(([platform, url]) => ({
              id: platform,
              platform,
              url,
            }));
          setLinks(mapped);
        }
        if (data?.siteID) {
      setSiteID(data.siteID);
      }
      if (data?.template) {
    // 多加這段
    const tplSnap = await getDoc(doc(db, 'templates', data.template));
    if (tplSnap.exists()) setTemplate(tplSnap.data() as Template);
  }  
      }
      setLoading(false);
    });
    return un;
  }, [router]);

return (
  <>
    {/* --- Desktop ≥1032px (lg) ------------------------------------------------ */}
    <div className="hidden lg:block h-screen">
      <DashboardLayout
        avatarUrl={avatarUrl}   setAvatarUrl={setAvatarUrl}
        bio={bio}               setBio={setBio}
        links={links}           setLinks={setLinks}
        siteID={siteID}
        template={template}
        loading={loading}
      />
    </div>

    {/* --- Mobile ＜1032px ----------------------------------------------------- */}
    <div className="block lg:hidden h-screen">
      <MobileDashboard
        avatarUrl={avatarUrl}   setAvatarUrl={setAvatarUrl}
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
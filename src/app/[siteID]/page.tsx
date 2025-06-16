'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, query, where, limit, getDocs,
  doc, getDoc,
} from 'firebase/firestore';
import TemplateLayout, { ProfileData } from '../components/TemplateLayout';
import { Template } from '@/types/Template';
import { buildLinkItems } from '@/utils/linkBuilder';

/* ---------- page component --------------------------------------- */
export default function PublicProfilePage() {
  const { siteID } = useParams<{ siteID: string }>();
  const [profile,  setProfile]  = useState<ProfileData | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!siteID) return;

    (async () => {
      try {
        /* profile -------------------------------------------------- */
        const q = query(
          collection(db, 'profiles'),
          where('siteID', '==', siteID),
          limit(1),
        );
        const snap = await getDocs(q);
        if (snap.empty) return setLoading(false);

        const raw = snap.docs[0].data();
        const { links, remainingSocials } = buildLinkItems(raw.links, raw.socialLinks);

        const profileData: ProfileData = {
          siteID: raw.siteID,
          avatarUrl: raw.avatarUrl,
          bioTitle: raw.bioTitle,
          bio: raw.bio,
          introduction: raw.bio,
          socialLinks: remainingSocials,   // **已去掉重複**
          links,                           // button/iframe 區塊
        };
        setProfile(profileData);

        /* template ------------------------------------------------- */
        const tplSnap = await getDoc(doc(db, 'templates', raw.template || 'default'));
        setTemplate(
          tplSnap.exists() ? (tplSnap.data() as Template) : {
            name: 'default',
            templateEngName: 'default',
            color: {
              fontPrimary: '#000',
              fontSecondary: '#666',
              buttonPrimary: '#3B82F6',
              buttonSecondary: '#60A5FA',
            },
            border: { radius: 8, style: 'solid' },
          },
        );
      } catch (err) {
        console.error('❌ 載入 profile 發生錯誤:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [siteID]);

  /* ---------- Skeleton ---------- */
  if (loading) {
    return (
      <div className="flex h-full w-full flex-1 flex-col justify-between px-4 pb-8 pt-16 sm:pb-16 backdrop-blur-md">
        <div className="mx-auto h-full w-full max-w-[600px]">
          <div className="flex flex-col items-center">
            <div className="mb-4 h-24 w-24 rounded-full skeleton animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left" />
            <div className="mx-3 mt-1 h-6 w-1/2 rounded skeleton animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-left" />
            <div className="mt-2 h-4 w-3/4 rounded skeleton animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-left" />
            <div className="mt-1 h-4 w-1/2 rounded skeleton animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-left" />
          </div>
          <div className="mt-6 flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-3 w-full max-w-[600px] mx-auto rounded animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left"
              >
                <div className="h-5 w-5 rounded bg-gray-400" />
                <div className="h-4 w-24 rounded bg-gray-400" />
              </div>
            ))}
          </div>
        </div>
        <footer className="mt-8 flex justify-center text-xs text-gray-400">© 2025 FanLink</footer>
      </div>
    );
  }

  /* ---------- 狀態檢查 ---------- */
  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="p-6 text-red-500">找不到此個人站</p>
      </div>
    );
  }
  
  if (!template) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="p-6 text-red-500">找不到樣板資料</p>
      </div>
    );
  }

  /* ---------- 成功渲染 ---------- */
  return (
    <main className="w-full mx-auto">
      <TemplateLayout profile={profile} template={template} />
    </main>
  );
}
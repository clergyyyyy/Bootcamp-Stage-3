'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import TemplateLayout, { ProfileData } from '../components/TemplateLayout';
import { Template } from '@/types/Template';
import { templates } from '@/lib/template';

export default function CompleteContent() {
  const uid = useSearchParams().get('uid');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    (async () => {
      const snap = await getDoc(doc(db, 'profiles', uid));
      if (!snap.exists()) return setLoading(false);

      const raw = snap.data();
      setProfile({
        siteID: raw.siteID,
        avatarUrl: raw.avatarUrl,
        bioTitle: raw.bioTitle,
        bio: raw.bio,
        socialLinks: raw.socialLinks ?? {},
        links: raw.links ?? [],
      });

      const tplName = raw.template || 'default';
      const tplSnap = await getDoc(doc(db, 'templates', tplName));
      setSelectedTemplate(
        tplSnap.exists() ? (tplSnap.data() as Template) : templates[tplName] || templates.default
      );

      setLoading(false);
    })();
  }, [uid]);

  if (!uid) return <p className="p-6 text-red-500">缺少 UID</p>;
  if (loading) return <p className="p-6">載入中…</p>;
  if (!profile) return <p className="p-6 text-red-500">找不到資料</p>;
  if (!selectedTemplate) return null;

  return (
    <main className="space-y-8 p-6 max-w-3xl mx-auto">
      <section className="text-center space-y-2">
        <h1 className="text-4xl font-black text-primary">🎉 註冊成功！</h1>
        <h2 className="text-lg text-gray-600">你的個人站已經建立完成</h2>
        <a href={`/dashboard?uid=${uid}`}>
          <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            前往 Dashboard
          </button>
        </a>
      </section>

      <hr className="my-6" />

      <TemplateLayout profile={profile} template={selectedTemplate} />
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import TemplateLayout, { ProfileData } from '../components/TemplateLayout';
import { Template } from '@/types/Template';
import { templates } from '@/lib/template';
import Confetti from 'react-confetti';

export default function CompleteContent() {
  const uid = useSearchParams().get('uid');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const confettiPieces = 200

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 10000); // 10 秒後停止顯示 Confetti
    return () => clearTimeout(timer);
  }, []);

  if (!uid) return <p className="p-6 text-red-500">缺少 UID</p>;
  if (loading) return <p className="p-6">載入中…</p>;
  if (!profile) return <p className="p-6 text-red-500">找不到資料</p>;
  if (!selectedTemplate) return null;

  return (
    <main className="space-y-8 p-6 max-w-3xl mx-auto relative overflow-hidden"> 
    
    {showConfetti && typeof window !== 'undefined' && (
  <Confetti
    width={window.innerWidth}
    height={window.innerHeight}
    gravity={1.2}
    numberOfPieces={confettiPieces}
    recycle={false}
  />
)}

      <section className="text-center space-y-2">
        <h1 className="text-4xl font-black text-primary">Horray! </h1>
        <h2 className="text-lg text-gray-700">Your FanLink Site is Generated🥳</h2>
        <a href={`/dashboard?uid=${uid}`}>
          <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Go to Dashboard for More
          </button>
        </a>
      </section>

      <div className="w-full md:w-1/2 mx-auto rounded-2xl shadow-lg p-4 bg-white">
        <TemplateLayout profile={profile} template={selectedTemplate} />
      </div>
    </main>
  );
}

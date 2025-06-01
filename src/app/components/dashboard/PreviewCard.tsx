'use client';

import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

export type LinkItem = {
  id: string;
  platform: string;
  url: string;
};

const socialIcon: Record<string, string> = {
  Instagram: '/icons/instagram.svg',
  YouTube: '/icons/youtube.svg',
  Threads: '/icons/threads.svg',
  X: '/icons/x.svg',
  GitHub: '/icons/github.svg',
  Spotify: '/icons/spotify.svg',
  Shopee: '/icons/shopee.svg',
  LINE: '/icons/line.svg',
  TikTok: '/icons/tiktok.svg',
};

export type Template = {
  bgImage?: string;
  fontFamily?: string;
  color: {
    fontPrimary: string;
    fontSecondary: string;
    buttonPrimary: string;
    buttonSecondary: string;
  };
  border: {
    radius: number;
    style: string;
  };
};

const defaultTemplate: Template = {
  color: {
    fontPrimary: '#000000',
    fontSecondary: '#666666',
    buttonPrimary: '#3B82F6',
    buttonSecondary: '#60A5FA',
  },
  border: { radius: 8, style: 'solid' },
};

export default function PreviewCard({
  profile,
  template,
}: {
  profile: {
    avatarUrl?: string;
    introduction?: string;
    links?: LinkItem[];
    socialLinks?: Record<string, string>;
    siteID?: string;
    templateKey?: string;
  };
  template?: Template;
}) {
  /* ---------------- local state ---------------- */
  const [loadedTemplate, setLoadedTemplate] = useState<Template | null>(null);
  const tpl: Template = loadedTemplate ?? template ?? defaultTemplate;

  /* ---------------- fetch template ---------------- */
  useEffect(() => {
    if (!template && profile.templateKey) {
      (async () => {
        try {
          const snap = await getDoc(doc(db, 'templates', profile.templateKey!));
          if (snap.exists()) {
            setLoadedTemplate(snap.data() as Template);
          }
        } catch (err) {
          console.error('載入 Template 失敗', err);
        }
      })();
    }
  }, [template, profile.templateKey]);

  /* ---------------- render ---------------- */
  const links = profile.links ?? [];
  const { bgImage, fontFamily, color, border } = tpl;

  return (
    <div
      className="w-full min-h-full flex flex-col justify-between px-4 pb-8 pt-16 backdrop-blur-sm"
      style={{
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily,
      }}
    >
      <div className="mx-auto w-full max-w-[600px] space-y-6 text-center">
        {/* Avatar + Title + Bio */}
        <div className="flex flex-col items-center space-y-2">
          {profile.avatarUrl ? (
          <div className="relative w-24 h-24 rounded-full overflow-hidden">
            <Image
              src={profile.avatarUrl}
              alt="avatar"
              fill
              sizes="96px"
              className="rounded-full object-cover"
            />
            </div>
          ) : (
            <div className="h-24 w-24 rounded-full bg-gray-200" />
          )}

          {profile.siteID && (
            <h1 className="text-lg font-bold" style={{ color: color.fontPrimary }}>
              {profile.siteID}
            </h1>
          )}

          {profile.introduction && (
            <p className="text-sm px-6" style={{ color: color.fontSecondary }}>
              {profile.introduction}
            </p>
          )}
        </div>

        {/* Links */}
        {links.length > 0 && (
          <div className="flex flex-col gap-4">
            {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-3 justify-start whitespace-nowrap transition-transform hover:scale-[1.02]"
          style={{
            backgroundColor: color.buttonPrimary,
            borderRadius: `${border.radius}px`,
            borderStyle: border.style,
            color: color.fontPrimary,
          }}
        >
          {socialIcon[link.platform] && (
            <Image
              src={socialIcon[link.platform]}
              alt={link.platform}
              width={20}
              height={20}
              className="h-5 w-5 shrink-0"
            />
          )}
          <span className="truncate">{link.platform}</span>
        </a>

            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="text-xs text-gray-400 pt-8">© 2025 FanLink</footer>
      </div>
    </div>
  );
}

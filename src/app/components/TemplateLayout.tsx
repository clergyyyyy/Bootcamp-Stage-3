'use client';

import React from 'react';
import { Template } from '@/types/Template';
import Image from 'next/image';

type SocialLinks = Record<string, string>;
type LinkItem = { title: string; url: string };

export type ProfileData = {
  siteID: string;
  avatarUrl?: string;
  bioTitle?: string;
  bio?: string;
  socialLinks: SocialLinks;
  links?: LinkItem[];
};

const socialIcon: Record<string, string> = {
  Instagram: '/icons/Instagram.svg',
  YouTube: '/icons/youtube.svg',
  Threads: '/icons/threads.svg',
  X: '/icons/x.svg',
  GitHub: '/icons/github.svg',
  Spotify: '/icons/spotify.svg',
  Shopee: '/icons/shopee.svg',
  LINE: '/icons/line.svg',
  TikTok: '/icons/tiktok.svg'
};

export default function TemplateLayout({
  profile,
  template,
}: {
  profile: ProfileData;
  template: Template;
}) {
  const {
    bgImage,
    fontFamily,
    color,
    border,
  } = template;

  if (!template) return <div className="p-6 text-red-500">尚未選擇樣板</div>;

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily,
      }}
    >
      <div className="flex h-full w-full flex-1 flex-col justify-between px-4 pb-8 pt-16 sm:pb-16 backdrop-blur-md">
        <div className="mx-auto h-full w-full max-w-[600px]">

          {/* --- 頭像 + 標題/簡介 --- */}
          <div className="flex flex-col items-center">
            {profile.avatarUrl && (
              <div className="mb-4" id="profile-picture">
                <div className="mb-4 relative" id="profile-picture" style={{ width: 96, height: 96 }}>
                  <Image
                    src={profile.avatarUrl}
                    alt="avatar"
                    fill
                    sizes="96px"
                    className="rounded-full object-cover"
                  />
                </div>
              </div>
            )}

            <div id="profile-title" className="mx-3 flex max-w-full items-center">
              <h1
                className="text-center text-lg font-bold leading-[1.5]"
                style={{ color: color.fontPrimary }}
              >
                {profile.siteID}
              </h1>
            </div>

            {profile.bio && (
              <div id="profile-description" className="mt-1 px-6">
                <h2
                  className="text-center text-sm"
                  style={{ color: color.fontSecondary }}
                >
                  {profile.bio}
                </h2>
              </div>
            )}
          </div>

    {/* --- 合併後的連結按鈕區塊（含社群 icon link） --- */}
    {((profile.links?.length ?? 0) > 0 ||
      Object.keys(profile.socialLinks ?? {}).length > 0) && (
      <div id="links-container" className="mt-6 flex flex-col gap-4">
        {/* 一般連結按鈕 */}
        {profile.links?.map((item) => (
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 text-center transition hover:scale-[1.02]"
            style={{
              backgroundColor: color.buttonPrimary,
              borderRadius: `${border.radius}px`,
              borderStyle: border.style,
              color: '#fff',
            }}
          >
            {item.title}
          </a>
        ))}

        {Object.entries(profile.socialLinks || {}).map(([platform, url]) =>
          url ? (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 text-white transition hover:scale-[1.02]"
              style={{
                backgroundColor: color.buttonSecondary,
                borderRadius: `${border.radius}px`,
                borderStyle: border.style,
              }}
            >
              <Image
                src={socialIcon[platform] || '/icons/link.svg'}
                alt={platform}
                width={20}
                height={20}
                className="h-5 w-5"
              />
              <span className="text-sm" style={{ color: color.fontPrimary }}>
                {platform}
              </span>
            </a>
          ) : null
        )}
      </div>
    )}

        </div>

        <footer className="mt-8 flex justify-center text-xs text-gray-400">
          © 2025 FanLink
        </footer>
      </div>
    </div>
  );
}

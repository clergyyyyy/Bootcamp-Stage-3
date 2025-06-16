'use client';

import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { Template } from '@/types/Template'; // 使用統一的 Template 類型
import type { Profile } from '@/types/profile';

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
  Facebook: '/icons/facebook.svg',
};

const defaultTemplate: Template = {
  name: 'default',
  templateEngName: 'default',
  color: {
    fontPrimary: '#000000',
    fontSecondary: '#666666',
    buttonPrimary: '#3B82F6',
    buttonSecondary: '#60A5FA',
  },
  border: { radius: 8, style: 'solid' },
};

// YouTube URL 轉換為嵌入式 URL 的函數
const getYouTubeEmbedUrl = (url: string): string | null => {
  try {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    return null;
  } catch {
    return null;
  }
};

// Spotify URL 轉換為嵌入式 URL 的函數
const getSpotifyEmbedUrl = (url: string): string | null => {
  try {
    const patterns = [
      /spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/,
      /open\.spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const [, type, id] = match;
        return `https://open.spotify.com/embed/${type}/${id}`;
      }
    }
    return null;
  } catch {
    return null;
  }
};

export default function PreviewCard({
  profile,
  template,
}: {
profile: Partial<Profile>;
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
        } catch {
        }
      })();
    }
  }, [template, profile.templateKey]);

  /* ---------------- render ---------------- */
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
              {profile.bioTitle}
            </h1>
          )}

          {profile.introduction && (
            <p className="text-sm px-6" style={{ color: color.fontSecondary }}>
              {profile.introduction}
            </p>
          )}
        </div>

        {/* 連結區塊 */}
        {profile.links && profile.links.length > 0 && (
          <div className="flex flex-col gap-4">
            {profile.links.map((linkItem) => {

              // 如果沒有 type 屬性，根據 platform 推斷類型
              let linkType = linkItem.type;
              if (!linkType) {
                const platform = linkItem.platform || ''; // 確保不是 undefined
                
                if (platform === 'YouTube') {
                  linkType = 'youtube';
                } else if (platform === 'Spotify') {
                  linkType = 'spotify';
                } else if (platform && ['Instagram', 'Threads', 'Facebook', 'LINE', 'TikTok', 'X', 'Shopee', 'GitHub'].includes(platform)) {
                  linkType = 'social';
                } else {
                  linkType = 'custom';
                }
              }

              // YouTube
              if (linkType === 'youtube') {
                const embedUrl = getYouTubeEmbedUrl(linkItem.url);
                
                if (!embedUrl) {
                  return null;
                }
                
                return (
                  <div key={linkItem.id} className="relative w-full h-0 pb-[56.25%] rounded-lg overflow-hidden shadow-lg">
                    <iframe
                      src={embedUrl}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute top-0 left-0 w-full h-full"
                      style={{
                        borderRadius: `${border.radius}px`,
                      }}
                    />
                  </div>
                );
              }

              // Spotify 嵌入式播放器
              if (linkType === 'spotify') {
                const embedUrl = getSpotifyEmbedUrl(linkItem.url);
                
                if (!embedUrl) {
                  return null;
                }
                
                return (
                  <div key={linkItem.id} className="w-full rounded-lg overflow-hidden shadow-lg">
                    <iframe
                      src={embedUrl}
                      width="100%"
                      height="352"
                      frameBorder="0"
                      allowTransparency={true}
                      allow="encrypted-media"
                      title="Spotify player"
                      style={{
                        borderRadius: `${border.radius}px`,
                      }}
                    />
                  </div>
                );
              }

              // 社群平台按鈕
              if (linkType === 'social') {
                // 修正：檢查 platform 是否存在且有對應的圖標
                const platformName = linkItem.platform;
                if (!platformName) {
                  return null;
                }

                return (
                  <a
                    key={linkItem.id}
                    href={linkItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 justify-start whitespace-nowrap transition-transform hover:scale-[1.02]"
                    style={{
                      backgroundColor: color.buttonSecondary,
                      borderRadius: `${border.radius}px`,
                      borderStyle: border.style,
                      color: color.fontPrimary,
                    }}
                  >
                    {socialIcon[platformName] && (
                      <Image
                        src={socialIcon[platformName]}
                        alt={platformName}
                        width={20}
                        height={20}
                        className="h-5 w-5 shrink-0"
                      />
                    )}
                    <span className="truncate">{platformName}</span>
                  </a>
                );
              }

              // 自訂連結按鈕
              if (linkType === 'custom') {
                const displayText = linkItem.platform || '自訂連結';
                
                return (
                  <a
                    key={linkItem.id}
                    href={linkItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-3 text-center transition-transform hover:scale-[1.02]"
                    style={{
                      backgroundColor: color.buttonPrimary,
                      borderRadius: `${border.radius}px`,
                      borderStyle: border.style,
                      color: '#fff',
                    }}
                  >
                    {displayText}
                  </a>
                );
              }

              return null;
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="text-xs text-gray-400 pt-8">© 2025 FanLink</footer>
      </div>
    </div>
  );
}
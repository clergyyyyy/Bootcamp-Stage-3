'use client';

import React from 'react';
import { Template } from '@/types/Template';
import { LinkItem } from '@/types/link';
import Image from 'next/image';

type SocialLinks = Record<string, string>;
type LegacyLinkItem = { title: string; url: string }; 

export type ProfileData = {
  siteID: string;
  avatarUrl?: string;
  bioTitle?: string;
  bio?: string;
  introduction?: string; 
  socialLinks?: SocialLinks;  
  links: LinkItem[];          
  legacyLinks?: LegacyLinkItem[]; 
  youtubeUrl?: string;       
  spotifyUrl?: string;       
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
  TikTok: '/icons/tiktok.svg',
  Facebook: '/icons/facebook.svg',
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

  console.log('🎨 TemplateLayout 收到的 profile 資料:', profile);
  console.log('🔗 Links 資料:', profile.links);

  if (!template) return <div className="p-6 text-red-500">尚未選擇樣板</div>;

  // 處理連結資料：統一使用 profile.links
  const processLinks = (): LinkItem[] => {
    const allLinks: LinkItem[] = [];
    
    if (profile.links && Array.isArray(profile.links)) {
      allLinks.push(...profile.links);
      console.log('✅ 使用統一格式的連結:', profile.links);
    }

    // 向下相容：處理舊格式的社群連結
    if (profile.socialLinks) {
      Object.entries(profile.socialLinks).forEach(([platform, url]) => {
        if (url) {
          allLinks.push({
            id: `social-${platform}-legacy`,
            type: 'social',
            platform,
            url,
          });
        }
      });
    }

    // 向下相容：處理舊格式的自訂連結
    if (profile.legacyLinks) {
      profile.legacyLinks.forEach((link, index) => {
        allLinks.push({
          id: `custom-${index}-legacy`,
          type: 'custom',
          platform: link.title, // 舊格式使用 title 作為 platform
          url: link.url,
        });
      });
    }

    // 向下相容：處理舊格式的 YouTube 連結
    if (profile.youtubeUrl) {
      allLinks.push({
        id: 'youtube-legacy',
        type: 'youtube',
        platform: 'YouTube',
        url: profile.youtubeUrl,
      });
    }

    // 向下相容：處理舊格式的 Spotify 連結
    if (profile.spotifyUrl) {
      allLinks.push({
        id: 'spotify-legacy',
        type: 'spotify',
        platform: 'Spotify',
        url: profile.spotifyUrl,
      });
    }

    console.log('🔧 處理後的所有連結:', allLinks);
    return allLinks;
  };

  const allLinks = processLinks();

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
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
                {profile.bioTitle}
              </h1>
            </div>

            {(profile.bio || profile.introduction) && (
              <div id="profile-description" className="mt-1 px-6">
              <h2
                className="text-center text-sm whitespace-pre-line"  // ← 加這段
                style={{ color: color.fontSecondary }}
              >
                {profile.bio || profile.introduction}
              </h2>
              </div>
            )}
          </div>

          {/* --- 統一連結區塊 --- */}
          {allLinks.length > 0 && (
            <div id="unified-links-container" className="mt-6 flex flex-col gap-4">
              {allLinks.map((linkItem) => {
                console.log('🎬 渲染連結項目:', linkItem);

                // YouTube 嵌入式播放器
                if (linkItem.type === 'youtube') {
                  const embedUrl = getYouTubeEmbedUrl(linkItem.url);
                  console.log('📺 YouTube 嵌入 URL:', embedUrl);
                  
                  if (!embedUrl) {
                    console.warn('⚠️ YouTube URL 無法轉換:', linkItem.url);
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
                if (linkItem.type === 'spotify') {
                  const embedUrl = getSpotifyEmbedUrl(linkItem.url);
                  console.log('🎵 Spotify 嵌入 URL:', embedUrl);
                  
                  if (!embedUrl) {
                    console.warn('⚠️ Spotify URL 無法轉換:', linkItem.url);
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
                if (linkItem.type === 'social') {
                  // 修正：檢查 platform 是否存在且有對應的圖標
                  const platformName = linkItem.platform;
                  if (!platformName) {
                    console.warn('⚠️ 社群連結缺少 platform:', linkItem);
                    return null;
                  }

                  return (
                    <a
                      key={linkItem.id}
                      href={linkItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 transition hover:scale-[1.02]"
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
                          className="h-5 w-5"
                        />
                      )}
                      <span className="text-sm">
                        {platformName}
                      </span>
                    </a>
                  );
                }

                // 自訂連結按鈕
                if (linkItem.type === 'custom') {
                  const displayText = linkItem.platform || '自訂連結'; // 提供回退文字
                  
                  return (
                    <a
                      key={linkItem.id}
                      href={linkItem.url}
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
                      {displayText}
                    </a>
                  );
                }

                console.warn('⚠️ 未知的連結類型:', linkItem);
                return null;
              })}
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
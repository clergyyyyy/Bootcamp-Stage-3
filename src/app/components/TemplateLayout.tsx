'use client';

import React from 'react';
import { Template } from '@/types/Template';
import type { UnifiedLinkItem, ObjektNFT } from '@/types/unified-link';
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
  links: UnifiedLinkItem[];
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

// Objekt NFT 排版計算函數
const calculateObjektLayout = (objektCount: number): { rows: number[][]; maxDisplay: number } => {
  // 最多顯示 24 個 NFT（8排 x 3個）
  const maxDisplay = Math.min(objektCount, 24);
  
  if (maxDisplay <= 3) {
    // 1-3 個：一排顯示
    return { rows: [Array.from({ length: maxDisplay }, (_, i) => i)], maxDisplay };
  } else if (maxDisplay <= 6) {
    // 4-6 個：兩排顯示
    const firstRowCount = Math.ceil(maxDisplay / 2);
    const secondRowCount = maxDisplay - firstRowCount;
    
    return {
      rows: [
        Array.from({ length: firstRowCount }, (_, i) => i),
        Array.from({ length: secondRowCount }, (_, i) => i + firstRowCount)
      ],
      maxDisplay
    };
  } else {
    // 7+ 個：每排最多 3 個
    const rows: number[][] = [];
    for (let i = 0; i < maxDisplay; i += 3) {
      const rowIndices = Array.from(
        { length: Math.min(3, maxDisplay - i) },
        (_, j) => i + j
      );
      rows.push(rowIndices);
    }
    
    return { rows, maxDisplay };
  }
};

// Objekt NFT 展示組件（更新為響應式版本）
const ObjektDisplay = ({ 
  objekts, 
  //title, 
  template 
}: { 
  objekts: ObjektNFT[]; 
  //title?: string; 
  template: Template 
}) => {
  if (!objekts || objekts.length === 0) return null;

  const { rows, maxDisplay } = calculateObjektLayout(objekts.length);
  const displayObjekts = objekts.slice(0, maxDisplay);

  return (
    <div
      className="w-full max-w-full px-4 py-4 transition-all duration-200 overflow-hidden"
      style={{
        backgroundColor: template.color.buttonPrimary,
        borderRadius: `${template.border.radius}px`,
        borderStyle: template.border.style,
        borderWidth: template.border.style === 'none' ? '0px' : '1px',
        borderColor: template.color.fontSecondary,
      }}
    >
      {/* 標題（目前註解掉） */}
      {/* title && title.trim() && (
        <h3
          className="text-sm font-semibold mb-3 text-center"
          style={{ color: template.color.fontPrimary }}
        >
          {title}
        </h3>
      ) */}

      {/* NFT 網格 - 響應式容器 */}
      <div className="w-full max-w-full">
        <div className="space-y-2">
          {rows.map((rowIndices, rowIndex) => {
            const itemsInRow = rowIndices.length;
            
            return (
              <div 
                key={rowIndex} 
                className={`flex gap-2 w-full ${
                  itemsInRow === 1 ? 'justify-center' :
                  itemsInRow === 2 ? 'justify-center' :
                  'justify-center'
                }`}
              >
                {rowIndices.map((objektIndex) => {
                  const objekt = displayObjekts[objektIndex];
                  if (!objekt) return null;

                  return (
                    <div
                      key={objekt.id}
                      className="relative group flex-shrink-0 transition-transform duration-200 hover:scale-105"
                      style={{
                        // 使用 CSS 響應式尺寸而非固定像素
                        width: itemsInRow === 1 ? 'min(200px, 33vw)' :
                               itemsInRow === 2 ? 'min(160px, 28vw)' :
                               'min(120px, 25vw)',
                        aspectRatio: '1083 / 1673', // 保持原始比例
                        maxWidth: '100%',
                      }}
                    >
                    <Image
                      src={objekt.image}
                      alt={objekt.name}
                      fill
                      sizes="(max-width: 600px) 33vw, 120px"
                      className="w-full h-full object-cover rounded-lg border-2 border-white shadow-md"
                      style={{
                        borderRadius: `${Math.max(4, template.border.radius / 2)}px`,
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                      
                      {/* Hover 顯示名稱 */}
                      <div 
                        className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg"
                        style={{
                          borderRadius: `${Math.max(4, template.border.radius / 2)}px`,
                        }}
                      >
                        <span 
                          className="text-white text-xs font-medium text-center px-1 leading-tight"
                          style={{
                            fontSize: itemsInRow === 3 ? '10px' : itemsInRow === 2 ? '11px' : '12px',
                            lineHeight: '1.2',
                          }}
                        >
                          {objekt.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* 顯示總數（如果有更多未顯示的 NFT） */}
      {objekts.length > maxDisplay && (
        <div className="mt-3 text-center">
          <span
            className="text-xs opacity-75"
            style={{ color: template.color.fontSecondary }}
          >
            顯示 {maxDisplay} / {objekts.length} 個 Objekt
          </span>
        </div>
      )}
    </div>
  );
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
  const processLinks = (): UnifiedLinkItem[] => {
    const allLinks: UnifiedLinkItem[] = [];
    
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
            title: platform,
            order: 999,
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
          platform: link.title,
          url: link.url,
          title: link.title,
          order: 999 + index,
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
        title: 'YouTube',
        order: 998,
      });
    }

    // 向下相容：處理舊格式的 Spotify 連結
    if (profile.spotifyUrl) {
      allLinks.push({
        id: 'spotify-legacy',
        type: 'spotify',
        platform: 'Spotify',
        url: profile.spotifyUrl,
        title: 'Spotify',
        order: 997,
      });
    }

    // 根據 order 排序
    allLinks.sort((a, b) => (a.order || 0) - (b.order || 0));

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
                className="text-center text-sm whitespace-pre-line"
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

                // Objekt NFT 展示
                if (linkItem.type === 'objekt') {
                  const objektItem = linkItem as UnifiedLinkItem & { type: 'objekt'; objekts: ObjektNFT[] };
                  
                  console.log('🎴 Objekt NFT 資料:', { 
                    id: linkItem.id, 
                    title: linkItem.title, 
                    objektsCount: objektItem.objekts?.length || 0,
                    objekts: objektItem.objekts
                  });
                  
                  // 檢查是否有有效的 Objekt 資料
                  if (!objektItem.objekts || !Array.isArray(objektItem.objekts) || objektItem.objekts.length === 0) {
                    console.warn('⚠️ Objekt 項目缺少有效的 objekts 資料:', linkItem);
                    return null;
                  }

                  return (
                    <ObjektDisplay
                      key={linkItem.id}
                      objekts={objektItem.objekts}
                      //title={linkItem.title}
                      template={template}
                    />
                  );
                }

                // 文字方塊
                if (linkItem.type === 'text') {
                  // 安全的類型檢查和內容提取
                  const textItem = linkItem as UnifiedLinkItem & { type: 'text'; content: string };
                  const textContent = textItem.content;
                  const textTitle = linkItem.title;
                  
                  console.log('📝 文字方塊資料:', { 
                    id: linkItem.id, 
                    title: textTitle, 
                    content: textContent,
                    contentLength: textContent?.length 
                  });
                  
                  // 如果沒有內容，就不渲染
                  if (!textContent || typeof textContent !== 'string' || !textContent.trim()) {
                    console.warn('⚠️ 文字方塊缺少內容:', linkItem);
                    return null;
                  }
                  
                  return (
                    <div
                      key={linkItem.id}
                      className="px-4 py-3 text-left transition-all duration-200"
                      style={{
                        backgroundColor: color.buttonPrimary,
                        borderRadius: `${border.radius}px`,
                        borderStyle: border.style,
                        borderWidth: border.style === 'none' ? '0px' : '1px',
                        borderColor: color.fontSecondary,
                      }}
                    >
                      {/* 標題（如果有的話） */}
                      {textTitle && textTitle.trim() && (
                        <h3
                          className="text-sm font-semibold mb-2"
                          style={{ color: color.fontPrimary }}
                        >
                          {textTitle}
                        </h3>
                      )}
                      
                      {/* 內容 - 確保一定會顯示 */}
                      <div
                        className="text-sm whitespace-pre-line leading-relaxed"
                        style={{ 
                          color: color.fontSecondary,
                          minHeight: '1.25rem', // 確保至少有一行的高度
                        }}
                      >
                        {textContent}
                      </div>
                    </div>
                  );
                }

                // YouTube 嵌入式播放器
                if (linkItem.type === 'youtube') {
                  const youtubeItem = linkItem as UnifiedLinkItem & { type: 'youtube'; url: string };
                  const embedUrl = getYouTubeEmbedUrl(youtubeItem.url);
                  console.log('📺 YouTube 嵌入 URL:', embedUrl);
                  
                  if (!embedUrl) {
                    console.warn('⚠️ YouTube URL 無法轉換:', youtubeItem.url);
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
                  const spotifyItem = linkItem as UnifiedLinkItem & { type: 'spotify'; url: string };
                  const embedUrl = getSpotifyEmbedUrl(spotifyItem.url);
                  console.log('🎵 Spotify 嵌入 URL:', embedUrl);
                  
                  if (!embedUrl) {
                    console.warn('⚠️ Spotify URL 無法轉換:', spotifyItem.url);
                    return null;
                  }
                  
                  return (
                    <div key={linkItem.id} className="w-full rounded-lg overflow-hidden shadow-lg">
                      <iframe
                        src={embedUrl}
                        width="100%"
                        height="352"
                        frameBorder="0"
                        allow="encrypted-media"
                        title="Spotify player"
                        className="border-0 bg-transparent"
                        style={{
                          borderRadius: `${border.radius}px`,
                        }}
                      />
                    </div>
                  );
                }

                // 社群平台按鈕
                if (linkItem.type === 'social') {
                  const socialItem = linkItem as UnifiedLinkItem & { type: 'social'; platform: string; url: string };
                  const platformName = socialItem.platform;
                  
                  if (!platformName) {
                    console.warn('⚠️ 社群連結缺少 platform:', linkItem);
                    return null;
                  }

                  return (
                    <a
                      key={linkItem.id}
                      href={socialItem.url}
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
                  const customItem = linkItem as UnifiedLinkItem & { type: 'custom'; platform?: string; url: string };
                  const displayText = customItem.platform || customItem.title || '自訂連結';
                  
                  return (
                    <a
                      key={linkItem.id}
                      href={customItem.url}
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
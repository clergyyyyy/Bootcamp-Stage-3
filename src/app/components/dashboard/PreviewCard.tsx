'use client';

import Image from 'next/image';
import { useEffect, useState, useMemo, useCallback } from 'react';
import React from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Template } from '@/types/Template';
import type { Profile } from '@/types/profile';
import type { UnifiedLinkItem, ObjektNFT } from '@/types/unified-link';
import { isTextItem, isObjektItem, isLinkItem } from '@/types/unified-link';

/* ---------- static ---------- */
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

/* ---------- template fallback ---------- */
const defaultTemplate: Template = {
  name: 'default',
  templateEngName: 'default',
  bgImage: '',
  fontFamily: 'Arial, sans-serif',
  color: {
    fontPrimary: '#000',
    fontSecondary: '#666',
    buttonPrimary: '#3B82F6',
    buttonSecondary: '#60A5FA',
  },
  border: { radius: 8, style: 'solid' },
};

/* ---------- util: embed URL ---------- */
const ytRx = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/;
const spRx = /(?:open\.)?spotify\.com\/(track|album|playlist|artist)\/([A-Za-z0-9]+)/;

const getYtEmbed = (u: string) =>
  u.match(ytRx)?.[1] ? `https://www.youtube.com/embed/${u.match(ytRx)![1]}` : null;

const getSpEmbed = (u: string) => {
  const m = u.match(spRx);
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null;
};

/* ---------- Objekt NFT 版面計算 ---------- */
const calculateObjektLayout = (
  objektCount: number,
): { rows: number[][]; maxDisplay: number } => {
  const maxDisplay = Math.min(objektCount, 24); // 最多 24 個
  if (maxDisplay <= 3) {
    return { rows: [Array.from({ length: maxDisplay }, (_, i) => i)], maxDisplay };
  }
  if (maxDisplay <= 6) {
    const first = Math.ceil(maxDisplay / 2);
    return {
      rows: [
        Array.from({ length: first }, (_, i) => i),
        Array.from({ length: maxDisplay - first }, (_, i) => i + first),
      ],
      maxDisplay,
    };
  }

  const rows: number[][] = [];
  for (let i = 0; i < maxDisplay; i += 3) {
    rows.push(Array.from({ length: Math.min(3, maxDisplay - i) }, (_, j) => i + j));
  }
  return { rows, maxDisplay };
};

/* ---------- Objekt 顯示元件 ---------- */
const ObjektDisplay = React.memo(({
  objekts,
  title,
  template,
}: {
  objekts: ObjektNFT[];
  title?: string;
  template: Template;
}) => {
  console.log('Objekt title:', title);
  if (!objekts?.length) return null;

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
      {/* NFT 網格 */}
      <div className="w-full max-w-full">
        <div className="space-y-2">
          {rows.map((rowIndices, rowIndex) => {
            const itemsInRow = rowIndices.length;
            return (
              <div
                key={rowIndex}
                className={`flex gap-2 w-full justify-center`}
              >
                {rowIndices.map((idx) => {
                  const objekt = displayObjekts[idx];
                  return (
                    <div
                      key={objekt.id}
                      className="relative group flex-shrink-0 transition-transform duration-200 hover:scale-105"
                      style={{
                        width:
                          itemsInRow === 1
                            ? 'min(200px, 33vw)'
                            : itemsInRow === 2
                            ? 'min(160px, 28vw)'
                            : 'min(120px, 25vw)',
                        aspectRatio: '1083 / 1673',
                      }}
                    >
                      <Image
                        src={objekt.image}
                        alt={objekt.name}
                        fill
                        sizes="(max-width:768px) 40vw, 120px"
                        className="object-cover rounded-lg border-2 border-white shadow-md"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div
                        className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg"
                        style={{ borderRadius: `${Math.max(4, template.border.radius / 2)}px` }}
                      >
                        <span
                          className="text-white text-xs font-medium text-center px-1 leading-tight"
                          style={{
                            fontSize:
                              itemsInRow === 3 ? '10px' : itemsInRow === 2 ? '11px' : '12px',
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

      {objekts.length > maxDisplay && (
        <div className="mt-3 text-center">
          <span className="text-xs opacity-75" style={{ color: template.color.fontSecondary }}>
            顯示 {maxDisplay} / {objekts.length} 個 Objekt
          </span>
        </div>
      )}
    </div>
  );
});

/* ---------- 主要卡片元件 ---------- */
export default function PreviewCard({
  profile,
  template,
  remountTrigger = 0,
}: {
  profile: Partial<Profile>;
  template?: Template;
  remountTrigger?: number;
}) {
  const [loaded, setLoaded] = useState<Template | null>(null);

  useEffect(() => {
    if (remountTrigger > 0) {
      console.log('🎯 [PreviewCard] Remount trigger received:', remountTrigger);
    }
  }, [remountTrigger]);

  useEffect(() => {
    if (!template && profile.templateKey) {
      (async () => {
        try {
          const key = profile.templateKey as string;
          const ref = doc(db, 'templates', key);
          const snap = await getDoc(ref);
          if (snap.exists()) setLoaded(snap.data() as Template);
        } catch {
          /* ignore */
        }
      })();
    }
  }, [template, profile.templateKey]);

  const tpl = loaded ?? template ?? defaultTemplate;
  const { color, border, bgImage, fontFamily } = tpl;

  const deduplicateLinks = useCallback((links: UnifiedLinkItem[] = []): UnifiedLinkItem[] => {
    const seen = new Set<string>();
    const result: UnifiedLinkItem[] = [];

    // 先按照 legacy 與 order 排序
    const sorted = [...links].sort((a, b) => {
      const aLegacy = a.id.includes('-legacy');
      const bLegacy = b.id.includes('-legacy');
      if (aLegacy !== bLegacy) return aLegacy ? 1 : -1;
      return (a.order ?? 0) - (b.order ?? 0);
    });

    for (const link of sorted) {
      let key: string;

      if (isTextItem(link)) {
        key = `text:${link.content.slice(0, 20)}`;
      } else if (isObjektItem(link)) {
        key = `objekt:${link.id}:${link.objekts.length}`;
      } else if (isLinkItem(link)) {
        // social / youtube / spotify / custom
        key = `${link.type}:${(link.platform ?? '').toLowerCase()}:${link.url}`;
      } else {
        continue;
      }

      if (!seen.has(key)) {
        seen.add(key);
        result.push(link);
      }
    }

    return result;
  }, []);

  const processedLinks = useMemo(() => 
    deduplicateLinks((profile.links ?? []) as UnifiedLinkItem[]), 
    [profile.links, deduplicateLinks]
  );

  /* ---------- render helper ---------- */
  const renderItem = useCallback((item: UnifiedLinkItem) => {
    if (item.type === 'objekt') {
      if (!item.objekts?.length) return null;
      return (
        <ObjektDisplay
          key={item.id}
          objekts={item.objekts}
          title={item.title}
          template={tpl}
        />
      );
    }

    if (item.type === 'text') {
      if (!item.content?.trim()) return null;
      return (
        <div
          key={item.id}
          className="px-4 py-3 text-left transition-all duration-200"
          style={{
            backgroundColor: color.buttonPrimary,
            borderRadius: `${border.radius}px`,
            borderStyle: border.style,
            borderWidth: border.style === 'none' ? '0px' : '1px',
            borderColor: color.fontSecondary,
          }}
        >
          {item.title?.trim() && (
            <h3 className="text-sm font-semibold mb-2" style={{ color: color.fontPrimary }}>
              {item.title}
            </h3>
          )}
          <div
            className="text-sm whitespace-pre-line leading-relaxed"
            style={{ color: color.fontSecondary, minHeight: '1.25rem' }}
          >
            {item.content}
          </div>
        </div>
      );
    }

    if (item.type === 'youtube') {
      return (
        <iframe
          key={`yt-${item.id}-${item.order}`}
          src={getYtEmbed(item.url) ?? ''}
          className="w-full h-[56.25vw] max-h-[352px] border-0 rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      );
    }

    if (item.type === 'spotify') {
      return (
        <iframe
          key={`sp-${item.id}-${item.order}`}
          src={getSpEmbed(item.url) ?? ''}
          width="100%"
          height="352"
          frameBorder="0"
          allow="encrypted-media"
          className="border-0 rounded-lg"
          loading="lazy"
        />
      );
    }

    if (item.type === 'social') {
      return (
        <a
          key={item.id}
          href={item.url}
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
          {item.platform && socialIcon[item.platform] && (
            <Image
              src={socialIcon[item.platform]}
              alt={item.platform}
              width={20}
              height={20}
              className="h-5 w-5"
            />
          )}
          <span className="text-sm">{item.platform}</span>
        </a>
      );
    }

    if (item.type === 'custom') {
      // 優先順序：title > platform > '自訂連結'
      const displayText = item.title?.trim() || item.platform?.trim() || '自訂連結';
      
      return (
        <a
          key={item.id}
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
          <span className="text-sm">{displayText}</span>
        </a>
      );
    }

    return null; // 不明類型直接忽略
  }, [tpl, color, border, remountTrigger]);

  /* ---------- JSX ---------- */
  return (
    <div
      className="w-full min-h-full flex flex-col justify-between px-4 pb-8 pt-16 backdrop-blur-md"
      style={{
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily,
      }}
    >
      {/* header */}
      <div className="mx-auto max-w-[600px] space-y-6 text-center">
        {/* avatar / title / intro */}
        <div className="flex flex-col items-center space-y-2">
          {profile.avatarUrl ? (
            <div className="mb-4 relative" style={{ width: 96, height: 96 }}>
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

          {profile.bioTitle && (
            <h1 className="text-lg font-bold leading-[1.5]" style={{ color: color.fontPrimary }}>
              {profile.bioTitle}
            </h1>
          )}

          {profile.introduction && (
            <p
              className="text-sm px-6 whitespace-pre-line"
              style={{ color: color.fontSecondary }}
            >
              {profile.introduction}
            </p>
          )}
        </div>

        {/* links */}
        {processedLinks.length > 0 && (
          <div className="flex flex-col gap-4">{processedLinks.map(renderItem)}</div>
        )}
      </div>

      {/* footer */}
      <footer className="mt-8 flex justify-center text-xs text-gray-400">© 2025 FanLink</footer>
    </div>
  );
}
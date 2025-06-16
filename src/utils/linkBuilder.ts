// src/utils/linkBuilder.ts
import type { LinkItem, LinkType } from '@/types/link';

const ALLOWED = ['youtube','spotify','social','custom'] as const;

const autoDetectType = (url: string): LinkType =>
  /youtu\.?be/.test(url)   ? 'youtube'
: /spotify\.com/.test(url) ? 'spotify'
:                            'social';

const normalizeType = (raw: unknown, url: string): LinkType =>
  typeof raw === 'string' && (ALLOWED as readonly string[]).includes(raw.toLowerCase())
    ? (raw.toLowerCase() as LinkType)
    : autoDetectType(url);

type RawLink = {
  id?: string;
  url: string;
  type?: string;
  platform?: string;
};

export const buildLinkItems = (
  rawLinks: RawLink[] = [],
  socials: Record<string, string> = {},
): { links: LinkItem[]; remainingSocials: Record<string, string> } => {
  const list: LinkItem[] = [];
  const seen = new Set<string>();

  rawLinks.forEach((l, idx) => {
    if (!l?.url) return;
    const key = `${(l.platform || '').trim().toLowerCase()}|${l.url.trim()}`;
    if (seen.has(key)) return;
    list.push({
      id: l.id || `link-${idx}`,
      type: normalizeType(l.type, l.url),
      platform: l.platform || '',
      url: l.url,
    });
    seen.add(key);
  });

  const remainingSocials: Record<string, string> = {};
  Object.entries(socials).forEach(([plat, url]) => {
    if (!url) return;
    const key = `${plat.trim().toLowerCase()}|${url.trim()}`;
    if (seen.has(key)) return;
    list.push({
      id: `social-${plat}`,
      type: 'social',
      platform: plat,
      url,
    });
    seen.add(key);
    // 被轉為 link，不加到 remainingSocials
  });

  // ※ 如果想「保留未被轉成 link 的 socialLinks」，請這樣處理
  Object.entries(socials).forEach(([plat, url]) => {
    const key = `${plat.trim().toLowerCase()}|${url.trim()}`;
    if (!seen.has(key)) remainingSocials[plat] = url;
  });

  return { links: list, remainingSocials };
};

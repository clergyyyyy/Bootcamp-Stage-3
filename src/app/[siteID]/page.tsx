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
import type { UnifiedLinkItem, ObjektNFT } from '@/types/unified-link';
import { LinkType } from '@/types/link';

type RawLinkItem = {
  id?: string;
  url?: string;
  platform?: string;
  type?: string;
  title?: string;
  content?: string;
  objekts?: ObjektNFT[];
  order?: number;
};

const ALLOWED_LINK_TYPES = ['youtube', 'spotify', 'social', 'custom'] as const;
const ALLOWED_TEXT_TYPES = ['text'] as const;
const ALLOWED_OBJEKT_TYPES = ['objekt'] as const;
const ALL_ALLOWED_TYPES = [...ALLOWED_LINK_TYPES, ...ALLOWED_TEXT_TYPES, ...ALLOWED_OBJEKT_TYPES] as const;

const autoDetectType = (url: string): LinkType => {
  if (/youtu\.?be/.test(url)) return 'youtube';
  if (/spotify\.com/.test(url)) return 'spotify';
  return 'social';
};

const normalizeType = (raw: unknown, url?: string, objekts?: ObjektNFT[]): 'text' | 'objekt' | LinkType => {
  if (typeof raw === 'string') {
    const lowerType = raw.toLowerCase();
    if ((ALL_ALLOWED_TYPES as readonly string[]).includes(lowerType)) {
      return lowerType as 'text' | 'objekt' | LinkType;
    }
  }
  

  if (objekts && objekts.length > 0) return 'objekt';
  
  if (!url) return 'text';
  return autoDetectType(url);
};

const normalizeKey = (id?: string, platform = '', url = '', content = '', objektsCount = 0) =>
  id || `${platform.trim().toLowerCase()}|${url.trim()}|${content.trim().slice(0, 20)}|objekt:${objektsCount}`;

// 驗證 Objekt NFT 資料格式
const validateObjektNFT = (objekt: unknown): objekt is ObjektNFT => {
  if (typeof objekt !== 'object' || objekt === null) return false;

  const o = objekt as Record<string, unknown>;

  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.image === 'string' &&
    o.id.length > 0 &&
    o.name.length > 0 &&
    o.image.length > 0
  );
};

// 清理和驗證 Objekt NFT 陣列
const cleanObjektArray = (objekts: unknown[]): ObjektNFT[] => {
  if (!Array.isArray(objekts)) return [];
  
  return objekts
    .filter(validateObjektNFT)
    .map(objekt => ({
      id: objekt.id,
      name: objekt.name,
      image: objekt.image,
    }));
};

const buildUnifiedLinkItems = (
  rawLinks: RawLinkItem[] = [],
  socialLinks: Record<string, string> = {}
): { 
  links: UnifiedLinkItem[], 
  remainingSocials: Record<string, string> 
} => {
  const links: UnifiedLinkItem[] = [];
  const seen = new Set<string>();
  const usedSocials = new Set<string>();

  rawLinks.forEach((item, idx) => {
    if (!item) return;
    
    const objektsCount = item.objekts?.length || 0;
    const key = normalizeKey(item.id, item.platform, item.url, item.content, objektsCount);
    if (seen.has(key)) return;
    
    const type = normalizeType(item.type, item.url, item.objekts);
    
    if (type === 'text') {
      if (!item.content?.trim()) return;
      
      const textItem: UnifiedLinkItem = {
        id: item.id || `text-${idx}`,
        type: 'text',
        title: item.title || '',
        content: item.content,
        order: item.order ?? idx,
      };
      links.push(textItem);
      console.log('📝 處理文字方塊:', textItem);
    } else if (type === 'objekt') {
      if (!item.objekts || item.objekts.length === 0) return;
      
      const cleanedObjekts = cleanObjektArray(item.objekts);
      if (cleanedObjekts.length === 0) {
        console.warn('⚠️ Objekt 項目包含無效的 NFT 資料:', item);
        return;
      }
      
      const objektItem: UnifiedLinkItem = {
        id: item.id || `objekt-${idx}`,
        type: 'objekt',
        objekts: cleanedObjekts,
        title: item.title || `${cleanedObjekts.length} 個 Objekt NFT`,
        order: item.order ?? idx,
      };
      links.push(objektItem);
      console.log('🎴 處理 Objekt NFT:', {
        id: objektItem.id,
        title: objektItem.title,
        objektsCount: cleanedObjekts.length,
        originalCount: item.objekts.length,
      });
    } else {
      // 連結項目
      if (!item.url?.trim()) return;
      
      const linkItem: UnifiedLinkItem = {
        id: item.id || `link-${idx}`,
        type: type as LinkType,
        platform: item.platform || '',
        url: item.url,
        title: item.title || item.platform || '',
        order: item.order ?? idx,
      };
      links.push(linkItem);
      
      if (item.platform && socialLinks[item.platform] === item.url) {
        usedSocials.add(item.platform);
      }
      
      console.log('🔗 處理連結項目:', linkItem);
    }
    
    seen.add(key);
  });

  const remainingSocials: Record<string, string> = {};
  Object.entries(socialLinks).forEach(([platform, url]) => {
    if (!url?.trim()) return;
    
    if (!usedSocials.has(platform)) {
      const key = normalizeKey(undefined, platform, url);
      if (!seen.has(key)) {
        const socialItem: UnifiedLinkItem = {
          id: `social-${platform}-remaining`,
          type: 'social',
          platform,
          url,
          title: platform,
          order: 900,
        };
        links.push(socialItem);
        seen.add(key);
        console.log('👥 處理剩餘社群連結:', socialItem);
      } else {
        remainingSocials[platform] = url;
      }
    }
  });

  const sortedLinks = links.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  console.log('✅ 公開頁面最終處理的連結:', sortedLinks);
  console.log('📊 連結類型分布:', {
    social: sortedLinks.filter(l => ['social', 'youtube', 'spotify', 'custom'].includes(l.type)).length,
    text: sortedLinks.filter(l => l.type === 'text').length,
    objekt: sortedLinks.filter(l => l.type === 'objekt').length,
  });
  console.log('📋 剩餘社群連結:', remainingSocials);
  
  return { 
    links: sortedLinks, 
    remainingSocials 
  };
};

/* ---------- 預設模板 ---------- */
const defaultTemplate: Template = {
  name: 'Default',
  templateEngName: 'default',
  bgImage: '',
  fontFamily: 'Inter, sans-serif',
  color: {
    fontPrimary: '#111827',
    fontSecondary: '#6B7280',
    buttonPrimary: '#3B82F6',
    buttonSecondary: '#60A5FA',
  },
  border: { radius: 8, style: 'solid' },
};

/* ---------- page component --------------------------------------- */
export default function PublicProfilePage() {
  const { siteID } = useParams<{ siteID: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteID) {
      setError('缺少站點 ID');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        console.log('🔍 開始載入公開頁面:', siteID);

        /* profile -------------------------------------------------- */
        const q = query(
          collection(db, 'profiles'),
          where('siteID', '==', siteID),
          limit(1),
        );
        const snap = await getDocs(q);
        
        if (snap.empty) {
          setError('找不到此個人站');
          setLoading(false);
          return;
        }

        const raw = snap.docs[0].data();
        console.log('📁 從 Firestore 載入的原始資料:', raw);

        let processedRawLinks = raw.links || [];
        
        if (Array.isArray(processedRawLinks)) {
          processedRawLinks = processedRawLinks.map((item: RawLinkItem) => {
            if (item && item.type === 'objekt' && item.objekts) {
              return {
                ...item,
                objekts: cleanObjektArray(item.objekts)
              };
            }
            return item;
          });
        }

        const { links, remainingSocials } = buildUnifiedLinkItems(
          processedRawLinks, 
          raw.socialLinks || {}
        );

        const profileData: ProfileData = {
          siteID: raw.siteID || siteID,
          avatarUrl: raw.avatarUrl || '',
          bioTitle: raw.bioTitle || '',
          bio: raw.bio || '',
          introduction: raw.introduction || raw.bio || '',
          socialLinks: remainingSocials,
          links,
        };
        setProfile(profileData);
        console.log('✅ 處理後的 Profile 資料:', profileData);

        /* template ------------------------------------------------- */
        try {
          const templateKey = raw.template || 'default';
          const tplSnap = await getDoc(doc(db, 'templates', templateKey));
          
          if (tplSnap.exists()) {
            setTemplate(tplSnap.data() as Template);
            console.log('🎨 載入的模板:', tplSnap.data());
          } else {
            console.warn('⚠️ 模板不存在，使用預設模板:', templateKey);
            setTemplate(defaultTemplate);
          }
        } catch (tplError) {
          console.error('❌ 載入模板失敗，使用預設模板:', tplError);
          setTemplate(defaultTemplate);
        }

      } catch (err) {
        console.error('❌ 載入 profile 發生錯誤:', err);
        setError('載入資料時發生錯誤');
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
            <div className="mx-3 mt-1 h-6 w-1/2 rounded skeleton animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left" />
            <div className="mt-2 h-4 w-3/4 rounded skeleton animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left" />
            <div className="mt-1 h-4 w-1/2 rounded skeleton animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] bg-left" />
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

  if (error) {
    return (
      <main className="w-full mx-auto">
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <div className="text-6xl">🚫</div>
            <h1 className="text-2xl font-bold text-gray-800">{error}</h1>
            <p className="text-gray-600">請檢查網址是否正確</p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="w-full mx-auto">
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <div className="text-6xl">❓</div>
            <h1 className="text-2xl font-bold text-gray-800">找不到此個人站</h1>
            <p className="text-gray-600">請檢查網址是否正確</p>
          </div>
        </div>
      </main>
    );
  }
  
  if (!template) {
    return (
      <main className="w-full mx-auto">
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <div className="text-6xl">🎨</div>
            <h1 className="text-2xl font-bold text-gray-800">模板載入失敗</h1>
            <p className="text-gray-600">請稍後再試</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full mx-auto">
      <TemplateLayout profile={profile} template={template} />
    </main>
  );
}
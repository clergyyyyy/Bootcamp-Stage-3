'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import MobileDashboard  from '../components/dashboard/DashboardLayoutMobile';
import { LinkType } from '@/types/link';
import type { UnifiedLinkItem, ObjektNFT } from '@/types/unified-link';
import type { Template } from '@/types/Template';

// 原始連結資料的類型（從 Firestore 讀取的格式）
type RawLinkItem = {
  id?: string;
  url?: string;
  platform?: string;
  type?: string;
  title?: string;       // 新增：文字方塊標題
  content?: string;     // 新增：文字方塊內容
  objekts?: ObjektNFT[]; // 新增：Objekt NFT 陣列
  order?: number;       // 新增：排序
};

const ALLOWED_LINK_TYPES = ['youtube','spotify','social','custom'] as const;
const ALLOWED_TEXT_TYPES = ['text'] as const;
const ALLOWED_OBJEKT_TYPES = ['objekt'] as const;
const ALL_ALLOWED_TYPES = [...ALLOWED_LINK_TYPES, ...ALLOWED_TEXT_TYPES, ...ALLOWED_OBJEKT_TYPES] as const;

// 自動偵測連結類型
const autoDetectType = (url: string): LinkType =>
  /youtu\.?be/.test(url)   ? 'youtube'
: /spotify\.com/.test(url) ? 'spotify'
:                            'social';

// 標準化類型
const normalizeType = (raw: unknown, url?: string, objekts?: ObjektNFT[]): 'text' | 'objekt' | LinkType => {
  if (typeof raw === 'string') {
    const lowerType = raw.toLowerCase();
    if ((ALL_ALLOWED_TYPES as readonly string[]).includes(lowerType)) {
      return lowerType as 'text' | 'objekt' | LinkType;
    }
  }
  
  // 如果有 objekts 陣列，則為 objekt 類型
  if (objekts && objekts.length > 0) return 'objekt';
  
  // 如果沒有 URL，可能是文字方塊
  if (!url) return 'text';
  
  return autoDetectType(url);
};

// 生成唯一鍵值
const normalizeKey = (id?: string, plat = '', url = '', content = '', objektsCount = 0) =>
  id || `${plat.trim().toLowerCase()}|${url.trim()}|${content.trim().slice(0, 20)}|objekt:${objektsCount}`;

// 構建統一連結項目列表
const buildUnifiedLinkItems = (
  rawLinks: RawLinkItem[] = [],
  socials: Record<string, string> = {},
): UnifiedLinkItem[] => {
  const list: UnifiedLinkItem[] = [];
  const seen = new Set<string>();

  // 處理新格式的統一連結（包含文字方塊和 Objekt NFT）
  rawLinks.forEach((item, idx) => {
    if (!item) return;
    
    const objektsCount = item.objekts?.length || 0;
    const key = normalizeKey(item.id, item.platform, item.url, item.content, objektsCount);
    if (seen.has(key)) return;
    
    const type = normalizeType(item.type, item.url, item.objekts);
    
    if (type === 'text') {
      // 文字方塊項目
      if (!item.content) return; // 文字方塊必須有內容
      
      const textItem: UnifiedLinkItem = {
        id: item.id || `text-${idx}`,
        type: 'text',
        title: item.title || '',
        content: item.content,
        order: item.order ?? idx,
      };
      list.push(textItem);
    } else if (type === 'objekt') {
      // Objekt NFT 項目
      if (!item.objekts || item.objekts.length === 0) return; // Objekt 必須有 NFT 內容
      
      const objektItem: UnifiedLinkItem = {
        id: item.id || `objekt-${idx}`,
        type: 'objekt',
        objekts: item.objekts,
        title: item.title || `${item.objekts.length} 個 Objekt NFT`,
        order: item.order ?? idx,
      };
      list.push(objektItem);
    } else {
      // 連結項目
      if (!item.url) return; // 連結必須有 URL
      
      const linkItem: UnifiedLinkItem = {
        id: item.id || `link-${idx}`,
        type: type as LinkType,
        platform: item.platform || '',
        url: item.url,
        title: item.title || item.platform || '',
        order: item.order ?? idx,
      };
      list.push(linkItem);
    }
    
    seen.add(key);
  });

  // 處理舊格式的社群連結（向下相容）
  Object.entries(socials).forEach(([platform, url]) => {
    if (!url) return;
    const key = normalizeKey(undefined, platform, url);
    if (seen.has(key)) return;
    
    const socialItem: UnifiedLinkItem = {
      id: `social-${platform}-legacy`,
      type: 'social',
      platform,
      url,
      title: platform,
      order: 999, // 舊格式放到最後
    };
    list.push(socialItem);
    seen.add(key);
  });

  // 按照 order 排序
  return list.sort((a, b) => (a.order || 0) - (b.order || 0));
};

// 驗證 Objekt NFT 資料格式
const validateObjektNFT = (objekt: unknown): objekt is ObjektNFT => {
  if (typeof objekt !== 'object' || objekt === null) return false;

  const o = objekt as Partial<ObjektNFT>;

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
    .map((objekt) => ({
      id: (objekt as ObjektNFT).id,
      name: (objekt as ObjektNFT).name,
      image: (objekt as ObjektNFT).image,
    }));
};


/* ---------------------------------------------------------- */

export default function DashboardPage() {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bioTitle,  setBioTitle]  = useState('');
  const [bio,       setBio]       = useState('');
  const [links,     setLinks]     = useState<UnifiedLinkItem[]>([]);  // 改為 UnifiedLinkItem
  const [loading,   setLoading]   = useState(true);
  const [siteID,    setSiteID]    = useState('');
  const [template,  setTemplate]  = useState<Template | null>(null);

  useEffect(() => {
    const un = onAuthStateChanged(auth, async (user) => {
      if (!user) { 
        router.replace('/'); 
        return; 
      }

      try {
        const snap = await getDoc(doc(db, 'profiles', user.uid));
        if (!snap.exists()) { 
          setLoading(false); 
          return; 
        }

        const raw = snap.data();
        console.log('📁 從 Firestore 載入的原始資料:', raw);

        // 提取基本資料
        setAvatarUrl(raw.avatarUrl || '');
        setBioTitle(raw.bioTitle || '');
        setBio(raw.introduction || raw.bio || ''); // 支援兩種欄位名稱
        setSiteID(raw.siteID || '');

const processedRawLinks: RawLinkItem[] = Array.isArray(raw.unifiedLinks)
  ? raw.unifiedLinks.map((item) => {
      if (item.type === 'objekt' && item.objekts) {
        return {
          ...item,
          objekts: cleanObjektArray(item.objekts),
        };
      }
      return item;
    })
  : [];

const unifiedLinks = buildUnifiedLinkItems(
  processedRawLinks,
  raw.socialLinks || {}
);


console.log('✅ unifiedLinks:', unifiedLinks);

setLinks(unifiedLinks);


        // 載入模板
        if (raw.template) {
          const tplSnap = await getDoc(doc(db, 'templates', raw.template));
          if (tplSnap.exists()) {
            setTemplate(tplSnap.data() as Template);
            console.log('🎨 載入的模板:', tplSnap.data());
          }
        }
        

      } catch (error) {
        console.error('❌ 載入用戶資料失敗:', error);
        
        if (error instanceof Error) {
          console.error('錯誤詳情:', error.message);
        }
      } finally {
        setLoading(false);
      }
    });
    
    return un;
  }, [router]);

  // Debug: 監控 links 狀態變化
  useEffect(() => {
    if (links.length > 0) {
      console.log('📊 當前 links 狀態:', links);
      console.log('📊 Links 類型分布:', {
        social: links.filter(l => ['social', 'youtube', 'spotify', 'custom'].includes(l.type)).length,
        text: links.filter(l => l.type === 'text').length,
        objekt: links.filter(l => l.type === 'objekt').length,
      });
    }
  }, [links]);

  

  return (
    <>
      {/* Desktop 版本 */}
      <div className="hidden lg:block h-screen">
        <DashboardLayout
          avatarUrl={avatarUrl}   
          setAvatarUrl={setAvatarUrl}
          bioTitle={bioTitle}     
          setBioTitle={setBioTitle}
          bio={bio}               
          setBio={setBio}
          links={links}           
          setLinks={setLinks}
          siteID={siteID}
          template={template}
          loading={loading}
        />
      </div>
      
      {/* Mobile 版本 */}
      <div className="block lg:hidden h-screen">
        <MobileDashboard
          avatarUrl={avatarUrl}   
          setAvatarUrl={setAvatarUrl}
          bioTitle={bioTitle}     
          setBioTitle={setBioTitle}
          bio={bio}               
          setBio={setBio}
          links={links}           
          setLinks={setLinks}
          siteID={siteID}
          template={template}
          loading={loading}
        />
      </div>
    </>
  );
}
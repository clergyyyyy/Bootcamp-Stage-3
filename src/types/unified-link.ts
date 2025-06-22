// Objekt NFT 介面定義
export interface ObjektNFT {
  id: string;
  name: string;
  image: string;
}

// 給共用的 discriminated union
export type UnifiedLinkItem =
  | {
      id: string;
      type: 'social' | 'youtube' | 'spotify' | 'custom';
      platform?: string;
      title?: string;
      url: string;
      order: number;
    }
  | {
      id: string;
      type: 'text';
      content: string;
      title?: string;
      order: number;
    }
  | {
      id: string;
      type: 'objekt';
      objekts: ObjektNFT[];
      title?: string;
      order: number;
    };

// （可選）共用工具
export const socials = ['Instagram', 'Threads', 'Facebook', 'LINE', 'TikTok', 'X', 'Shopee', 'GitHub'] as const;

// Type guards for better type safety
export const isObjektItem = (item: UnifiedLinkItem): item is Extract<UnifiedLinkItem, { type: 'objekt' }> => {
  return item.type === 'objekt';
};

export const isTextItem = (item: UnifiedLinkItem): item is Extract<UnifiedLinkItem, { type: 'text' }> => {
  return item.type === 'text';
};

export const isLinkItem = (item: UnifiedLinkItem): item is Extract<UnifiedLinkItem, { type: 'social' | 'youtube' | 'spotify' | 'custom' }> => {
  return ['social', 'youtube', 'spotify', 'custom'].includes(item.type);
};
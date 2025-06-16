export type LinkType = 'social' | 'youtube' | 'spotify' | 'custom';

export interface LinkItem {
  id: string;
  url: string;
  type: LinkType;          // 必填
  platform?: string;       // social 專用
  title?: string;          // custom 專用
  order?: number;          // 排序用
}
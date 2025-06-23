export type LinkType = 'social' | 'youtube' | 'spotify' | 'custom';

export interface LinkItem {
  id: string;
  url: string;
  type: LinkType;
  platform?: string;
  title?: string;
  order?: number;
}
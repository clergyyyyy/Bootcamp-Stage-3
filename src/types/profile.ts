import { TextBlockItem } from './textblock';
import { UnifiedLinkItem } from './unified-link';

export interface Profile {
  avatarUrl: string;
  bioTitle: string;
  introduction: string;
  links: UnifiedLinkItem[];
  siteID: string;
  templateKey?: string;
  socialLinks?: Record<string, string>;
  textBlocks?: TextBlockItem[];
}
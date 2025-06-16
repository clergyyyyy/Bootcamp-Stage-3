import { LinkItem } from './link';

export interface Profile {
  avatarUrl: string;
  bioTitle: string;
  introduction: string;
  links: LinkItem[];
  siteID: string;
  templateKey?: string;
  socialLinks?: Record<string, string>;
}
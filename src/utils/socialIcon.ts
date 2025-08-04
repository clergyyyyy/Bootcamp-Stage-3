export const socialIcon: Record<string, string> = {
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

export const getSocialIcon = (platform: string): string | null => {
  return socialIcon[platform] || null;
};

export const hasSocialIcon = (platform: string): boolean => {
  return platform in socialIcon;
};
import { Template } from '@/types/Template';

export const templates: Record<string, Template> = {
  default: {
    name: '第一個模板',
    templateEngName: 'default',
    bgImage: '/templates/black_01.jpg',
    fontFamily: 'Arial, sans-serif',
    color: {
      buttonPrimary: '#3B82F6', // 藍色
      buttonSecondary: '#9CA3AF', // 灰色
      fontPrimary: '#1F2937', // 深灰
      fontSecondary: '#6B7280', // 淺灰
    },
    border: {
      style: 'solid',
      radius: 8,
    },
  },

  neon: {
    name: '第二個模板',
    templateEngName: 'neon',
    bgImage: '/templates/gradient_01.jpg',
    fontFamily: '"Orbitron", sans-serif',
    color: {
      buttonPrimary: '#D946EF', // 紫粉
      buttonSecondary: '#7C3AED', // 紫色
      fontPrimary: '#FAFAFA', // 白色
      fontSecondary: '#E5E5E5',
    },
    border: {
      style: 'dashed',
      radius: 16,
    },
  },

  pastel: {
    name: '第三個模板',
    templateEngName: 'pastel',
    bgImage: '/images/pastel-bg.jpg',
    fontFamily: '"Comic Sans MS", cursive',
    color: {
      buttonPrimary: '#F9A8D4', // 粉紅
      buttonSecondary: '#FCD34D', // 黃色
      fontPrimary: '#374151',
      fontSecondary: '#6B7280',
    },
    border: {
      style: 'solid',
      radius: 12,
    },
  },
};

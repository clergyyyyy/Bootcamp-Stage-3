'use client';

import React from 'react';
import type { FormData } from './OnboardingLayout';
import Image from 'next/image';

type Props = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onNext: () => void;
  onBack: () => void;
};

const platformMeta = {
  Instagram: { icon: '/icons/instagram.svg' },
  Threads:   { icon: '/icons/threads.svg'   },
  Facebook:  { icon: '/icons/facebook.svg'  },
  LINE:      { icon: '/icons/line.svg'      },
  TikTok:    { icon: '/icons/tiktok.svg'    },
  X:         { icon: '/icons/x.svg'         },
  Shopee:    { icon: '/icons/shopee.svg'    },
} as const;

export default function StepInputLink({
  formData,
  setFormData,
  onNext,
  onBack,
}: Props) {
  const handleChange = (platform: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: url },
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">填入各平台連結</h1>

      {formData.socialPlatforms.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          尚未選擇任何平台，請返回上一步
        </p>
      )}

      <div className="space-y-4">
        {formData.socialPlatforms.map((platform) => (
      <div
        key={platform}
        className="flex items-center gap-3 p-3 
                  rounded-[0.5rem] m-0"
      >
        <div className="relative h-8 w-8">
          <Image
            src={platformMeta[platform as keyof typeof platformMeta].icon}
            alt={platform}
            fill
            sizes="32px"
            className="object-contain"
          />
        </div>
            <span className="w-24">{platform}</span>
            <input
              type="url"
              placeholder="https://"
              value={formData.socialLinks[platform] || ''}
              onChange={(e) => handleChange(platform, e.target.value)}
              className="flex-1 border px-2 py-1 rounded"
              required
            />
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white shadow-md px-6 py-4 z-50">
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            上一步
          </button>
          <button
            type="button"
            onClick={onNext}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            下一步
          </button>
        </div>
      </div>
    </div>
  );
}

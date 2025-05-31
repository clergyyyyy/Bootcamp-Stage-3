'use client';

import React from 'react';
import type { FormData } from './OnboardingLayout';
import Image from 'next/image';

type StepChoosePlatformProps = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onNext: () => void;
  onBack: () => void;
};

const platforms = [
  { name: 'Instagram', icon: '/icons/instagram.svg' },
  { name: 'Threads',   icon: '/icons/threads.svg'   },
  { name: 'Facebook',  icon: '/icons/facebook.svg'  },
  { name: 'LINE',      icon: '/icons/line.svg'      },
  { name: 'TikTok',    icon: '/icons/tiktok.svg'    },
  { name: 'X',         icon: '/icons/x.svg'         },
  { name: 'Shopee',    icon: '/icons/shopee.svg'    },
];

export default function StepChoosePlatform({
  formData,
  setFormData,
  onNext,
  onBack,
}: StepChoosePlatformProps) {

  const togglePlatform = (name: string) => {
    setFormData((prev: FormData) => {
      const current = prev.socialPlatforms;
      const updated = current.includes(name)
        ? current.filter((n: string) => n !== name)
        : [...current, name];

      return { ...prev, socialPlatforms: updated };
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">選擇你要連結的社交平台</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center">
        {platforms.map(({ name, icon }) => (
          <button
            key={name}
            type="button"
            onClick={() => togglePlatform(name)}
            className={`flex flex-col items-center p-3 border rounded-md w-32 h-32 hover:scale-105 transition ${
              formData.socialPlatforms.includes(name)
                ? 'border-gray-500 bg-gray-300'
                : 'border-gray-300'
            }`}
          >
          <div className="relative h-12 w-12 mb-2">
            <Image
              src={icon}
              alt={name}
              fill
              sizes="48px"
              className="object-contain"
            />
          </div>
            <span className="!text-black text-sm font-medium">{name}</span>
          </button>
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

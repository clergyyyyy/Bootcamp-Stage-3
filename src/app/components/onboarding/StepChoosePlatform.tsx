'use client';

import type { FormData } from './OnboardingLayout';
import { forwardRef, useImperativeHandle, useState } from 'react';
import Image from 'next/image';

export type StepChoosePlatformHandle = {
  submit: () => void;
};

type StepChoosePlatformProps = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onNext: () => void;
  onBack: () => void;
};

const platforms = [
  { name: 'Instagram', icon: '/icons/Instagram.svg' },
  { name: 'Threads',   icon: '/icons/threads.svg'   },
  { name: 'Facebook',  icon: '/icons/facebook.svg'  },
  { name: 'LINE',      icon: '/icons/line.svg'      },
  { name: 'TikTok',    icon: '/icons/tiktok.svg'    },
  { name: 'X',         icon: '/icons/x.svg'         },
  { name: 'Shopee',    icon: '/icons/shopee.svg'    },
];

const StepChoosePlatform = forwardRef<StepChoosePlatformHandle, StepChoosePlatformProps>(
  ({ formData, setFormData, onNext }, ref) => {
    const [error, setError] = useState('');
    StepChoosePlatform.displayName = "StepChoosePlatform";

    const togglePlatform = (name: string) => {
      setFormData((prev) => {
        const current = prev.socialPlatforms;
        const updated = current.includes(name)
          ? current.filter((n) => n !== name)
          : [...current, name];
        return { ...prev, socialPlatforms: updated };
      });
    };

    useImperativeHandle(ref, () => ({
      submit: () => {
        if (formData.socialPlatforms.length === 0) {
          setError('請至少選擇一個平台');
          return;
        }
        setError('');
        onNext();
      },
    }));

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Choose the Platform You Own</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center">
          {platforms.map(({ name, icon }) => (
            <button
              key={name}
              type="button"
              onClick={() => togglePlatform(name)}
              className={`flex flex-col items-center justify-center p-3 border rounded-md w-32 h-32 hover:scale-105 transition ${
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
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  }
);

export default StepChoosePlatform;
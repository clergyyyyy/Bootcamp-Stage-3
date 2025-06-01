'use client';

import React, { useState, useEffect } from 'react';
import type { FormData } from './OnboardingLayout';
import Image from 'next/image';
import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

type Props = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
};

const platformMeta = {
  Instagram: { icon: '/icons/instagram.svg' },
  Threads: { icon: '/icons/threads.svg' },
  Facebook: { icon: '/icons/facebook.svg' },
  LINE: { icon: '/icons/line.svg' },
  TikTok: { icon: '/icons/tiktok.svg' },
  X: { icon: '/icons/x.svg' },
  Shopee: { icon: '/icons/shopee.svg' },
} as const;

// URL 檢核函數 (與 SortableLinkList 相同)
const validateUrl = (url: string, platform: string): { isValid: boolean; message?: string; suggestion?: string } => {
  if (!url.trim()) {
    return { isValid: true }; // 在 onboarding 中允許空值
  }

  // 基本 URL 格式檢查
  const urlPattern = /^https?:\/\/.+\..+/;
  if (!urlPattern.test(url)) {
    const suggestion = url.startsWith('http') ? url : `https://${url}`;
    return { isValid: false, message: '請輸入完整網址', suggestion };
  }

  // 平台特定檢核
  const platformChecks: Record<string, RegExp> = {
    Instagram: /instagram\.com\//,
    TikTok: /tiktok\.com\/|douyin\.com\//,
    Facebook: /facebook\.com\/|fb\.com\//,
    X: /x\.com\/|twitter\.com\//,
    LINE: /line\.me\//,
    Shopee: /shopee\./,
    Threads: /threads\.net\//,
  };

  const platformRegex = platformChecks[platform];
  if (platformRegex && !platformRegex.test(url)) {
    return { isValid: false, message: `這似乎不是 ${platform} 的網址` };
  }

  return { isValid: true };
};

export default function StepInputLink({
  formData,
  setFormData,
}: Props) {
  // 儲存每個平台的驗證狀態
  const [validationStates, setValidationStates] = useState<Record<string, { isValid: boolean; message?: string; suggestion?: string }>>({});

  // 初始化驗證狀態
  useEffect(() => {
    const initialStates: Record<string, { isValid: boolean; message?: string; suggestion?: string }> = {};
    formData.socialPlatforms.forEach(platform => {
      const url = formData.socialLinks[platform] || '';
      initialStates[platform] = validateUrl(url, platform);
    });
    setValidationStates(initialStates);
  }, [formData.socialPlatforms, formData.socialLinks]);

  const handleChange = (platform: string, url: string) => {
    // 更新表單資料
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: url },
    }));

    // 檢核 URL 並更新驗證狀態
    const validation = validateUrl(url, platform);
    setValidationStates(prev => ({
      ...prev,
      [platform]: validation
    }));
  };

  const applySuggestion = (platform: string) => {
    const suggestion = validationStates[platform]?.suggestion;
    if (suggestion) {
      handleChange(platform, suggestion);
    }
  };

  const getPlatformPlaceholder = (platform: string) => {
  const lower = platform.toLowerCase();
  if (lower === 'x') return 'https://x.com/yourname';
  if (lower === 'threads') return 'https://www.threads.net/yourname';
  if (lower === 'line') return 'https://page.line.me/yourname';
  if (lower === 'shopee') return 'https://shopee.tw/yourname';
  if (lower === 'tiktok') return 'https://www.tiktok.com/@yourname';
  return `https://${lower}.com/yourname`;
};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fill in Your Link for Each Platform</h1>
        
        {formData.socialPlatforms.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
            Did not choose any platform yet, please head back to the previous step
          </div>
        )}
        
        <div className="space-y-4">
          {formData.socialPlatforms.map((platform) => {
            const validation = validationStates[platform] || { isValid: true };
            const currentUrl = formData.socialLinks[platform] || '';
            
            return (
              <div key={platform} className="space-y-2">
                <div className={`flex items-center gap-3 border px-4 py-3 rounded-lg transition-all duration-200 ${
                  !validation.isValid ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                }`}>
                  <Image
                    src={platformMeta[platform as keyof typeof platformMeta]?.icon}
                    alt={platform}
                    width={24}
                    height={24}
                  />
                  <div className="font-medium w-20 text-sm">{platform}</div>
                  
                  <div className="flex-1 relative">
                    <input
                      type="url"
                      placeholder={getPlatformPlaceholder(platform)}
                      value={currentUrl}
                      onChange={(e) => handleChange(platform, e.target.value)}
                      className={`w-full border px-3 py-2 rounded focus:ring-2 transition-all duration-200 ${
                        validation.isValid 
                          ? 'focus:ring-blue-500 focus:border-blue-500 border-gray-300' 
                          : 'focus:ring-red-500 focus:border-red-500 border-red-300'
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      {currentUrl && (
                        <>
                          {validation.isValid ? (
                            <>
                              <CheckCircle size={16} className="text-green-500" />
                              <a
                                href={currentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink size={14} />
                              </a>
                            </>
                          ) : (
                            <AlertCircle size={16} className="text-red-500" />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 錯誤訊息和建議 */}
                {!validation.isValid && currentUrl && (
                  <div className="ml-11 text-sm text-red-600">
                    <p>{validation.message}</p>
                    {validation.suggestion && (
                      <button
                        onClick={() => applySuggestion(platform)}
                        className="text-blue-600 hover:underline mt-1"
                      >
                        建議：{validation.suggestion}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
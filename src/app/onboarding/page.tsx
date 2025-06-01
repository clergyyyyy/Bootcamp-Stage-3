'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import OnboardingLayout from '@/app/components/onboarding/OnboardingLayout';

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 監聽認證狀態變化
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 用戶已登入
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        // 用戶未登入，導向首頁
        router.replace('/');
      }
    });

    // 清理監聽器
    return () => unsubscribe();
  }, [router]);

  // 顯示載入狀態
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Check Login Status...</p>
        </div>
      </div>
    );
  }

  // 只有在確認已登入時才渲染 OnboardingLayout
  return isAuthenticated ? <OnboardingLayout /> : null;
}
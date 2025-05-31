'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import OnboardingLayout from '@/app/components/onboarding/OnboardingLayout';

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.replace('/'); // ❗取代導向，防止返回
    }
  }, [router]);

  return <OnboardingLayout />;
}

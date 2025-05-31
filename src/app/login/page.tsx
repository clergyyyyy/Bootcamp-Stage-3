'use client';

import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';

function NavigationBar() {
  return (
    <div className="absolute top-4 left-4 w-[120px] h-[40px]">
      <Image
        src="/logo.svg"
        alt="FanLink Logo"
        fill
        sizes="120px"
        className="object-contain"
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, 'profiles', user.uid));
      if (userDoc.exists()) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (error) {
      console.error('登入錯誤', error);
    }
  };

  return (
    <div className="w-full h-screen flex relative">
      <NavigationBar />

      {/* 左側：登入表單 */}
      <div className="w-1/2 flex items-center justify-center max-[800px]:w-full">
        <section className="w-full max-w-md p-8 space-y-6">
          <h1 className="text-2xl font-bold text-center">Log into your FanLink</h1>

          <div className="space-y-2">
            <input
              type="text"
              disabled
              placeholder="Email or username"
              className="w-full px-4 py-2 border rounded bg-gray-100 text-gray-500 cursor-not-allowed"
            />

            <button
              disabled
              className="w-full px-4 py-2 rounded bg-gray-300 text-white cursor-not-allowed"
            >
              Continue
            </button>
          </div>

          <div className="text-center text-sm text-gray-400">OR</div>

          <button
            onClick={handleLogin}
            className="w-full px-4 py-2 rounded bg-blue-500 text-white transition hover:bg-blue-600"
          >
            使用 Google 登入
          </button>

          <div className="flex flex-col items-center space-y-1 text-sm text-gray-500 mt-4">
            <span>Forgot password?</span>
            <span>Forgot username?</span>
            <span>
              Don&apos;t have an account? <span className="underline cursor-pointer">Sign up</span>
            </span>
          </div>
        </section>
      </div>

      {/* 右側圖像 */}
      <div className="w-1/2 h-full max-[800px]:hidden relative">
        <Image
          src="/Login.jpg"
          alt="FanLink Login"
          fill
          sizes="(max-width: 800px) 100vw, 800px"
          className="h-full object-cover"
        />
      </div>
    </div>
  );
}

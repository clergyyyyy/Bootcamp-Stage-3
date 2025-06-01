'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { setDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

import StepChooseUsername, {StepChooseUsernameHandle}  from './StepChooseUsername';
import StepChooseTemplate, { StepChooseTemplateHandle } from './StepChooseTemplate';
import type { StepChoosePlatformHandle } from './StepChoosePlatform';
import StepChoosePlatform  from './StepChoosePlatform';
import StepInputLink       from './StepInputLink';
import StepInputSelfIntro  from './StepInputSelfIntro';

/* ---------- 基本設定 ---------- */
const steps = [
  'ChooseUsername',
  'ChooseTemplate',
  'ChoosePlatform',
  'InputLink',
  'InputSelfIntro',
] as const;

export type FormData = {
  siteID: string;
  template: string;
  socialPlatforms: string[];
  socialLinks: Record<string, string>;
  avatarUrl: string;
  bioTitle: string;
  bio: string;
};

export default function OnboardingLayout() {
  const router = useRouter();
  /* ---------- state ---------- */
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData]   = useState<FormData>({
    siteID: '',
    template: '',
    socialPlatforms: [],
    socialLinks: {},
    avatarUrl: '',
    bioTitle: '',
    bio: '',
  });


  const usernameRef = useRef<StepChooseUsernameHandle>(null);
  const templateRef = useRef<StepChooseTemplateHandle>(null);
  const platformRef = useRef<StepChoosePlatformHandle>(null);
  const currentStep        = steps[stepIndex];
  const progressPercentage = ((stepIndex + 1) / steps.length) * 100;

  /* ---------- 公用函式 ---------- */
  const goNext = () => {
    if (currentStep === 'ChooseTemplate') {
      const valid = templateRef.current?.validate();
      if (!valid) return;
    }

    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    }
  };
  const goBack = () => stepIndex > 0 && setStepIndex((i) => i - 1);
  const updateForm = (d: Partial<FormData>) => setFormData((prev) => ({ ...prev, ...d }));

  /* ---------- Framer-motion 變化 ---------- */
  const variants = {
    enter:  (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    center: ()            => ({ x: 0, opacity: 1 }),
    exit:   (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0 }),
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 進度條+步驟 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          {/* 文字進度 */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-600">
              Step {stepIndex + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>

          {/* 動態進度條 */}
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

        </div>
      </div>

      {/* ------- 主要內容：用 AnimatePresence 包住 ------- */}
      <div className="flex-1 px-6 py-2 overflow-y-auto overflow-x-hidden pb-48">
        <div className="max-w-2xl mx-auto relative">
          <AnimatePresence custom={1}>
            <motion.div
              key={currentStep}
              custom={1}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              {/* === 個別步驟元件 === */}
              {currentStep === 'ChooseUsername' && (
                <StepChooseUsername
                  ref={usernameRef}
                  formData={formData}
                  updateForm={updateForm}
                  onNext={goNext}
                />
              )}

              {currentStep === 'ChooseTemplate' && (
                <StepChooseTemplate
                  ref={templateRef}
                  formData={formData}
                  updateForm={updateForm}
                />
              )}

              {currentStep === 'ChoosePlatform' && (
                <StepChoosePlatform
                  ref={platformRef}
                  formData={formData}
                  setFormData={setFormData}
                  onNext={goNext}
                  onBack={goBack}
                />
              )}

              {currentStep === 'InputLink' && (
                <StepInputLink
                  formData={formData}
                  setFormData={setFormData}
                />
              )}

              {currentStep === 'InputSelfIntro' && (
                <StepInputSelfIntro
                  formData={formData}
                  setFormData={setFormData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ------- 底部導覽按鈕 ------- */}
      <div className="fixed left-0 bottom-0 w-full bg-white border-t border-gray-200 px-6 py-4 z-20">
        <div className="max-w-2xl mx-auto flex justify-between">
          {/* 上一步 */}
          <button
            onClick={goBack}
            disabled={stepIndex === 0}
            className={`px-6 py-2 border rounded-lg font-medium transition ${
              stepIndex === 0
                ? 'text-gray-400 cursor-not-allowed bg-gray'
                : 'text-gray-700 bg-gray-300 hover:bg-gray-400'
            }`}
          >
            ← Previous
          </button>

        {/* 下一步 / 完成 */}
        <button
          onClick={async () => {
            if (currentStep === 'ChooseUsername') {
              usernameRef.current?.submit();
            } else if (currentStep === 'ChooseTemplate') {
              const valid = templateRef.current?.validate();
              if (valid) goNext();
            } else if (currentStep === 'ChoosePlatform') {
              platformRef.current?.submit();
            } else if (stepIndex === steps.length - 1) {
              // ✅ Final Submission
              const user = auth.currentUser;
              if (!user) {
                alert('請先登入');
                return;
              }
              try {
                await setDoc(doc(db, 'profiles', user.uid), formData, { merge: true });
                router.push(`/complete?uid=${user.uid}`);
              } catch (err) {
                console.error('提交失敗', err);
                alert('無法提交，請稍後再試');
              }
            } else {
              goNext();
            }
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
        >
          {stepIndex === steps.length - 1 ? 'Complete' : 'Next →'}
        </button>


        </div>
      </div>
    </div>
  );
}

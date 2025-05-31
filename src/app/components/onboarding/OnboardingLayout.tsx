'use client';

import { useState } from 'react';
import StepChooseUsername from './StepChooseUsername';
import StepChooseTemplate from './StepChooseTemplate';
import StepChoosePlatform from './StepChoosePlatform';
import StepInputLink from './StepInputLink';
import StepInputSelfIntro from './StepInputSelfIntro';

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
    avatarUrl: string;      // 新增：大頭貼
    bioTitle: string;       // 新增：Bio 標題
    bio: string;            // 新增：Bio 內容（<=80字）
}

export default function OnboardingLayout() {
    // 記錄目前在哪一個步驟（索引）
    const [stepIndex, setStepIndex] = useState(0);

    const [formData, setFormData] = useState<FormData>({
        siteID: '',
        template: '',
        socialPlatforms: [],
        socialLinks: {},
        avatarUrl: '',
        bioTitle: '',
        bio: '',
    });

    const currentStep = steps[stepIndex];

    const goNext = () => {
        if (stepIndex < steps.length - 1) {
            setStepIndex((prev) => prev + 1);
        }
    };

    const goBack = () => {
        if (stepIndex > 0) {
            setStepIndex((prev) => prev-1);
        }
    };

    const updateForm = (newData: Partial<FormData>) => {
        setFormData((prev) => ({...prev, ...newData}));
    };

return (
  <div className="p-6 max-w-xl mx-auto">
    {/* 顯示目前步驟 */}
    <div className="mb-4 text-sm text-gray-500">
      Step {stepIndex + 1} of {steps.length}
    </div>

    {/* 渲染步驟畫面（stepIndex決定） */}
    {currentStep === 'ChooseUsername' && (
      <StepChooseUsername
        formData={formData}
        updateForm={updateForm}
        onNext={() => {
          if (stepIndex < steps.length - 1) {
            setStepIndex((prev) => prev + 1);
          }
        }}
      />
    )}

    {currentStep === 'ChooseTemplate' && (
      <StepChooseTemplate
        formData={formData}
        updateForm={updateForm}
        onNext={() => {
          if (stepIndex < steps.length - 1) {
            setStepIndex((prev) => prev + 1);
          }
        }}
        onBack={() => {
          if (stepIndex > 0) {
            setStepIndex((prev) => prev - 1);
          }
        }}
      />
    )}

  {currentStep === 'ChoosePlatform' && (
    <StepChoosePlatform
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
    onNext={goNext}
    onBack={goBack}
  />
)}

{currentStep === 'InputSelfIntro' && (
  <StepInputSelfIntro
    formData={formData}
    setFormData={setFormData}
    onBack={goBack}
  />
)}

    {/* 最後一步 */}
    {/* 
    {currentStep === 'FinalSubmit' && (
      <StepFinalSubmit
        formData={formData}
        onBack={() => {
          if (stepIndex > 0) {
            setStepIndex((prev) => prev - 1);
          }
        }}
      />
    )}
    */}
  </div>
);
}
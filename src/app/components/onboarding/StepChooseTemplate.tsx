'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';

type Props = {
  formData: { template: string };
  updateForm: (data: Partial<{ template: string }>) => void;
};

export type StepChooseTemplateHandle = {
  validate: () => boolean;
};

const templateOptions = [
  { id: 'minimal', name: 'Minimal' },
  { id: 'colorful', name: 'Colorful' },
  { id: 'dark', name: 'Dark' },
];

const StepChooseTemplate = forwardRef<StepChooseTemplateHandle, Props>(
  ({ formData, updateForm }, ref) => {
    const [error, setError] = useState('');
    StepChooseTemplate.displayName = "StepChooseTemplate";

    useImperativeHandle(ref, () => ({
      validate: () => {
        if (!formData.template) {
          setError('請先選擇一個模板');
          return false;
        }
        setError('');
        return true;
      },
    }));

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Choose Your Template Style</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {templateOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => updateForm({ template: option.id })}
              className={`border rounded-md overflow-hidden text-left transition ${
                formData.template === option.id
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Image
                src={`/templates_preview/${option.id}.jpg`}
                alt={`${option.name} template`}
                width={400}
                height={250}
                className="w-full object-cover"
              />
              <div className="p-3 font-medium text-center text-gray-800">
                {option.name}
              </div>
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  }
);

StepChooseTemplate.displayName = 'StepChooseTemplate';
export default StepChooseTemplate;

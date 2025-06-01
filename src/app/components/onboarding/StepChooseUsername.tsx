// StepChooseUsername.tsx
'use client';

import {
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { getDocs, query, where, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

type Props = {
  formData: { siteID: string };
  updateForm: (data: Partial<{ siteID: string }>) => void;
  onNext: () => void;
};

export type StepChooseUsernameHandle = {
  submit: () => Promise<void>;
};

const StepChooseUsername = forwardRef<StepChooseUsernameHandle, Props>(
  ({ formData, updateForm, onNext }, ref) => {
    const [error, setError] = useState('');
    StepChooseUsername.displayName = "StepChooseUsername";

    useImperativeHandle(ref, () => ({
      async submit() {
        const siteID = formData.siteID.trim();

        if (!siteID) {
          setError('請填寫 Site ID');
          return;
        }

        const q = query(collection(db, 'profiles'), where('siteID', '==', siteID));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setError('此 Site ID 已被使用，請換一個');
          return;
        }

        setError('');
        onNext();
      },
    }));

    return (
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <h1 className="text-2xl font-bold text-black">Create FanLink Site ID</h1>
        <div className="flex w-full h-full rounded-md object-fit">
          <Image
            src="/onboard-pic.png"
            alt="onboarding.1"
            width={600}
            height={300}
          />
        </div>
        <h3 className="text-l !text-gray-600">
          FanLink site ID represents your personal website address.
        </h3>
        <div className="flex items-center w-full">
          <span className="whitespace-nowrap text-gray-500 text-sm pr-2">
            https://fanlink-demo.vercel.app/
          </span>
          <input
            className="flex-1 border px-2 py-1 rounded"
            placeholder="Site ID"
            value={formData.siteID}
            onChange={(e) => updateForm({ siteID: e.target.value })}
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
    );
  }
);

export default StepChooseUsername;

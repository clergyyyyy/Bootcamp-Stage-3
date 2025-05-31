'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Template } from '@/types/Template';

export function useTemplates() {
  const [templates, setTemplates] = useState<Record<string, Template>>({});

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'templates'));
      const data: Record<string, Template> = {};
      snap.forEach((doc) => (data[doc.id] = doc.data() as Template));
      setTemplates(data);
    })();
  }, []);

  return templates;
}

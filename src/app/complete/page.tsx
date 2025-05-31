import { Suspense } from 'react';
import CompleteContent from './CompleteContent';

export default function CompletePage() {
  return (
    <Suspense fallback={<p className="p-6">載入中…</p>}>
      <CompleteContent />
    </Suspense>
  );
}

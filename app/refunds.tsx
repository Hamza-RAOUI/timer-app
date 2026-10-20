import { LegalPage } from '@/src/components/legal/LegalPage';
import { REFUNDS } from '@/src/content/legal';
import React from 'react';

export default function RefundsPage() {
  return <LegalPage doc={REFUNDS} />;
}

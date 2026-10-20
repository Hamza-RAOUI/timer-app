import { LegalPage } from '@/src/components/legal/LegalPage';
import { LEGAL_NOTICE } from '@/src/content/legal';
import React from 'react';

export default function LegalNoticePage() {
  return <LegalPage doc={LEGAL_NOTICE} />;
}

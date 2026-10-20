import { LegalPage } from '@/src/components/legal/LegalPage';
import { TERMS } from '@/src/content/legal';
import React from 'react';

export default function TermsPage() {
  return <LegalPage doc={TERMS} />;
}

import { LegalPage } from '@/src/components/legal/LegalPage';
import { PRIVACY } from '@/src/content/legal';
import React from 'react';

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} />;
}

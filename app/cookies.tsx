import { LegalPage } from '@/src/components/legal/LegalPage';
import { COOKIES } from '@/src/content/legal';
import React from 'react';

export default function CookiesPage() {
  return <LegalPage doc={COOKIES} />;
}

import React from 'react';
import { DesktopProvider } from '@/context/DesktopContext';
import { Desktop } from '@/components/layout/Desktop';
import { BootSplash } from '@/components/widgets/BootSplash';

export default function Home() {
  return (
    <DesktopProvider>
      <main className="min-h-screen">
        <BootSplash />
        <Desktop />
      </main>
    </DesktopProvider>
  );
}

import React from 'react';
import { DesktopProvider } from '@/context/DesktopContext';
import { Desktop } from '@/components/layout/Desktop';

export default function Home() {
  return (
    <DesktopProvider>
      <main className="min-h-screen">
        <Desktop />
      </main>
    </DesktopProvider>
  );
}

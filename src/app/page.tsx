import React from 'react';
import { DesktopProvider } from '@/features/desktop';
import { Desktop } from '@/features/desktop';
import { BootSplash } from '@/features/desktop';

import { NotificationProvider } from '@/features/notifications';
import { NotificationContainer } from '@/features/notifications';

export default function Home() {
  return (
    <DesktopProvider>
      <NotificationProvider>
        <main className="min-h-screen">
          <BootSplash />
          <NotificationContainer />
          <Desktop />
        </main>
      </NotificationProvider>
    </DesktopProvider>
  );
}

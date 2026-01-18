import React from 'react';
import { DesktopProvider } from '@/context/DesktopContext';
import { Desktop } from '@/components/layout/Desktop';
import { BootSplash } from '@/components/widgets/BootSplash';

import { NotificationProvider } from '@/context/NotificationContext';
import { NotificationContainer } from '@/components/notifications/NotificationContainer';

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

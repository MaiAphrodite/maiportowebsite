import React from 'react';
import { DesktopProvider } from '@/features/desktop';
import { Desktop } from '@/features/desktop';
import { BootSplash } from '@/features/desktop';

import { NotificationProvider } from '@/features/notifications';
import { NotificationContainer } from '@/features/notifications';
import { ChatProvider } from '@/features/chat';
import { AudioAnalyserProvider } from '@/features/portfolio/context/AudioAnalyserContext';

export default function Home() {
  return (
    <DesktopProvider>
      <AudioAnalyserProvider>
        <NotificationProvider>
          <ChatProvider>
            <main className="min-h-screen">
              <BootSplash />
              <NotificationContainer />
              <Desktop />
            </main>
          </ChatProvider>
        </NotificationProvider>
      </AudioAnalyserProvider>
    </DesktopProvider>
  );
}


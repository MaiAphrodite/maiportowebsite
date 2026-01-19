"use client";

import React, { useEffect } from 'react';
import { useDesktopActions, useDesktopState } from '@/features/desktop';
import { useNotifications } from '@/features/notifications';

export const ChatbotWidget = () => {
    const { openWindow } = useDesktopActions();
    const { windows } = useDesktopState();
    const { addNotification } = useNotifications();

    const isWindowOpen = windows.some(w => w.id === 'chat-stream');

    const hasShown = React.useRef(false);

    useEffect(() => {
        if (isWindowOpen || hasShown.current) return;

        // Delay slightly to let boot splash finish
        const timer = setTimeout(() => {
            if (hasShown.current) return; // Double check inside timeout

            addNotification({
                type: 'live',
                title: 'Mai is Live!',
                message: 'Chat & Chill with AI • 1.2k watching',
                image: '/assets/maiveclogo.png',
                duration: 0, // Persistent until closed
                onClick: () => {
                    openWindow({
                        id: 'chat-stream',
                        title: 'Mai Stream - Live',
                        type: 'component',
                        content: 'stream-chat',
                        size: { width: 900, height: 600 }
                    });
                    // Note: We don't remove it here automatically, or maybe we do?
                    // Usually clicking a notification opens the thing and dismisses the notif.
                    // But we don't have the ID easily here as addNotification is synchronous but we are inside callback.
                    // Actually addNotification returns ID. 
                }
            });
            hasShown.current = true;
        }, 2000);

        return () => clearTimeout(timer);
    }, [isWindowOpen, addNotification, openWindow]);

    return null; // Logic only
};

"use client";

import React from 'react';
import { useNotifications } from '@/features/notifications/context/NotificationContext';
import { NotificationToast } from './NotificationToast';
import { useMobile } from '@/shared/hooks/useMobile';
import { AnimatePresence, motion } from 'framer-motion';

export const NotificationContainer = () => {
    const { notifications, removeNotification } = useNotifications();
    const isMobile = useMobile();

    // Limit to 3 notifications
    const visibleNotifications = notifications.slice(-3);

    return (
        <div
            className={`fixed z-[99999] pointer-events-none flex flex-col gap-2 
                ${isMobile
                    ? 'top-12 left-0 right-0 items-center px-4'
                    : 'bottom-20 right-4 items-end'
                }
            `}
        >
            <AnimatePresence>
                {visibleNotifications.map((notif) => (
                    <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: isMobile ? -20 : 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        layout
                        className="w-full max-w-sm"
                    >
                        <NotificationToast notification={notif} onClose={removeNotification} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

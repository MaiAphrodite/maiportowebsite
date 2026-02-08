"use client";

import React from 'react';
import { useNotifications } from '@/features/notifications/context/NotificationContext';
import { NotificationPill } from './NotificationPill';
import { useDesktopState } from '@/features/desktop/context/DesktopContext';
import { AnimatePresence, motion } from 'framer-motion';

export const NotificationContainer = () => {
    const { notifications, removeNotification } = useNotifications();
    const { isBooted } = useDesktopState();

    if (!isBooted) return null;

    return (
        <div
            className={`fixed z-[99999] pointer-events-none flex flex-col justify-end
                bottom-0 left-0 right-0
            `}
        >
            <AnimatePresence>
                {notifications.length > 0 && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0, transition: { duration: 0.2 } }}
                        className="w-full pointer-events-auto"
                    >
                        <NotificationPill notifications={notifications} onClose={removeNotification} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

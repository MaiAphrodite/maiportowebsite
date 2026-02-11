"use client";

import React from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Notification } from '@/features/notifications/context/NotificationContext';

interface NotificationToastProps {
    notification: Notification;
    onClose: (id: string) => void;
}

export const NotificationToast = ({ notification, onClose }: NotificationToastProps) => {
    const { id, type, title, message, image, onClick } = notification;

    const handleClick = () => {
        if (onClick) onClick();
    };

    return (
        <div className="relative group pointer-events-auto">
            <div
                className={`
                    relative w-full max-w-sm shadow-none border-2 border-mai-border 
                    flex items-center gap-4 p-3 transition-transform hover:translate-y-[-2px]
                    bg-rice-panel text-mai-text cursor-pointer rounded-xl
                `}
                style={{ boxShadow: '4px 4px 0px var(--rice-shadow)' }}
                onClick={handleClick}
            >
                {/* Image / Icon */}
                {image && (
                    <div className="relative w-16 h-10 shrink-0">
                        <Image
                            src={image}
                            alt="Notification Icon"
                            fill
                            className="object-contain bg-white border border-mai-border rounded-lg"
                        />
                        {type === 'live' && (
                            <div className="absolute bottom-0.5 right-0.5 bg-red-500 text-white text-[8px] px-1 font-bold border border-mai-border rounded-sm">
                                LIVE
                            </div>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {title && <div className="text-sm font-bold truncate">{title}</div>}
                    {message && <div className="text-xs text-mai-subtext truncate font-mono">{message}</div>}
                </div>

                {/* Close Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose(id);
                    }}
                    className="p-1 rounded-full hover:bg-mai-surface-dim text-mai-subtext hover:text-mai-primary transition-all border border-transparent hover:border-mai-border"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Badges */}
            {type === 'live' && (
                <div className="absolute -top-2 -left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse pointer-events-none border border-white">
                    LIVE
                </div>
            )}
        </div>
    );
};

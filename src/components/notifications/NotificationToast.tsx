"use client";

import React from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Notification } from '@/context/NotificationContext';

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
                    relative w-full max-w-sm rounded-xl shadow-2xl border border-gray-700/50 
                    flex items-center gap-4 p-3 transition-transform hover:scale-[1.02]
                    bg-[#212121] text-white cursor-pointer
                `}
                onClick={handleClick}
            >
                {/* Image / Icon */}
                {image && (
                    <div className="relative w-16 h-10 shrink-0">
                        <Image
                            src={image}
                            alt="Notification Icon"
                            fill
                            className="object-contain bg-black rounded"
                        />
                        {type === 'live' && (
                            <div className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] px-1 rounded-sm font-bold">
                                LIVE
                            </div>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {title && <div className="text-sm font-medium truncate">{title}</div>}
                    {message && <div className="text-xs text-gray-400 truncate">{message}</div>}
                </div>

                {/* Close Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose(id);
                    }}
                    className="p-1 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Badges */}
            {type === 'live' && (
                <div className="absolute -top-2 -left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse pointer-events-none">
                    LIVE
                </div>
            )}
        </div>
    );
};

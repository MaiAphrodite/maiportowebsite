"use client";

import React from 'react';
import Image from 'next/image';
import { useDesktopActions, useDesktopState } from '@/context/DesktopContext';
// import { X } from 'lucide-react'; // Unused

export const ChatbotWidget = () => {
    const { openWindow } = useDesktopActions();
    const { windows } = useDesktopState();
    const isWindowOpen = windows.some(w => w.id === 'chat-stream');

    // If the window is already open (active or minimized), don't show the toast
    if (isWindowOpen) return null;

    const handleOpenStream = () => {
        openWindow({
            id: 'chat-stream',
            title: 'Mai Stream - Live',
            type: 'component',
            content: 'stream-chat',
            size: { width: 900, height: 600 }
        });
    };

    return (
        <div
            className="fixed bottom-4 right-4 z-[8000] cursor-pointer group animate-in slide-in-from-bottom-5 duration-500"
            onClick={handleOpenStream}
        >
            {/* YouTube-style Toast Notification */}
            <div className="bg-[#212121] text-white p-3 rounded-xl shadow-2xl flex items-center gap-4 max-w-sm border border-gray-700/50 hover:bg-[#303030] transition-colors">

                {/* Thumbnail */}
                <div className="relative w-16 h-10 shrink-0">
                    <Image
                        src="/assets/maiveclogo.png"
                        alt="Mai Logo"
                        fill
                        className="object-contain bg-black rounded"
                    />
                    <div className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] px-1 rounded-sm font-bold">
                        LIVE
                    </div>
                </div>

                {/* Text Info */}
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">Mai is Live!</div>
                    <div className="text-xs text-gray-400 truncate">Chat & Chill with AI • 1.2k watching</div>
                </div>

                {/* Close / Action? (Optional, visual only for now) */}
                <div className="text-gray-400 hover:text-white p-1">
                    {/* Just a visual indicator that it's clickable, maybe an arrow or just rely on cursor-pointer */}
                </div>
            </div>

            {/* Red "LIVE" Badge floating attached */}
            <div className="absolute -top-2 -left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse">
                LIVE
            </div>
        </div>
    );
};

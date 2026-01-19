"use client";

import React from 'react';
import { useDesktop } from '@/features/desktop/context/DesktopContext';

export const WindowList = () => {
    const { windows, activeWindowId, openWindow, minimizeWindow } = useDesktop();

    const handleTaskbarItemClick = (id: string, isMinimized: boolean) => {
        if (isMinimized || activeWindowId !== id) {
            openWindow({ id });
        } else {
            minimizeWindow(id);
        }
    };

    return (
        <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-full">
            {windows.map((win) => (
                <button
                    key={win.id}
                    onClick={() => handleTaskbarItemClick(win.id, win.isMinimized)}
                    className={`
                        px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap min-w-fit
                        ${activeWindowId === win.id && !win.isMinimized
                            ? 'bg-mai-surface-dim text-mai-text shadow-sm border border-mai-border'
                            : 'bg-transparent text-mai-subtext hover:bg-mai-surface-dim'}
                    `}
                >
                    <span className="w-2 h-2 rounded-full bg-mai-secondary"></span>
                    {win.title}
                </button>
            ))}
        </div>
    );
};

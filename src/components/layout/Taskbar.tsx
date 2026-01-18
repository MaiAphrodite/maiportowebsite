"use client";

import React from 'react';
import { StartButton } from './taskbar/StartButton';
import { WindowList } from './taskbar/WindowList';
import { SystemTray } from './taskbar/SystemTray';

export const Taskbar = () => {
    return (
        <div className="h-12 md:h-14 w-full bg-mai-surface border-b-4 border-mai-border flex items-center px-2 md:px-4 justify-between fixed top-0 z-[9999]">
            <div className="flex items-center gap-2 md:gap-4">
                <StartButton />
                {/* Hide window list on mobile */}
                <div className="hidden md:block">
                    <WindowList />
                </div>
            </div>
            <SystemTray />
        </div>
    );
};

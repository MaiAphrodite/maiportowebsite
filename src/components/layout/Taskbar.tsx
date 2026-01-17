"use client";

import React from 'react';
import { StartButton } from './taskbar/StartButton';
import { WindowList } from './taskbar/WindowList';
import { SystemTray } from './taskbar/SystemTray';

export const Taskbar = () => {
    return (
        <div className="h-14 w-full bg-mai-surface backdrop-blur-md border-b-4 border-mai-border flex items-center px-4 justify-between fixed top-0 z-[9999]" style={{ top: 0, bottom: 'auto' }}>
            <div className="flex items-center gap-4">
                <StartButton />
                <WindowList />
            </div>
            <SystemTray />
        </div>
    );
};

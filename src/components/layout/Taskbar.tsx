"use client";

import React from 'react';
import { StartButton } from './taskbar/StartButton';
import { WindowList } from './taskbar/WindowList';
import { SystemTray } from './taskbar/SystemTray';
import { useDesktop } from '@/context/DesktopContext';

export const Taskbar = () => {
    const { openWindow } = useDesktop();

    const navLinks = [
        { name: 'Home', icon: 'Home', action: () => openWindow({ id: 'home', title: 'Home', type: 'component', content: { app: 'explorer', initialPath: ['home'] } }) },
        { name: 'About', icon: 'User', action: () => openWindow({ id: 'about', title: 'About Me', type: 'markdown', content: '' }) },
        { name: 'MaiNet', icon: 'Globe', action: () => openWindow({ id: 'browser', title: 'MaiNet Link', type: 'component', content: 'browser', size: { width: 1024, height: 768 } }) },
    ];

    return (
        <div className="h-12 md:h-14 w-full bg-mai-surface border-b-4 border-mai-border flex items-center px-2 md:px-4 justify-between fixed top-0 z-[9999] shadow-sm">
            {/* Left Module: Start & Nav */}
            <div className="flex items-center gap-4">
                <StartButton />

                {/* Web Navigation Links (Desktop Only) */}
                <div className="hidden md:flex items-center gap-2">
                    {navLinks.map((link) => (
                        <button
                            key={link.name}
                            onClick={link.action}
                            className="px-4 py-1.5 rounded-full bg-mai-surface-dim/50 border border-mai-border/30 text-sm font-medium text-mai-subtext hover:text-mai-text hover:bg-mai-surface-dim hover:border-mai-border transition-all"
                        >
                            {link.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Center Module: Window List */}
            <div className="hidden md:flex flex-1 justify-center px-4 max-w-2xl overflow-hidden">
                <WindowList />
            </div>

            {/* Right Module: System Tray */}
            <div>
                <SystemTray />
            </div>
        </div>
    );
};

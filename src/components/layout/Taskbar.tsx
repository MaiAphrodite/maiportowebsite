"use client";

import React, { useState, useEffect } from 'react';
import { useDesktop } from '@/context/DesktopContext';
import { Menu, Clock, Volume2, Wifi } from 'lucide-react';

export const Taskbar = () => {
    const { windows, activeWindowId, openWindow, minimizeWindow } = useDesktop();
    const [mounted, setMounted] = useState(false);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleTaskbarItemClick = (id: string, isMinimized: boolean) => {
        if (isMinimized || activeWindowId !== id) {
            openWindow({ id });
        } else {
            minimizeWindow(id);
        }
    };

    return (
        <div className="h-12 w-full bg-pastel-lavender/90 backdrop-blur-md border-b-4 border-pastel-pink flex items-center px-4 justify-between fixed top-0 z-[9999]" style={{ top: 0, bottom: 'auto' }}>

            {/* Start / Menu Button */}
            <div className="flex items-center gap-4">
                <button className="p-2 bg-pastel-pink rounded-lg text-white hover:bg-pink-400 transition-colors shadow-sm active:translate-y-0.5">
                    <Menu size={20} />
                </button>

                {/* Active Windows List */}
                <div className="flex gap-2">
                    {windows.map((win) => (
                        <button
                            key={win.id}
                            onClick={() => handleTaskbarItemClick(win.id, win.isMinimized)}
                            className={`
                        px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2
                        ${activeWindowId === win.id && !win.isMinimized
                                    ? 'bg-white text-pastel-text shadow-md translate-y-[-2px]'
                                    : 'bg-white/40 text-pastel-text hover:bg-white/60'}
                    `}
                        >
                            <span className="w-2 h-2 rounded-full bg-pastel-mint"></span>
                            {win.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* System Tray */}
            <div className="flex items-center gap-4 text-pastel-text bg-white/40 px-4 py-1.5 rounded-full">
                <Wifi size={16} />
                <Volume2 size={16} />
                <div className="w-[1px] h-4 bg-pastel-text/20"></div>
                <div className="flex items-center gap-2 font-mono text-sm">
                    <Clock size={14} />
                    <span>
                        {mounted ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'}
                    </span>
                </div>
            </div>
        </div>
    );
};

"use client";

import React, { useState, useEffect } from 'react';
import { useDesktop } from '@/features/desktop/context/DesktopContext';
import { Clock, Volume2, Wifi, Moon, Sun } from 'lucide-react';

export const SystemTray = () => {
    const { theme, toggleTheme } = useDesktop();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center gap-1.5 md:gap-3 text-mai-text bg-mai-surface-dim px-2 md:px-4 py-1.5 md:py-2 rounded-full border border-mai-border/30 shadow-sm">
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-1 md:p-1.5 hover:bg-mai-surface rounded-full transition-colors text-mai-primary"
                title="Toggle Theme"
            >
                {theme === 'dark' ? <Moon size={16} className="md:w-[18px] md:h-[18px]" /> : <Sun size={16} className="md:w-[18px] md:h-[18px]" />}
            </button>

            <div className="w-[1px] h-3 md:h-4 bg-mai-border/50"></div>

            {/* Hide wifi/volume on very small screens */}
            <div className="hidden sm:flex gap-2">
                <Wifi size={16} className="text-mai-subtext md:w-[18px] md:h-[18px]" />
                <Volume2 size={16} className="text-mai-subtext md:w-[18px] md:h-[18px]" />
            </div>

            <div className="hidden sm:block w-[1px] h-3 md:h-4 bg-mai-border/50"></div>

            <div className="flex items-center gap-1 md:gap-2 font-mono text-xs md:text-sm font-medium">
                <Clock size={14} className="text-mai-primary md:w-4 md:h-4" />
                <span suppressHydrationWarning>
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
};

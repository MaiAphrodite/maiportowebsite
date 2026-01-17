"use client";

import React, { useState, useEffect } from 'react';
import { useDesktop } from '@/context/DesktopContext';
import { Clock, Volume2, Wifi, Moon, Sun } from 'lucide-react';

export const SystemTray = () => {
    const { theme, toggleTheme } = useDesktop();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center gap-3 text-mai-text bg-mai-surface-dim px-4 py-2 rounded-full border border-mai-border/30 shadow-sm">
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-1.5 hover:bg-mai-surface rounded-full transition-colors text-mai-primary"
                title="Toggle Theme"
            >
                {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <div className="w-[1px] h-4 bg-mai-border/50"></div>

            <div className="flex gap-2">
                <Wifi size={18} className="text-mai-subtext" />
                <Volume2 size={18} className="text-mai-subtext" />
            </div>

            <div className="w-[1px] h-4 bg-mai-border/50"></div>

            <div className="flex items-center gap-2 font-mono text-sm font-medium">
                <Clock size={16} className="text-mai-primary" />
                <span suppressHydrationWarning>
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
};

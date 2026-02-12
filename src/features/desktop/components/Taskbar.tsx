"use client";

import React, { useState, useEffect } from 'react';
import { useDesktop } from '@/features/desktop/context/DesktopContext';
import { Home, Briefcase, User, Mail, Sun, Moon } from 'lucide-react';

export const Taskbar = () => {
    const { openWindow, toggleTheme, theme } = useDesktop();
    const [time, setTime] = useState<Date | null>(null);
    const [activeNav, setActiveNav] = useState('home');

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const navItems = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'projects', label: 'Projects', icon: Briefcase },
        { id: 'about', label: 'About', icon: User },
        { id: 'contact', label: 'Contact', icon: Mail },
    ];

    const handleNavClick = (id: string) => {
        setActiveNav(id);

        // Close all windows first for "page" effect (optional, can be made smarter)
        // For now, just open the relevant content

        if (id === 'home') {
            // Show Welcome Widget
            openWindow({
                id: 'welcome-app',
                title: 'Welcome',
                type: 'component',
                content: 'welcome',
                variant: 'widget',
                size: { width: 500, height: 450 },
                position: { x: Math.max(50, (window.innerWidth - 500) / 2), y: 120 }
            });
        } else if (id === 'projects') {
            openWindow({
                id: 'projects',
                title: 'Projects',
                type: 'component',
                content: { app: 'explorer', initialPath: ['projects'] },
                size: { width: 800, height: 600 }
            });
        } else if (id === 'about') {
            openWindow({
                id: 'welcome-app',
                title: 'About Me',
                type: 'component',
                content: 'welcome',
                variant: 'widget',
                size: { width: 500, height: 450 },
                position: { x: Math.max(50, (window.innerWidth - 500) / 2), y: 120 }
            });
        } else if (id === 'contact') {
            openWindow({
                id: 'contact',
                title: 'Contact',
                type: 'markdown',
                content: `## Contact\nYou can reach me at:\n- Email: mai@example.com\n- GitHub: github.com/mai\n- Twitter: @mai_dev\n`,
                size: { width: 400, height: 300 }
            });
        }
    };

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
            {/* Navbar Container */}
            <nav className="waybar-module pointer-events-auto px-2 py-2 flex items-center gap-1">
                {/* Brand */}
                <div className="flex items-center gap-2 px-4 mr-4">
                    <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                        Mai
                    </span>
                </div>

                {/* Nav Links */}
                <div className="flex items-center gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeNav === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                                    transition-all duration-200
                                    ${isActive
                                        ? 'bg-mai-primary/20 text-mai-primary'
                                        : 'text-mai-subtext hover:text-mai-text hover:bg-mai-text/5'
                                    }
                                `}
                            >
                                <Icon size={16} />
                                <span className="hidden md:inline">{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Separator */}
                <div className="w-px h-6 bg-mai-overlay mx-4" />

                {/* Right Section: Time & Theme */}
                <div className="flex items-center gap-4 px-2">
                    {/* Time */}
                    <span className="font-mono text-sm text-mai-text min-w-[5ch] text-center">
                        {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '00:00'}
                    </span>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-mai-text/10 text-mai-subtext hover:text-mai-text transition-colors"
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>
            </nav>
        </div>
    );
};

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface WindowState {
    id: string;
    title: string;
    type: 'component' | 'markdown' | 'browser';
    content: any;
    isOpen: boolean;
    isMinimized: boolean;
    isMaximized: boolean;
    zIndex: number;
    position: { x: number; y: number };
    previousPosition?: { x: number; y: number };
    size: { width: number; height: number };
}

type Theme = 'light' | 'dark';

interface DesktopContextType {
    windows: WindowState[];
    activeWindowId: string | null;
    theme: Theme;
    openWindow: (window: Partial<WindowState>) => void;
    closeWindow: (id: string) => void;
    minimizeWindow: (id: string) => void;
    toggleMaximizeWindow: (id: string) => void;
    focusWindow: (id: string) => void;
    updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
    toggleTheme: () => void;
}

const DesktopContext = createContext<DesktopContextType | undefined>(undefined);

export const DesktopProvider = ({ children }: { children: ReactNode }) => {
    const [windows, setWindows] = useState<WindowState[]>([]);
    const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
    const [maxZIndex, setMaxZIndex] = useState(1);
    const [theme, setTheme] = useState<Theme>('dark'); // Default to Dark (Gamer vibe)

    // Initialize Theme from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('mai-theme') as Theme | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            // Default Dark
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('mai-theme', newTheme);
    };

    const openWindow = (windowData: Partial<WindowState>) => {
        const existing = windows.find(w => w.id === windowData.id);
        if (existing) {
            if (existing.isMinimized) {
                setWindows(prev => prev.map(w => w.id === windowData.id ? { ...w, isMinimized: false, zIndex: maxZIndex + 1 } : w));
            }
            focusWindow(existing.id);
            return;
        }

        const newWindow: WindowState = {
            id: windowData.id || Math.random().toString(36).substr(2, 9),
            title: windowData.title || 'Untitled',
            type: windowData.type || 'component',
            content: windowData.content || null,
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            zIndex: maxZIndex + 1,
            position: windowData.position || { x: 60 + (windows.length * 20), y: 100 + (windows.length * 20) },
            size: windowData.size || { width: 600, height: 400 },
        };

        setWindows([...windows, newWindow]);
        setActiveWindowId(newWindow.id);
        setMaxZIndex(prev => prev + 1);
    };

    const closeWindow = (id: string) => {
        setWindows(prev => prev.filter(w => w.id !== id));
        if (activeWindowId === id) {
            setActiveWindowId(null);
        }
    };

    const minimizeWindow = (id: string) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
        if (activeWindowId === id) {
            setActiveWindowId(null);
        }
    };

    const toggleMaximizeWindow = (id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id !== id) return w;

            if (!w.isMaximized) {
                return {
                    ...w,
                    isMaximized: true,
                    previousPosition: w.position
                };
            } else {
                return {
                    ...w,
                    isMaximized: false,
                    position: w.previousPosition || w.position
                };
            }
        }));
    };

    const focusWindow = (id: string) => {
        setActiveWindowId(id);
        setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: maxZIndex + 1 } : w));
        setMaxZIndex(prev => prev + 1);
    };

    const updateWindowPosition = (id: string, position: { x: number; y: number }) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, position } : w));
    };

    useEffect(() => {
        openWindow({
            id: 'welcome',
            title: 'Welcome to MaiOS',
            type: 'markdown',
            content: `# Welcome to my Desktop! 🌸\n\nThis is my interactive portfolio.\n\n- Click icons to explore.\n- Drag windows around.\n- Ask the AI mascot for help!\n\n*(This is a functional prototype, not just a wireframe!)*`
        });
    }, []);

    return (
        <DesktopContext.Provider value={{
            windows,
            activeWindowId,
            theme,
            openWindow,
            closeWindow,
            minimizeWindow,
            toggleMaximizeWindow,
            focusWindow,
            updateWindowPosition,
            toggleTheme
        }}>
            {children}
        </DesktopContext.Provider>
    );
};

export const useDesktop = () => {
    const context = useContext(DesktopContext);
    if (!context) {
        throw new Error('useDesktop must be used within a DesktopProvider');
    }
    return context;
};

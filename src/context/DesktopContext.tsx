"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useRef } from 'react';

export type WindowContent = string | null | { app: string; initialPath?: string[] };

export interface WindowState {
    id: string;
    title: string;
    type: 'component' | 'markdown' | 'browser';
    content: WindowContent;
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
    openWindow: (window: Partial<WindowState> & { id: string }) => void;
    closeWindow: (id: string) => void;
    minimizeWindow: (id: string) => void;
    toggleMaximizeWindow: (id: string) => void;
    focusWindow: (id: string) => void;
    updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
    updateWindowSize: (id: string, size: { width: number; height: number }) => void;
    toggleTheme: () => void;
}

const DesktopStateContext = createContext<Omit<DesktopContextType, 'openWindow' | 'closeWindow' | 'minimizeWindow' | 'toggleMaximizeWindow' | 'focusWindow' | 'updateWindowPosition' | 'updateWindowSize' | 'toggleTheme'> | undefined>(undefined);
const DesktopDispatchContext = createContext<Pick<DesktopContextType, 'openWindow' | 'closeWindow' | 'minimizeWindow' | 'toggleMaximizeWindow' | 'focusWindow' | 'updateWindowPosition' | 'updateWindowSize' | 'toggleTheme'> | undefined>(undefined);

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

    // State Refs for stable actions
    const stateRef = useRef({ windows, activeWindowId, maxZIndex, theme });
    useEffect(() => {
        stateRef.current = { windows, activeWindowId, maxZIndex, theme };
    }, [windows, activeWindowId, maxZIndex, theme]);

    const toggleTheme = React.useCallback(() => {
        const currentTheme = stateRef.current.theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('mai-theme', newTheme);
    }, []);

    const focusWindow = React.useCallback((id: string) => {
        setWindows(prev => {
            // Optimization: Don't update if already top and focused
            // But we need to verify logic. Safe to just map.
            return prev.map(w => w.id === id ? { ...w, zIndex: stateRef.current.maxZIndex + 1 } : w);
        });
        setActiveWindowId(id);
        setMaxZIndex(prev => prev + 1);
    }, []);

    const openWindow = React.useCallback((windowData: Partial<WindowState> & { id: string }) => {
        const { windows: currentWindows, maxZIndex: currentMaxZ } = stateRef.current;
        const existing = currentWindows.find(w => w.id === windowData.id);

        if (existing) {
            if (existing.isMinimized) {
                setWindows(prev => prev.map(w => w.id === windowData.id ? { ...w, isMinimized: false, zIndex: currentMaxZ + 1 } : w));
            }
            // We can call focusWindow, but it uses setStates.
            // Be careful of batching. direct call is better if we didn't just setWindows above?
            // Actually, just update logic here to match focusWindow behavior for consistency or call it.
            // focusWindow is stable, so calling it is fine.
            focusWindow(existing.id);
            return;
        }

        const newWindow: WindowState = {
            id: windowData.id,
            title: windowData.title || 'Untitled',
            type: windowData.type || 'component',
            content: windowData.content || null,
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            zIndex: currentMaxZ + 1,
            position: windowData.position || { x: 60 + (currentWindows.length * 20), y: 100 + (currentWindows.length * 20) },
            size: windowData.size || { width: 600, height: 400 },
        };

        setWindows(prev => [...prev, newWindow]);
        setActiveWindowId(newWindow.id);
        setMaxZIndex(prev => prev + 1);
    }, [focusWindow]);

    const closeWindow = React.useCallback((id: string) => {
        setWindows(prev => prev.filter(w => w.id !== id));
        if (stateRef.current.activeWindowId === id) {
            setActiveWindowId(null);
        }
    }, []);

    const minimizeWindow = React.useCallback((id: string) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
        if (stateRef.current.activeWindowId === id) {
            setActiveWindowId(null);
        }
    }, []);

    const toggleMaximizeWindow = React.useCallback((id: string) => {
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
    }, []);

    const updateWindowPosition = React.useCallback((id: string, position: { x: number; y: number }) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, position } : w));
    }, []);

    const updateWindowSize = React.useCallback((id: string, size: { width: number; height: number }) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, size } : w));
    }, []);

    // Initialize Default Window
    useEffect(() => {
        const { windows: currentWindows } = stateRef.current;
        const welcomeExists = currentWindows.some(w => w.id === 'welcome');
        if (!welcomeExists && currentWindows.length === 0) {
            openWindow({
                id: 'welcome',
                title: 'Welcome to MaiOS',
                type: 'markdown',
                content: `# Welcome to my Desktop! 🌸\n\nThis is my interactive portfolio.\n\n- Click icons to explore.\n- Drag windows around.\n- Ask the AI mascot for help!\n\n*(This is a functional prototype, not just a wireframe!)*`
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Memoize Actions - NOW STABLE
    const actions = useMemo(() => ({
        openWindow,
        closeWindow,
        minimizeWindow,
        toggleMaximizeWindow,
        focusWindow,
        updateWindowPosition,
        updateWindowSize,
        toggleTheme
    }), [openWindow, closeWindow, minimizeWindow, toggleMaximizeWindow, focusWindow, updateWindowPosition, updateWindowSize, toggleTheme]);

    return (
        <DesktopStateContext.Provider value={{ windows, activeWindowId, theme }}>
            <DesktopDispatchContext.Provider value={actions}>
                {children}
            </DesktopDispatchContext.Provider>
        </DesktopStateContext.Provider>
    );
};

export const useDesktopState = () => {
    const context = useContext(DesktopStateContext);
    if (!context) throw new Error('useDesktopState must be used within a DesktopProvider');
    return context;
};

export const useDesktopActions = () => {
    const context = useContext(DesktopDispatchContext);
    if (!context) throw new Error('useDesktopActions must be used within a DesktopProvider');
    return context;
};

export const useDesktop = () => {
    const state = useDesktopState();
    const actions = useDesktopActions();
    return { ...state, ...actions };
};

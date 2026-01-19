"use client";

import React, { useCallback } from 'react';
import { useDesktop, useDesktopActions, type WindowContent } from '@/features/desktop/context/DesktopContext';
import { useMobile } from '@/shared/hooks/useMobile';
import { useMobileGestures } from '@/shared/hooks/useMobileGestures';
import { Taskbar } from './Taskbar';
import { DesktopIcons } from './DesktopIcons';
import { Window } from './Window';
import { MobileHome } from '@/features/desktop/components/mobile/MobileHome';
import { MobileStatusBar } from '@/features/desktop/components/mobile/MobileStatusBar';

import { ChatbotWidget } from '@/features/chat/components/ChatbotWidget';
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Lazy load heavy apps
const Terminal = dynamic(() => import('@/features/terminal/components/Terminal').then(mod => mod.Terminal), {
    loading: () => <div className="p-4 text-pastel-text">Loading Terminal...</div>,
    ssr: false // Apps are client-side only typically
});

const FileExplorer = dynamic(() => import('@/features/files/components/FileExplorer').then(mod => mod.FileExplorer), {
    loading: () => <div className="p-4 text-pastel-text">Loading Explorer...</div>,
    ssr: false
});

const ChatStreamApp = dynamic(() => import('@/features/chat/components/ChatStreamApp').then(mod => mod.ChatStreamApp), {
    loading: () => <div className="p-4 text-pastel-text">Loading Stream...</div>,
    ssr: false
});

const BrowserApp = dynamic(() => import('@/features/browser/components/BrowserApp').then(mod => mod.BrowserApp), {
    loading: () => <div className="p-4 text-pastel-text">Connecting to MaiNet...</div>,
    ssr: false
});

// Simple content renderer based on type
const WindowContentRenderer = ({ type, content }: { type: string, content: WindowContent }) => {
    if (type === 'component') {
        if (content === 'terminal') return <Terminal />;
        if (content === 'stream-chat') return <ChatStreamApp />;
        if (content === 'browser') return <BrowserApp />;

        // Handle Explorer (string or object config)
        if (content === 'explorer') return <FileExplorer />;
        if (typeof content === 'object' && content && content.app === 'explorer') {
            return <FileExplorer initialPath={content.initialPath} />;
        }

        return <div className="p-4">Component: {typeof content === 'string' ? content : 'Unknown'}</div>;
    }
    if (type === 'markdown' && typeof content === 'string') {
        return (
            <div className="prose prose-pink max-w-none p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm text-pastel-text">
                    {content}
                </pre>
            </div>
        );
    }
    return <div>Unknown Content</div>;
};

export const Desktop = () => {
    const { windows, activeWindowId } = useDesktop();
    const { minimizeWindow } = useDesktopActions();
    const isMobile = useMobile();

    // Handle back gesture - minimize active window
    const handleBack = useCallback(() => {
        if (activeWindowId) {
            minimizeWindow(activeWindowId);
        }
    }, [activeWindowId, minimizeWindow]);

    // Handle home gesture - minimize all windows
    const handleHome = useCallback(() => {
        windows.forEach(w => {
            if (!w.isMinimized) {
                minimizeWindow(w.id);
            }
        });
    }, [windows, minimizeWindow]);

    // Only enable gestures on mobile
    useMobileGestures(isMobile ? {
        onBack: handleBack,
        onHome: handleHome,
    } : {});

    return (
        <div
            className="desktop-container relative w-full h-screen overflow-hidden bg-cover bg-center"
            style={{
                backgroundImage: 'var(--desktop-bg)',
                height: '100vh',
                width: '100vw',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Background / Wallpaper handled by CSS var */}

            {/* Desktop Icons (Desktop) or Mobile Home (Mobile) */}
            {isMobile ? <MobileHome /> : <DesktopIcons />}

            {/* Widgets Layer */}
            <ChatbotWidget />

            {/* Window Layer */}
            <AnimatePresence>
                {windows.map((win) => (
                    !win.isMinimized && (
                        <Window
                            key={win.id}
                            windowState={win}
                        >
                            <WindowContentRenderer type={win.type} content={win.content} />
                        </Window>
                    )
                ))}
            </AnimatePresence>

            {/* Taskbar / Nav Layer */}
            {isMobile ? (
                <MobileStatusBar />
            ) : (
                <Taskbar />
            )}
        </div>
    );
};

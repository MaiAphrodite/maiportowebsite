"use client";

import React from 'react';
import { useDesktop, type WindowContent } from '@/features/desktop/context/DesktopContext';
import { useMobile } from '@/shared/hooks/useMobile';
import { Taskbar } from './Taskbar';
import { Window } from './Window';
import { MobileStatusBar } from '@/features/desktop/components/mobile/MobileStatusBar';
import { WelcomeApp } from '@/features/portfolio/components/WelcomeApp';
import { MusicWidget } from '@/features/portfolio/components/MusicWidget';

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
        if (content === 'welcome') return <WelcomeApp />;
        if (content === 'music') return <MusicWidget />;
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

// ... imports
import { Dashboard } from './Dashboard';
// ... other imports

// ... WindowContentRenderer remains same ...

export const Desktop = () => {
    const { windows } = useDesktop();
    const isMobile = useMobile();

    // ... gesture hooks remain same ...

    return (
        <div
            className="desktop-container relative w-full h-screen overflow-hidden bg-cover bg-center"
            style={{
                height: '100vh',
                width: '100vw',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Hybrid Surface: Unified Dashboard */}
            <Dashboard />

            {/* Widgets Layer (Chatbot) */}
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

            {/* Navbar / Taskbar */}
            {!isMobile && <Taskbar />}

            {/* Mobile Status Bar if on mobile */}
            {isMobile && <MobileStatusBar />}
        </div>
    );
};

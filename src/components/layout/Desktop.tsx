"use client";

import React from 'react';
import { useDesktop, type WindowContent } from '@/context/DesktopContext';
import { Taskbar } from './Taskbar';
import { DesktopIcons } from './DesktopIcons';
import { Window } from './Window';
import { ChatbotWidget } from '@/components/widgets/ChatbotWidget';
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Lazy load heavy apps
const Terminal = dynamic(() => import('@/components/apps/Terminal').then(mod => mod.Terminal), {
    loading: () => <div className="p-4 text-pastel-text">Loading Terminal...</div>,
    ssr: false // Apps are client-side only typically
});

const FileExplorer = dynamic(() => import('@/components/apps/FileExplorer').then(mod => mod.FileExplorer), {
    loading: () => <div className="p-4 text-pastel-text">Loading Explorer...</div>,
    ssr: false
});

const ChatStreamApp = dynamic(() => import('@/components/apps/ChatStreamApp').then(mod => mod.ChatStreamApp), {
    loading: () => <div className="p-4 text-pastel-text">Loading Stream...</div>,
    ssr: false
});

// Simple content renderer based on type
const WindowContentRenderer = ({ type, content }: { type: string, content: WindowContent }) => {
    if (type === 'component') {
        if (content === 'terminal') return <Terminal />;
        if (content === 'stream-chat') return <ChatStreamApp />;

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
    const { windows } = useDesktop();

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

            {/* Desktop Icons */}
            <DesktopIcons />

            {/* Widgets Layer */}
            <ChatbotWidget />

            {/* Window Layer */}
            <AnimatePresence>
                {windows.map((win) => (
                    !win.isMinimized && (
                        <Window
                            key={win.id}
                            id={win.id}
                            title={win.title}
                            zIndex={win.zIndex}
                        >
                            <WindowContentRenderer type={win.type} content={win.content} />
                        </Window>
                    )
                ))}
            </AnimatePresence>

            {/* Taskbar Layer */}
            <Taskbar />
        </div>
    );
};

"use client";

import React from 'react';
import { useDesktop } from '@/context/DesktopContext';
import { Taskbar } from './Taskbar';
import { DesktopIcons } from './DesktopIcons';
import { Window } from './Window';
import { ChatbotWidget } from '@/components/widgets/ChatbotWidget';
import { Terminal } from '@/components/apps/Terminal';
import { FileExplorer } from '@/components/apps/FileExplorer';
import { AnimatePresence } from 'framer-motion';

// Simple content renderer based on type
const WindowContent = ({ type, content }: { type: string, content: any }) => {
    if (type === 'component') {
        if (content === 'terminal') return <Terminal />;
        if (content === 'explorer') return <FileExplorer />;
        return <div className="p-4">Component: {content}</div>;
    }
    if (type === 'markdown') {
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
                            initialPosition={win.position}
                        >
                            <WindowContent type={win.type} content={win.content} />
                        </Window>
                    )
                ))}
            </AnimatePresence>

            {/* Taskbar Layer */}
            <Taskbar />
        </div>
    );
};

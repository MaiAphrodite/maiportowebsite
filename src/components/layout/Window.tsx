"use client";

import React, { useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { useDesktopActions } from '@/context/DesktopContext';
import { motion } from 'framer-motion';
import { WindowHeader } from './window/WindowHeader';
import { useMobile } from '@/hooks/useMobile';
import { WindowState } from '@/context/DesktopContext';

interface WindowProps {
    windowState: WindowState;
    children: React.ReactNode;
}

export const Window = React.memo(({ windowState, children }: WindowProps) => {
    const { id, title, zIndex } = windowState;
    const { closeWindow, minimizeWindow, toggleMaximizeWindow, focusWindow, updateWindowPosition, updateWindowSize } = useDesktopActions();
    const nodeRef = useRef<HTMLDivElement>(null);
    const isMobile = useMobile();

    // Derived state
    const isMaximized = isMobile || windowState.isMaximized;
    const cappedZIndex = Math.min(zIndex, 8999);

    // Resize Observer to sync CSS resize back to state
    useEffect(() => {
        if (!nodeRef.current || isMaximized || isMobile) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                // Only update if dimensions actually changed significantly (throttling slightly)
                if (Math.abs(width - windowState.size.width) > 5 || Math.abs(height - windowState.size.height) > 5) {
                    updateWindowSize(id, { width, height });
                }
            }
        });

        observer.observe(nodeRef.current);
        return () => observer.disconnect();
    }, [id, isMaximized, isMobile, updateWindowSize, windowState.size.width, windowState.size.height]);

    const draggableKey = isMaximized ? `win-${id}-max` : `win-${id}-restored`;
    const initialPos = isMaximized ? { x: 0, y: 0 } : windowState.position;

    return (
        <Draggable
            key={draggableKey}
            handle=".window-header"
            defaultPosition={initialPos}
            nodeRef={nodeRef}
            onStart={() => {
                if (isMobile) return false;
                focusWindow(id);
            }}
            onStop={(e, data) => {
                if (!isMaximized && !isMobile) {
                    updateWindowPosition(id, { x: data.x, y: data.y });
                }
            }}
            disabled={isMaximized || isMobile}
        >
            <div
                ref={nodeRef}
                className={`shadow-xl ${isMaximized
                    ? 'fixed left-0 right-0 bottom-0 !transform-none transition-all duration-300 ease-in-out'
                    : `absolute`
                    }`}
                style={{
                    zIndex: cappedZIndex,
                    ...(isMaximized ? {
                        top: isMobile ? '48px' : '56px',
                        width: '100%',
                        height: isMobile ? 'calc(100vh - 48px)' : 'calc(100vh - 56px)',
                    } : {
                        width: `${windowState.size?.width || 600}px`,
                        height: `${windowState.size?.height || 400}px`,
                        resize: 'both' as const,
                        minWidth: '320px',
                        minHeight: '200px',
                    }),
                    overflow: 'auto',
                    transform: isMaximized ? 'none' : undefined
                }}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`w-full h-full bg-mai-border flex flex-col pt-1 border-2 border-black/30 ${isMaximized ? 'rounded-none' : 'rounded-3xl'}`}
                    style={{ boxShadow: isMaximized ? 'none' : '8px 8px 0px rgba(0,0,0,0.5)' }}
                >
                    <WindowHeader
                        title={title}
                        isMaximized={isMaximized}
                        onMinimize={(e) => { e.stopPropagation(); minimizeWindow(id); }}
                        onMaximize={(e) => { e.stopPropagation(); if (!isMobile) toggleMaximizeWindow(id); }}
                        onClose={(e) => { e.stopPropagation(); closeWindow(id); }}
                        onDoubleClick={() => !isMobile && toggleMaximizeWindow(id)}
                    />

                    {/* Window Content */}
                    <div
                        className={`flex-1 overflow-hidden bg-mai-surface backdrop-blur-sm relative text-mai-text ${isMaximized ? 'rounded-none' : 'rounded-t-3xl rounded-b-2xl mx-3 mb-3'}`}
                        onClick={() => focusWindow(id)}
                    >
                        {children}
                    </div>
                </motion.div>
            </div>
        </Draggable>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for React.memo
    // Only re-render if the windowState for THIS window has changed.
    return prevProps.windowState === nextProps.windowState && prevProps.children === nextProps.children;
});

Window.displayName = 'Window';

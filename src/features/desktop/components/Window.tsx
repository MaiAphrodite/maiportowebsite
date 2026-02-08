"use client";

import React, { useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { useDesktopActions } from '@/features/desktop/context/DesktopContext';
import { motion } from 'framer-motion';
import { WindowHeader } from './window/WindowHeader';
import { useMobile } from '@/shared/hooks/useMobile';
import { WindowState } from '@/features/desktop/context/DesktopContext';

interface WindowProps {
    windowState: WindowState;
    children: React.ReactNode;
}

export const Window = React.memo(({ windowState, children }: WindowProps) => {
    const { id, title, zIndex, variant } = windowState;
    const { closeWindow, minimizeWindow, toggleMaximizeWindow, focusWindow, updateWindowPosition, updateWindowSize } = useDesktopActions();
    const nodeRef = useRef<HTMLDivElement>(null);
    const isMobile = useMobile();

    const isWidget = variant === 'widget';

    // Derived state
    const isMaximized = isMobile || windowState.isMaximized;
    const cappedZIndex = Math.min(zIndex, 8999);

    // Resize Observer to sync CSS resize back to state
    useEffect(() => {
        if (!nodeRef.current || isMaximized || isMobile || isWidget) return;

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
    }, [id, isMaximized, isMobile, isWidget, updateWindowSize, windowState.size.width, windowState.size.height]);

    const draggableKey = isMaximized ? `win-${id}-max` : `win-${id}-restored`;
    const initialPos = isMaximized ? { x: 0, y: 0 } : windowState.position;

    return (
        <Draggable
            key={draggableKey}
            handle={isWidget ? ".widget-drag-handle" : ".window-header"}
            position={isMaximized ? { x: 0, y: 0 } : windowState.position}
            nodeRef={nodeRef}
            onStart={() => {
                if (isMobile) return false;
                focusWindow(id);
            }}
            onDrag={(e, data) => {
                if (!isMaximized && !isMobile) {
                    // Controlled mode: update state immediately
                    // This prevents snapping and desync
                    updateWindowPosition(id, { x: data.x, y: data.y });
                }
            }}
            disabled={isMaximized || isMobile}
        >
            <div
                ref={nodeRef}
                className={`${isMaximized
                    ? 'fixed left-0 right-0 bottom-0 !transform-none transition-all duration-75 ease-linear'
                    : `absolute`
                    } shadow-2xl rounded-lg`}
                style={{
                    zIndex: cappedZIndex,
                    ...(isMaximized ? {
                        top: isMobile ? '0px' : '40px',
                        left: '0px',
                        width: '100vw',
                        height: isMobile ? '100vh' : 'calc(100vh - 40px)',
                        borderRadius: isMobile ? '0px' : undefined
                    } : {
                        width: `${windowState.size?.width || 600}px`,
                        height: `${windowState.size?.height || 400}px`,
                        resize: isWidget ? 'none' : 'both' as const,
                        minWidth: isWidget ? undefined : '320px',
                        minHeight: isWidget ? undefined : '200px',
                        // Explicitly anchor to 0,0 so Draggable's transform (x,y) is accurate
                        left: 0,
                        top: 0
                    }),
                    overflow: 'visible',
                    transform: isMaximized ? 'none' : undefined,
                    position: isMaximized ? 'fixed' : 'absolute'
                }}
                onMouseDown={() => focusWindow(id)}
            >
                {/* Visual Content Wrapper */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={`
                        w-full h-full flex flex-col 
                        ${isWidget ? 'rounded-3xl border border-white/10' : 'rounded-lg border border-[#cba6f7]/30'}
                        overflow-hidden
                    `}
                    style={isWidget ? {
                        background: 'rgba(30, 30, 46, 0.6)',
                        backdropFilter: 'blur(24px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    } : {
                        // Explorer-like feel: Solid dark background with slight transparency, glass border
                        background: 'rgba(30, 30, 46, 0.95)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                    }}
                >
                    {!isWidget && (
                        <WindowHeader
                            title={title}
                            isMaximized={isMaximized}
                            onMinimize={(e) => { e.stopPropagation(); minimizeWindow(id); }}
                            onMaximize={(e) => { e.stopPropagation(); if (!isMobile) toggleMaximizeWindow(id); }}
                            onClose={(e) => { e.stopPropagation(); closeWindow(id); }}
                            onDoubleClick={() => !isMobile && toggleMaximizeWindow(id)}
                        />
                    )}

                    {/* Window Content */}
                    <div
                        className={`flex-1 overflow-hidden relative text-mai-text ${isWidget ? 'widget-drag-handle cursor-move' : ''}`}
                    >
                        {children}
                    </div>
                </motion.div>
            </div>
        </Draggable>
    );
}, (prevProps, nextProps) => {
    return prevProps.windowState === nextProps.windowState && prevProps.children === nextProps.children;
});

Window.displayName = 'Window';

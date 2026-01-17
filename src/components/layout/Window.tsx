"use client";

import React, { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { useDesktop } from '@/context/DesktopContext';
import { motion } from 'framer-motion';
import { WindowHeader } from './window/WindowHeader';
import { useMobile } from '@/hooks/useMobile';

interface WindowProps {
    id: string;
    title: string;
    children: React.ReactNode;
    zIndex: number;
}

export const Window = ({ id, title, children, zIndex }: WindowProps) => {
    const { closeWindow, minimizeWindow, toggleMaximizeWindow, focusWindow, updateWindowPosition, windows } = useDesktop();
    const nodeRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const isMobile = useMobile();

    const windowState = windows.find(w => w.id === id);
    if (!windowState) return null;

    // On mobile, always behave as maximized
    const isMaximized = isMobile || windowState.isMaximized;

    // Cap z-index below taskbar (9999)
    const cappedZIndex = Math.min(zIndex, 8999);

    const draggableKey = isMaximized ? `win-${id}-max` : `win-${id}-restored`;
    const initialPos = isMaximized ? { x: 0, y: 0 } : windowState.position;

    return (
        <Draggable
            key={draggableKey}
            handle=".window-header"
            defaultPosition={initialPos}
            nodeRef={nodeRef}
            onStart={() => {
                if (isMobile) return false; // Disable drag on mobile
                setIsDragging(true);
                focusWindow(id);
            }}
            onStop={(e, data) => {
                setIsDragging(false);
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
                    : `absolute ${isDragging ? '' : 'transition-all duration-300 ease-in-out'}`
                    }`}
                style={{
                    zIndex: cappedZIndex,
                    ...(isMaximized ? {
                        top: isMobile ? '48px' : '56px', // h-12 = 48px, h-14 = 56px
                        width: '100%',
                        height: isMobile ? 'calc(100vh - 48px)' : 'calc(100vh - 56px)',
                    } : {
                        width: '600px',
                        height: '400px',
                        resize: 'both' as const,
                        minWidth: '300px',
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
                    className={`w-full h-full bg-mai-border flex flex-col pt-1 ${isMaximized ? 'rounded-none' : 'rounded-3xl'}`}
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
                        className={`flex-1 overflow-auto bg-mai-surface backdrop-blur-sm relative text-mai-text ${isMaximized ? 'rounded-none' : 'rounded-t-3xl rounded-b-2xl mx-3 mb-3'}`}
                        onClick={() => focusWindow(id)}
                    >
                        {children}
                    </div>
                </motion.div>
            </div>
        </Draggable>
    );
};

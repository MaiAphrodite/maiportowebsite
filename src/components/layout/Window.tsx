"use client";

import React, { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { useDesktop } from '@/context/DesktopContext';
import { motion } from 'framer-motion';
import { WindowHeader } from './window/WindowHeader';

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

    const windowState = windows.find(w => w.id === id);
    if (!windowState) return null;

    const isMaximized = windowState.isMaximized;

    const draggableKey = isMaximized ? `win-${id}-max` : `win-${id}-restored`;
    const initialPos = isMaximized ? { x: 0, y: 0 } : windowState.position;

    return (
        <Draggable
            key={draggableKey}
            handle=".window-header"
            defaultPosition={initialPos}
            nodeRef={nodeRef}
            onStart={() => {
                setIsDragging(true);
                focusWindow(id);
            }}
            onStop={(e, data) => {
                setIsDragging(false);
                if (!isMaximized) {
                    updateWindowPosition(id, { x: data.x, y: data.y });
                }
            }}
            disabled={isMaximized}
        >
            <div
                ref={nodeRef}
                className={`absolute shadow-xl ${isMaximized
                        ? 'top-12 left-0 right-0 bottom-0 !w-full !h-[calc(100vh-3rem)] !transform-none transition-all duration-300 ease-in-out'
                        : isDragging
                            ? ''
                            : 'transition-all duration-300 ease-in-out'
                    }`}
                style={{
                    zIndex,
                    width: isMaximized ? '100%' : '600px',
                    height: isMaximized ? 'calc(100vh - 3rem)' : '400px',
                    resize: isMaximized ? 'none' : 'both',
                    overflow: 'auto',
                    minWidth: '300px',
                    minHeight: '200px',
                    transform: isMaximized ? 'none !important' : undefined
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
                        onMaximize={(e) => { e.stopPropagation(); toggleMaximizeWindow(id); }}
                        onClose={(e) => { e.stopPropagation(); closeWindow(id); }}
                        onDoubleClick={() => toggleMaximizeWindow(id)}
                    />

                    {/* Window Content */}
                    <div
                        className={`flex-1 overflow-auto bg-mai-surface backdrop-blur-sm relative text-mai-text rounded-t-3xl rounded-b-2xl mx-3 mb-3`}
                        onClick={() => focusWindow(id)}
                    >
                        {children}
                    </div>
                </motion.div>
            </div>
        </Draggable>
    );
};

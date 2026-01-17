"use client";

import React, { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { useDesktop } from '@/context/DesktopContext';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface WindowProps {
    id: string;
    title: string;
    children: React.ReactNode;
    zIndex: number;
}

export const Window = ({ id, title, children, zIndex }: WindowProps) => {
    const { closeWindow, minimizeWindow, toggleMaximizeWindow, focusWindow, updateWindowPosition, windows } = useDesktop();
    const nodeRef = useRef(null);

    // Local state to track if we are currently dragging
    // We need this to DISABLE smooth transitions while dragging, otherwise it lags behind mouse
    const [isDragging, setIsDragging] = useState(false);

    const windowState = windows.find(w => w.id === id);
    if (!windowState) return null;

    const isMaximized = windowState.isMaximized;

    // Uncontrolled drag key to reset position on max/restore
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
                // CONDITIONAL TRANSITION:
                // - If Maximized: Always transition (smooth expand)
                // - If Dragging: NO transition (instant follow)
                // - If Idle (Restored): Transition enabled (for smooth maximize/restore animations later)
                className={`absolute shadow-xl ${isMaximized
                        ? 'top-12 left-0 right-0 bottom-0 !w-full !h-[calc(100vh-3rem)] !transform-none transition-all duration-300 ease-in-out'
                        : isDragging
                            ? '' // No transition = instant drag
                            : 'transition-all duration-300 ease-in-out' // Smooth restore animation
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
                    className="w-full h-full bg-white rounded-lg overflow-hidden border-4 border-pastel-pink flex flex-col"
                    style={{ boxShadow: isMaximized ? 'none' : '8px 8px 0px rgba(0,0,0,0.1)' }}
                >
                    {/* Window Header */}
                    <div className="window-header h-10 bg-pastel-pink flex items-center justify-between px-3 cursor-move select-none shrink-0"
                        onDoubleClick={() => toggleMaximizeWindow(id)}>
                        <span className="font-bold text-white tracking-wide">{title}</span>
                        <div className="flex gap-2">
                            <button
                                className="p-1 hover:bg-white/20 rounded-md text-white transition-colors"
                                onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }}
                            >
                                <Minus size={14} />
                            </button>
                            <button
                                className="p-1 hover:bg-white/20 rounded-md text-white transition-colors"
                                onClick={(e) => { e.stopPropagation(); toggleMaximizeWindow(id); }}
                            >
                                {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            </button>
                            <button
                                className="p-1 hover:bg-red-400 rounded-md text-white transition-colors"
                                onClick={(e) => { e.stopPropagation(); closeWindow(id); }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Window Content */}
                    <div className="flex-1 overflow-auto bg-white/90 backdrop-blur-sm p-4 relative" onClick={() => focusWindow(id)}>
                        {children}
                    </div>
                </motion.div>
            </div>
        </Draggable>
    );
};

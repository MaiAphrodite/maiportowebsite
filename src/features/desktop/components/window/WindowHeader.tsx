"use client";

import React from 'react';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';

interface WindowHeaderProps {
    title: string;
    isMaximized: boolean;
    onMinimize: (e: React.MouseEvent) => void;
    onMaximize: (e: React.MouseEvent) => void;
    onClose: (e: React.MouseEvent) => void;
    onDoubleClick: () => void;
}

export const WindowHeader = ({
    title,
    isMaximized,
    onMinimize,
    onMaximize,
    onClose,
    onDoubleClick
}: WindowHeaderProps) => {
    return (
        <div
            className="window-header h-10 flex items-center justify-between px-3 cursor-move select-none shrink-0 text-mai-text font-mono border-b border-mai-border/10"
            style={{ background: 'var(--card-bg)' }}
            onDoubleClick={onDoubleClick}
        >
            <span className="font-bold tracking-tight text-sm uppercase pl-1">{title}</span>
            <div className="flex gap-2">
                <button
                    className="p-1.5 rounded-full hover:bg-mai-surface-dim hover:text-mai-sky transition-colors border-2 border-transparent hover:border-mai-sky"
                    onClick={onMinimize}
                    title="Minimize"
                >
                    <Minus size={14} />
                </button>
                <button
                    className="p-1.5 rounded-full hover:bg-mai-surface-dim hover:text-mai-mint transition-colors border-2 border-transparent hover:border-mai-mint"
                    onClick={onMaximize}
                    title="Maximize"
                >
                    {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                    className="p-1.5 rounded-full hover:bg-mai-rose hover:text-white transition-colors border-2 border-transparent hover:border-mai-rose"
                    onClick={onClose}
                    title="Close"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

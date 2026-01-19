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
            className="window-header h-12 flex items-center justify-between px-5 cursor-move select-none shrink-0 text-mai-surface"
            onDoubleClick={onDoubleClick}
        >
            <span className="font-bold tracking-wide text-lg">{title}</span>
            <div className="flex gap-2">
                <button
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                    onClick={onMinimize}
                >
                    <Minus size={16} />
                </button>
                <button
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                    onClick={onMaximize}
                >
                    {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                    className="p-1.5 hover:bg-red-500 rounded-full transition-colors"
                    onClick={onClose}
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

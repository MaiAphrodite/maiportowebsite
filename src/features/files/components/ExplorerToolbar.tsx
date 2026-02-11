"use client";

import React from 'react';
import { ArrowLeft, Search, Home, ChevronRight } from 'lucide-react';

interface ExplorerToolbarProps {
    currentPath: string[];
    onBack: () => void;
}

export const ExplorerToolbar = ({ currentPath, onBack }: ExplorerToolbarProps) => {
    return (
        <div className="h-16 border-b border-mai-border/10 flex items-center px-4 gap-3 bg-transparent backdrop-blur-sm">
            <button
                onClick={onBack}
                disabled={currentPath.length <= 1}
                className="p-2 hover:bg-mai-surface/50 rounded-xl disabled:opacity-30 text-mai-primary transition-all border border-transparent hover:border-mai-border/30"
            >
                <ArrowLeft size={20} />
            </button>

            {/* Path Bar */}
            <div className="flex-1 bg-mai-surface/30 border border-mai-border/20 px-4 py-2 text-sm rounded-xl flex items-center gap-2 overflow-hidden shadow-inner backdrop-blur-md">
                <Home size={16} className="text-mai-primary shrink-0" />
                <ChevronRight size={16} className="text-mai-subtext shrink-0" />
                <span className="truncate text-mai-text font-mono text-xs">{currentPath.join(' / ')}</span>
            </div>

            {/* Search Bar */}
            <div className="w-56 bg-mai-surface/30 border border-mai-border/20 px-4 py-2 text-sm rounded-xl flex items-center gap-2 shadow-inner backdrop-blur-md">
                <Search size={16} className="text-mai-subtext" />
                <span className="text-mai-subtext italic text-xs">Search...</span>
            </div>
        </div>
    );
};

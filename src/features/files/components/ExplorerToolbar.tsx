"use client";

import React from 'react';
import { ArrowLeft, Search, Home, ChevronRight } from 'lucide-react';

interface ExplorerToolbarProps {
    currentPath: string[];
    onBack: () => void;
}

export const ExplorerToolbar = ({ currentPath, onBack }: ExplorerToolbarProps) => {
    return (
        <div className="h-14 border-b border-mai-border/30 flex items-center px-4 gap-3 bg-mai-surface-dim">
            <button
                onClick={onBack}
                disabled={currentPath.length <= 1}
                className="p-2 hover:bg-mai-surface rounded-full disabled:opacity-30 text-mai-primary transition-all"
            >
                <ArrowLeft size={20} />
            </button>

            {/* Path Bar */}
            <div className="flex-1 bg-mai-surface border border-mai-border/30 px-4 py-2 text-sm rounded-full flex items-center gap-2 overflow-hidden shadow-sm">
                <Home size={16} className="text-mai-subtext shrink-0" />
                <ChevronRight size={16} className="text-mai-subtext shrink-0" />
                <span className="truncate text-mai-text font-medium">{currentPath.join(' / ')}</span>
            </div>

            {/* Search Bar */}
            <div className="w-56 bg-mai-surface border border-mai-border/30 px-4 py-2 text-sm rounded-full flex items-center gap-2 shadow-sm">
                <Search size={16} className="text-mai-subtext" />
                <span className="text-mai-subtext">Search</span>
            </div>
        </div>
    );
};

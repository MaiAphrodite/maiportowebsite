"use client";

import React from 'react';
import { FileSystemItem } from '@/features/files/data/fileSystem';
import { Folder, FileText, ArrowUp } from 'lucide-react';

interface ExplorerGridProps {
    currentPath: string[];
    currentFolder: FileSystemItem | undefined;
    onItemDoubleClick: (item: FileSystemItem) => void;
    onNavigateUp: () => void;
}

export const ExplorerGrid = ({ currentPath, currentFolder, onItemDoubleClick, onNavigateUp }: ExplorerGridProps) => {
    return (
        <div className="flex-1 overflow-auto p-6 grid grid-cols-4 sm:grid-cols-6 gap-6 content-start">

            {currentPath.length > 1 && (
                <div
                    onDoubleClick={onNavigateUp}
                    className="flex flex-col items-center gap-2 p-4 hover:bg-mai-surface-dim rounded-2xl cursor-pointer group transition-all duration-200"
                >
                    <div className="text-mai-secondary group-hover:scale-110 transition-transform"><ArrowUp size={48} /></div>
                    <span className="text-sm truncate w-full text-center text-mai-subtext font-medium">..</span>
                </div>
            )}

            {!currentFolder && (
                <div className="col-span-full text-center text-red-400 py-10">Folder not found: {currentPath.join('/')}</div>
            )}

            {currentFolder?.children?.length === 0 && (
                <div className="col-span-full text-center text-mai-subtext py-10">This folder is empty</div>
            )}

            {currentFolder?.children?.map(item => (
                <div
                    key={item.id}
                    onDoubleClick={() => onItemDoubleClick(item)}
                    className="flex flex-col items-center gap-2 p-4 hover:bg-mai-surface-dim/40 rounded-2xl cursor-pointer group transition-all duration-300 border-2 border-transparent hover:border-mai-primary/30 hover:shadow-lg hover:-translate-y-1"
                >
                    <div className="w-16 h-16 flex items-center justify-center transition-transform group-hover:scale-110 bg-mai-surface/50 rounded-2xl border border-white/5 group-hover:bg-mai-surface">
                        {item.type === 'folder' ? <Folder size={32} className="text-mai-primary fill-mai-primary/20" /> : <FileText size={32} className="text-mai-secondary" />}
                    </div>
                    <span className="text-xs truncate w-full text-center select-none text-mai-text font-medium bg-black/20 px-2 py-0.5 rounded-full">{item.name}</span>
                </div>
            ))}
        </div>
    );
};

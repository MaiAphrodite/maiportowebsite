"use client";

import React, { useState } from 'react';
import { fileSystem, FileSystemItem } from '@/data/fileSystem';
import { Folder, FileText, ArrowLeft, ArrowUp, Home, Search, ChevronRight } from 'lucide-react';
import { useDesktop } from '@/context/DesktopContext';

export const FileExplorer = () => {
    const { openWindow } = useDesktop();
    const [currentPath, setCurrentPath] = useState<string[]>(['home']);

    // Helper to resolve current folder
    const getCurrentFolder = (): FileSystemItem | undefined => {
        let current: FileSystemItem | undefined = fileSystem.find(item => item.id === currentPath[0]);
        for (let i = 1; i < currentPath.length; i++) {
            if (current && current.children) {
                current = current.children.find(child => child.id === currentPath[i]);
            } else {
                return undefined;
            }
        }
        return current;
    };

    const currentFolder = getCurrentFolder();

    const handleItemDoubleClick = (item: FileSystemItem) => {
        if (item.type === 'folder') {
            setCurrentPath([...currentPath, item.id]);
        } else {
            openWindow({ id: item.id, title: item.name, type: 'markdown', content: item.content });
        }
    };

    const handleBack = () => {
        if (currentPath.length > 1) {
            setCurrentPath(currentPath.slice(0, -1));
        }
    };

    return (
        <div className="flex flex-col h-full bg-white text-pastel-text">
            {/* Toolbar */}
            <div className="h-10 border-b flex items-center px-2 gap-2 bg-gray-50">
                <button onClick={handleBack} disabled={currentPath.length <= 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1 bg-white border px-2 py-1 text-sm rounded flex items-center gap-1">
                    <Home size={14} className="text-gray-400" />
                    <ChevronRight size={14} className="text-gray-300" />
                    <span>{currentPath.join(' / ')}</span>
                </div>
                <div className="w-48 bg-white border px-2 py-1 text-sm rounded flex items-center gap-2">
                    <Search size={14} className="text-gray-400" />
                    <span className="text-gray-400">Search</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 grid grid-cols-4 sm:grid-cols-6 gap-4 content-start">

                {currentPath.length > 1 && (
                    <div
                        onDoubleClick={handleBack}
                        className="flex flex-col items-center gap-1 p-2 hover:bg-blue-50 rounded cursor-pointer group"
                    >
                        <div className="text-pastel-blue group-hover:scale-105 transition-transform"><ArrowUp size={40} /></div>
                        <span className="text-sm truncate w-full text-center text-gray-500">..</span>
                    </div>
                )}

                {currentFolder?.children?.length === 0 && (
                    <div className="col-span-full text-center text-gray-400 py-10">This folder is empty</div>
                )}

                {currentFolder?.children?.map(item => (
                    <div
                        key={item.id}
                        onDoubleClick={() => handleItemDoubleClick(item)}
                        className="flex flex-col items-center gap-1 p-2 hover:bg-blue-50 rounded cursor-pointer group"
                    >
                        <div className="w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-105">
                            {item.type === 'folder' ? <Folder size={40} className="text-amber-300 fill-amber-100" /> : <FileText size={40} className="text-gray-400" />}
                        </div>
                        <span className="text-sm truncate w-full text-center select-none">{item.name}</span>
                    </div>
                ))}
            </div>

            {/* Status Bar */}
            <div className="h-6 border-t bg-gray-50 text-xs flex items-center px-4 text-gray-500">
                {currentFolder?.children?.length || 0} items
            </div>
        </div>
    );
};

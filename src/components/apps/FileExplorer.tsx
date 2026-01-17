"use client";

import React, { useState } from 'react';
import { fileSystem, FileSystemItem } from '@/data/fileSystem';
import { useDesktop, type WindowContent } from '@/context/DesktopContext';
import { ExplorerToolbar } from './explorer/ExplorerToolbar';
import { ExplorerGrid } from './explorer/ExplorerGrid';

interface FileExplorerProps {
    initialPath?: string[];
}

export const FileExplorer = ({ initialPath = ['home'] }: FileExplorerProps) => {
    const { openWindow } = useDesktop();
    const [currentPath, setCurrentPath] = useState<string[]>(initialPath);

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
            openWindow({ id: item.id, title: item.name, type: 'markdown', content: item.content as WindowContent });
        }
    };

    const handleBack = () => {
        if (currentPath.length > 1) {
            setCurrentPath(currentPath.slice(0, -1));
        }
    };

    const handleNavigateUp = () => {
        if (currentPath.length > 1) {
            setCurrentPath(currentPath.slice(0, -1));
        }
    };

    return (
        <div className="flex flex-col h-full bg-mai-surface text-mai-text">
            <ExplorerToolbar currentPath={currentPath} onBack={handleBack} />

            <ExplorerGrid
                currentPath={currentPath}
                currentFolder={currentFolder}
                onItemDoubleClick={handleItemDoubleClick}
                onNavigateUp={handleNavigateUp}
            />

            {/* Status Bar */}
            <div className="h-8 border-t border-mai-border/30 bg-mai-surface-dim text-xs flex items-center px-6 text-mai-subtext font-medium">
                {currentFolder?.children?.length || 0} items
            </div>
        </div>
    );
};

"use client";

import React from 'react';
import { useDesktopActions, type WindowContent } from '@/features/desktop/context/DesktopContext';
import { fileSystem, FileSystemItem } from '@/features/files/data/fileSystem';
import { useMobile } from '@/shared/hooks/useMobile';

export const DesktopIcons = () => {
    const { openWindow } = useDesktopActions();
    const isMobile = useMobile();

    const handleIconClick = (item: FileSystemItem) => {
        if (item.type === 'folder') {
            openWindow({
                id: item.id,
                title: item.name,
                type: 'component',
                content: { app: 'explorer', initialPath: [item.id] }
            });
        } else if (item.id === 'about') {
            openWindow({ id: 'about', title: 'About Me', type: 'markdown', content: item.content as WindowContent });
        } else if (item.id === 'browser') {
            openWindow({
                id: 'browser',
                title: 'MaiNet Navigator',
                type: 'component',
                content: 'browser',
                size: { width: 1024, height: 768 }
            });
        } else {
            openWindow({ id: item.id, title: item.name, type: 'markdown', content: item.content as WindowContent });
        }
    };

    const handleInteraction = (item: FileSystemItem) => {
        // Single tap on mobile, double-click on desktop
        if (isMobile) {
            handleIconClick(item);
        }
    };

    return (
        <div className={`
            absolute z-0
            ${isMobile
                ? 'top-16 left-0 right-0 px-4 flex flex-wrap gap-4 justify-center'
                : 'top-20 left-4 grid grid-flow-col grid-rows-[repeat(auto-fill,100px)] gap-6 h-[calc(100vh-80px)] w-fit'
            }
        `}>
            {fileSystem.map((item) => (
                <div
                    key={item.id}
                    onClick={() => handleInteraction(item)}
                    onDoubleClick={() => !isMobile && handleIconClick(item)}
                    className={`
                        flex flex-col items-center justify-center p-2 rounded-lg 
                        hover:bg-mai-surface-dim/30 transition-colors cursor-pointer group
                        ${isMobile ? 'w-20 h-20' : 'w-24 h-24'}
                    `}
                >
                    <div className={`
                        bg-mai-surface-dim rounded-xl mb-2 flex items-center justify-center 
                        group-hover:scale-105 transition-transform
                        border-2 border-mai-border
                        ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}
                    `}>
                        {item.type === 'folder' && <div className={`text-mai-primary ${isMobile ? 'text-xl' : 'text-2xl'}`}>📁</div>}
                        {item.type === 'file' && <div className={`text-mai-secondary ${isMobile ? 'text-xl' : 'text-2xl'}`}>📄</div>}
                    </div>
                    <span className={`
                        font-medium text-mai-text text-center leading-tight
                        bg-mai-surface px-2 py-0.5 rounded-md border-2 border-mai-border
                        ${isMobile ? 'text-xs' : 'text-sm'}
                    `}>
                        {item.name}
                    </span>
                </div>
            ))}

            <div
                onClick={() => isMobile && openWindow({ id: 'terminal', title: 'Terminal', type: 'component', content: 'terminal' })}
                onDoubleClick={() => !isMobile && openWindow({ id: 'terminal', title: 'Terminal', type: 'component', content: 'terminal' })}
                className={`
                    flex flex-col items-center justify-center p-2 rounded-lg 
                    hover:bg-mai-surface-dim/30 transition-colors cursor-pointer group
                    ${isMobile ? 'w-20 h-20' : 'w-24 h-24'}
                `}
            >
                <div className={`
                    bg-gray-800 rounded-xl mb-2 flex items-center justify-center 
                    group-hover:scale-105 transition-transform border-2 border-mai-border
                    ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}
                `}>
                    <span className={`text-white font-mono ${isMobile ? 'text-[10px]' : 'text-xs'}`}>{">_"}</span>
                </div>
                <span className={`
                    font-medium text-mai-text text-center leading-tight
                    bg-mai-surface px-2 py-0.5 rounded-md border-2 border-mai-border
                    ${isMobile ? 'text-xs' : 'text-sm'}
                `}>
                    Terminal
                </span>
            </div>
        </div>
    );
};

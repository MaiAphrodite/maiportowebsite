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
        } else if (item.id === 'welcome-app') {
            openWindow({
                id: 'welcome-app',
                title: 'Welcome',
                type: 'component',
                content: 'welcome',
                variant: 'widget',
                size: { width: 500, height: 450 },
                position: { x: Math.max(50, (window.innerWidth - 500) / 2), y: 120 }
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
                : 'top-16 left-4 grid grid-flow-col auto-rows-max gap-y-4 gap-x-6 h-[calc(100vh-80px)] w-fit content-start'
            }
        `}>
            {fileSystem.map((item) => (
                <div
                    key={item.id}
                    onClick={() => handleInteraction(item)}
                    onDoubleClick={() => !isMobile && handleIconClick(item)}
                    className={`
                        flex flex-col items-center justify-start p-2 rounded-2xl
                        hover:bg-white/5 transition-all duration-200 cursor-pointer group
                        ${isMobile ? 'w-20 h-24' : 'w-24 h-28'}
                    `}
                >
                    <div className={`
                        bg-mai-surface rounded-2xl mb-2 flex items-center justify-center 
                        border-2 border-mai-border/20 group-hover:border-mai-primary group-hover:scale-105 transition-all
                        ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}
                        shadow-[0_4px_10px_rgba(0,0,0,0.1)]
                    `}>
                        {item.type === 'folder' && <div className={`text-mai-primary ${isMobile ? 'text-xl' : 'text-2xl'}`}>📁</div>}
                        {item.type === 'file' && <div className={`text-mai-secondary ${isMobile ? 'text-xl' : 'text-2xl'}`}>📄</div>}
                    </div>
                    <span className={`
                        font-medium text-mai-text text-center leading-tight
                        bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm
                        ${isMobile ? 'text-xs' : 'text-xs'}
                        border border-white/10 group-hover:border-mai-primary/50 transition-colors
                        line-clamp-2 w-full
                    `}>
                        {item.name}
                    </span>
                </div>
            ))}

            <div
                onClick={() => isMobile && openWindow({ id: 'terminal', title: 'Terminal', type: 'component', content: 'terminal' })}
                onDoubleClick={() => !isMobile && openWindow({ id: 'terminal', title: 'Terminal', type: 'component', content: 'terminal' })}
                className={`
                    flex flex-col items-center justify-start p-2 rounded-xl
                    hover:bg-white/40 transition-colors cursor-pointer group
                    ${isMobile ? 'w-20 h-24' : 'w-24 h-28'}
                `}
            >
                <div className={`
                    bg-mai-surface rounded-2xl mb-2 flex items-center justify-center 
                    group-hover:translate-y-[-4px] transition-transform border-2 border-mai-border
                    ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}
                    shadow-[4px_4px_0px_var(--rice-shadow)]
                `}>
                    <span className={`text-mai-rose font-mono font-bold ${isMobile ? 'text-sm' : 'text-base'}`}>{">_"}</span>
                </div>
                <span className={`
                    font-bold text-mai-text text-center leading-tight
                    bg-rice-panel/90 px-3 py-1 rounded-xl border-2 border-mai-border
                    ${isMobile ? 'text-xs' : 'text-xs'}
                    shadow-sm
                `}>
                    Terminal
                </span>
            </div>
        </div>
    );
};

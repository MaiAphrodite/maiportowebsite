"use client";

import React from 'react';
import { useDesktop, type WindowContent } from '@/context/DesktopContext';
import { fileSystem, FileSystemItem } from '@/data/fileSystem';

export const DesktopIcons = () => {
    const { openWindow } = useDesktop();

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
        } else {
            openWindow({ id: item.id, title: item.name, type: 'markdown', content: item.content as WindowContent });
        }
    };

    return (
        <div className="absolute top-20 left-4 grid grid-flow-col grid-rows-[repeat(auto-fill,100px)] gap-6 h-[calc(100vh-80px)] w-fit z-0">
            {fileSystem.map((item) => (
                <div
                    key={item.id}
                    onDoubleClick={() => handleIconClick(item)}
                    className="w-24 h-24 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-mai-surface-dim/30 transition-colors cursor-pointer group"
                >
                    <div className="w-12 h-12 bg-mai-surface-dim rounded-xl mb-2 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform backdrop-blur-sm border border-mai-border/20">
                        {item.type === 'folder' && <div className="text-mai-primary text-2xl">📁</div>}
                        {item.type === 'file' && <div className="text-mai-secondary text-2xl">📄</div>}
                    </div>
                    <span className="text-sm font-medium text-mai-text text-center leading-tight drop-shadow-md bg-mai-surface/40 backdrop-blur-md px-2 rounded-md border border-mai-border/10">
                        {item.name}
                    </span>
                </div>
            ))}

            <div
                onClick={() => openWindow({ id: 'terminal', title: 'Terminal', type: 'component', content: 'terminal' })}
                className="w-24 h-24 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-mai-surface-dim/30 transition-colors cursor-pointer group"
            >
                <div className="w-12 h-12 bg-gray-800 rounded-xl mb-2 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-mai-border/20">
                    <span className="text-white font-mono text-xs">{">_"}</span>
                </div>
                <span className="text-sm font-medium text-mai-text text-center leading-tight drop-shadow-md bg-mai-surface/40 backdrop-blur-md px-2 rounded-md border border-mai-border/10">
                    Terminal
                </span>
            </div>
        </div>
    );
};

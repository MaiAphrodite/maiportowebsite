"use client";

import React from 'react';
import { useDesktop } from '@/context/DesktopContext';
import { fileSystem } from '@/data/fileSystem';
import Image from 'next/image';

// Map icons to visual assets or Lucide components if needed
// For now, we use a generic logic to display the generated assets or simple icons

export const DesktopIcons = () => {
    const { openWindow } = useDesktop();

    const handleIconClick = (item: any) => {
        // Logic to open different apps based on item type
        // If folder -> Open File Explorer
        // If file -> Open Text Editor

        if (item.id === 'about') {
            openWindow({ id: 'about', title: 'About Me', type: 'markdown', content: item.content });
        } else if (item.children) {
            openWindow({ id: item.id, title: item.name, type: 'component', content: 'explorer' });
        } else {
            openWindow({ id: item.id, title: item.name, type: 'markdown', content: item.content });
        }
    };

    return (
        <div className="absolute top-20 left-4 grid grid-flow-col grid-rows-[repeat(auto-fill,100px)] gap-6 h-[calc(100vh-80px)] w-fit z-0">
            {/* Render Home First explicitly or iterate fileSystem */}
            {fileSystem.map((item) => (
                <div
                    key={item.id}
                    onDoubleClick={() => handleIconClick(item)}
                    className="w-24 h-24 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-white/30 transition-colors cursor-pointer group"
                >
                    {/* Use the generated icon sprite if possible, or Lucide fallback */}
                    <div className="w-12 h-12 bg-pastel-cream rounded-xl mb-2 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        {/* Placeholder for icon logic, using Lucide for now */}
                        {item.type === 'folder' && <div className="text-amber-400">📁</div>}
                        {item.type === 'file' && <div className="text-blue-400">📄</div>}
                    </div>
                    <span className="text-sm font-medium text-pastel-text text-center leading-tight drop-shadow-sm bg-white/60 px-2 rounded-md">
                        {item.name}
                    </span>
                </div>
            ))}

            {/* Hardcoded "My Computer" or specific shortcuts */}
            <div
                onClick={() => openWindow({ id: 'terminal', title: 'Terminal', type: 'component', content: 'terminal' })}
                className="w-24 h-24 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-white/30 transition-colors cursor-pointer group"
            >
                <div className="w-12 h-12 bg-gray-800 rounded-xl mb-2 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <span className="text-white font-mono text-xs">{">_"}</span>
                </div>
                <span className="text-sm font-medium text-pastel-text text-center leading-tight drop-shadow-sm bg-white/60 px-2 rounded-md">
                    Terminal
                </span>
            </div>
        </div>
    );
};

import React from 'react';
import { useDesktopActions, WindowContent } from '@/features/desktop/context/DesktopContext';
import { fileSystem, FileSystemItem } from '@/features/files/data/fileSystem';
import { Terminal, Globe, Folder, FileText, Music, Settings } from 'lucide-react';

export const MobileHome = () => {
    const { openWindow } = useDesktopActions();

    const handleItemClick = (item: FileSystemItem) => {
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

    const getIcon = (item: FileSystemItem) => {
        // Map common items to Lucid icons for that "Linux Rice" look
        const name = item.name.toLowerCase();
        if (name.includes('terminal')) return <Terminal size={24} />;
        if (name.includes('blog') || name.includes('site') || name.includes('link') || name.includes('mainet')) return <Globe size={24} />;
        if (name.includes('music')) return <Music size={24} />;
        if (item.type === 'folder') return <Folder size={24} />;
        return <FileText size={24} />;
    };

    return (
        <div className="w-full h-full pt-12 pb-16 px-6 flex flex-col items-center">
            {/* Rice Widget: Clock */}
            <div className="mt-12 mb-auto flex flex-col items-center">
                <h1 className="text-6xl font-black text-mai-primary font-mono tracking-tighter mix-blend-multiply">
                    {new Date().getHours().toString().padStart(2, '0')}
                    <span className="mx-1 text-mai-text">:</span>
                    {new Date().getMinutes().toString().padStart(2, '0')}
                </h1>
                <p className="text-mai-subtext font-medium mt-1 uppercase tracking-widest text-xs">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>

                {/* Weather / System fake widget */}
                <div className="mt-8 flex gap-6 text-xs font-mono text-mai-subtext bg-mai-surface-dim/50 px-4 py-2 rounded-full border border-mai-border">
                    <span>24°C</span>
                    <span>|</span>
                    <span>MEM: 42%</span>
                    <span>|</span>
                    <span>UP: 12h</span>
                </div>
            </div>

            {/* App Grid - Bottom aligned */}
            <div className="grid grid-cols-4 gap-x-4 gap-y-6 w-full mb-8">
                {fileSystem.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-mai-surface flex items-center justify-center text-mai-text border-2 border-mai-border shadow-sm group-hover:border-mai-primary transition-colors">
                            {getIcon(item)}
                        </div>
                        <span className="text-[10px] font-medium text-mai-text/80 text-center truncate w-full">
                            {item.name}
                        </span>
                    </div>
                ))}

                {/* Fixed Terminal Icon */}
                <div
                    onClick={() => openWindow({ id: 'terminal', title: 'Terminal', type: 'component', content: 'terminal' })}
                    className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
                >
                    <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center text-white border-2 border-mai-border shadow-sm">
                        <Terminal size={24} />
                    </div>
                    <span className="text-[10px] font-medium text-mai-text/80 text-center">
                        Term
                    </span>
                </div>
            </div>

            {/* Dock Area (Search?) */}
            <div className="w-full bg-mai-surface/80 backdrop-blur-md rounded-full px-4 py-3 flex items-center gap-3 border border-mai-border shadow-sm mb-4">
                <Globe size={18} className="text-mai-subtext" />
                <span className="text-sm text-mai-subtext flex-1">Search...</span>
                <Settings size={18} className="text-mai-subtext" />
            </div>
        </div>
    );
};

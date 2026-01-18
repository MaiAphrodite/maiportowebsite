import React from 'react';
import { Home, ArrowLeft, Square } from 'lucide-react';
import { useDesktopActions, useDesktopState } from '@/context/DesktopContext';

export const MobileNavBar = () => {
    const { minimizeWindow } = useDesktopActions();
    const { activeWindowId, windows } = useDesktopState();

    // Simplistic navigation for now
    // Home -> Minimize all (show desktop)
    // Back -> Close current? Or just minimize
    // Recents -> Not implemented yet

    // Back -> Minimize active window (Android behavior-ish)
    const handleBack = () => {
        if (activeWindowId) {
            minimizeWindow(activeWindowId);
        }
    };

    // Home -> Minimize all to show desktop
    const handleHome = () => {
        windows.forEach(w => {
            if (!w.isMinimized) minimizeWindow(w.id);
        });
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 h-12 bg-transparent flex justify-around items-center z-[9999] pb-2 pointer-events-auto">
            {/* Glassmorphism background effect if needed, but keeping it clean for 'rice' look */}

            <button
                onClick={handleBack}
                className="p-2 rounded-full hover:bg-black/5 active:scale-95 transition-all text-mai-text/70"
            >
                <ArrowLeft size={20} />
            </button>

            <button
                onClick={handleHome}
                className="p-2 rounded-full hover:bg-black/5 active:scale-95 transition-all text-mai-text/70"
            >
                <Home size={20} />
            </button>

            <button
                onClick={() => { /* Handle Recents */ }}
                className="p-2 rounded-full hover:bg-black/5 active:scale-95 transition-all text-mai-text/70 opacity-50"
            >
                <Square size={18} />
            </button>
        </div>
    );
};

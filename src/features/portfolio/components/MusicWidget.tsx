"use client";

import React, { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';

export const MusicWidget = () => {
    const [isPlaying, setIsPlaying] = useState(true);

    return (
        <div className="flex items-center gap-4 p-4 select-none">
            {/* Album Art */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg">
                🎵
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">Lofi Coding Session</p>
                <p className="text-white/50 text-xs truncate">Cozy Beats Radio</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
                <button className="p-2 text-white/40 hover:text-white transition-colors">
                    <SkipBack size={16} />
                </button>
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button className="p-2 text-white/40 hover:text-white transition-colors">
                    <SkipForward size={16} />
                </button>
            </div>

            {/* Volume */}
            <div className="hidden md:flex items-center gap-2 text-white/40">
                <Volume2 size={14} />
                <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-gradient-to-r from-pink-400 to-purple-500" />
                </div>
            </div>
        </div>
    );
};

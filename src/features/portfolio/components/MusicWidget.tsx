"use client";

import React, { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Volume1, VolumeX, Music } from 'lucide-react';

const PLAYLIST = [
    { title: "Bus Stop", artist: "HoliznaCC0", src: "/music/bus-stop.ogg" },
    { title: "Busted AC Unit", artist: "HoliznaCC0", src: "/music/busted-ac-unit.ogg" },
    { title: "Nowhere To Be", artist: "HoliznaCC0", src: "/music/nowhere-to-be.ogg" },
];

export const MusicWidget = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const [prevVolume, setPrevVolume] = useState(0.5);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const currentTrack = PLAYLIST[currentTrackIndex];

    React.useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Audio play failed:", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentTrackIndex, volume, isMuted]);

    const handleNext = () => {
        setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
        setIsPlaying(true);
    };

    const handlePrev = () => {
        setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
        setIsPlaying(true);
    };

    const toggleMute = () => {
        if (isMuted) {
            setVolume(prevVolume);
            setIsMuted(false);
        } else {
            setPrevVolume(volume);
            setVolume(0);
            setIsMuted(true);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const VolumeIcon = () => {
        if (isMuted || volume === 0) return <VolumeX size={14} />;
        if (volume < 0.5) return <Volume1 size={14} />;
        return <Volume2 size={14} />;
    };

    return (
        <div className="relative">
            {/* GFX: Top-right barcode bars */}
            <div className="absolute top-2 right-2 flex gap-1 z-0 opacity-20">
                <div className="w-1 h-3 bg-mai-primary" />
                <div className="w-1 h-5 bg-mai-primary" />
                <div className="w-1 h-3 bg-mai-text" />
                <div className="w-1 h-4 bg-mai-text" />
                <div className="w-1 h-2 bg-mai-primary" />
            </div>

            <div className="flex items-center gap-4 p-5 select-none relative z-10">
                <audio
                    ref={audioRef}
                    src={currentTrack.src}
                    onEnded={handleNext}
                />

                {/* Album Art Container */}
                <div className="relative group">
                    <div className="w-16 h-16 shrink-0 rounded-xl bg-gradient-to-br from-mai-primary to-mai-accent flex items-center justify-center text-white text-2xl shadow-lg transition-all group-hover:scale-[1.02]">
                        <div className={`${isPlaying ? 'animate-pulse' : ''}`}>
                            <Music size={24} />
                        </div>
                    </div>
                    {/* GFX Index Badge */}
                    <div className="absolute -bottom-2 -right-2 bg-mai-surface px-1.5 py-0.5 rounded border border-mai-border text-[9px] font-mono text-mai-subtext">
                        {String(currentTrackIndex + 1).padStart(2, '0')}
                    </div>
                </div>

                {/* Track Info & Controls */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <div className="min-w-0">
                            <p className="text-mai-text font-bold text-sm truncate uppercase tracking-tight">{currentTrack.title}</p>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-mai-primary opacity-50 animate-pulse" />
                                <p className="text-mai-subtext text-[10px] uppercase tracking-widest truncate">{currentTrack.artist}</p>
                            </div>
                        </div>
                        {/* Tiny Barcode */}
                        <div className="gfx-barcode h-4 opacity-20">
                            <span style={{ width: 2, height: 8 }} />
                            <span style={{ width: 1, height: 12 }} />
                            <span style={{ width: 3, height: 6 }} />
                            <span style={{ width: 1, height: 10 }} />
                        </div>
                    </div>

                    {/* Divider Line */}
                    <div className="h-px w-full bg-gradient-to-r from-mai-border/20 to-transparent" />

                    <div className="flex items-center justify-between gap-4">
                        {/* Playback Controls */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handlePrev}
                                className="p-1.5 text-mai-subtext hover:text-mai-primary transition-colors active:scale-95"
                            >
                                <SkipBack size={14} />
                            </button>
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="p-2 bg-mai-primary/10 hover:bg-mai-primary/20 rounded-md text-mai-primary transition-all active:scale-95 border border-mai-primary/20"
                            >
                                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                            <button
                                onClick={handleNext}
                                className="p-1.5 text-mai-subtext hover:text-mai-primary transition-colors active:scale-95"
                            >
                                <SkipForward size={14} />
                            </button>
                        </div>

                        {/* Volume Control */}
                        <div className="flex items-center gap-2 group/vol">
                            <button
                                onClick={toggleMute}
                                className="text-mai-subtext hover:text-mai-text transition-colors p-1"
                            >
                                <VolumeIcon />
                            </button>
                            <div className="w-20 h-4 flex items-center relative">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    style={{
                                        backgroundSize: `${(isMuted ? 0 : volume) * 100}% 100%`
                                    }}
                                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-mai-surface-dim
                                    bg-gradient-to-r from-mai-primary to-mai-primary bg-no-repeat
                                    [&::-webkit-slider-thumb]:appearance-none 
                                    [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                                    [&::-webkit-slider-thumb]:bg-white 
                                    [&::-webkit-slider-thumb]:rounded-full 
                                    [&::-webkit-slider-thumb]:shadow-md
                                    [&::-webkit-slider-thumb]:transition-transform
                                    [&::-webkit-slider-thumb]:hover:scale-110"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vertical Side Label */}
            <div className="absolute top-1/2 -translate-y-1/2 right-1 gfx-side-label text-[8px] opacity-10">
                AUDIO_SYS_V1
            </div>

            {/* GFX: Model code — bottom-left, in padding zone */}
            <div className="absolute bottom-1.5 left-5 opacity-15 z-0 pointer-events-none">
                <span className="text-[7px] font-mono font-bold text-mai-text tracking-widest">GR—64 ■ GROMGEAR</span>
            </div>
        </div>
    );
};

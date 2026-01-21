"use client";

import React from 'react';
import { Volume2, RotateCw, Check, AlertCircle } from 'lucide-react';

interface VoiceActivationModalProps {
    isOpen: boolean;
    progress: number; // 0-100
    isReady: boolean;
    error?: string;
    onClose: () => void;
    onRetry?: () => void;
}

export const VoiceActivationModal = React.memo(({
    isOpen,
    progress,
    isReady,
    error,
    onClose,
    onRetry
}: VoiceActivationModalProps) => {
    // Auto-close after ready
    React.useEffect(() => {
        if (isReady && isOpen) {
            const timer = setTimeout(onClose, 800);
            return () => clearTimeout(timer);
        }
    }, [isReady, isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
            <div className="bg-[#2D2D3A] border-2 border-[#FF69B4] rounded-xl shadow-lg p-6 max-w-sm w-full mx-4 flex flex-col items-center gap-4 text-center animate-in zoom-in-95 duration-200">
                {error ? (
                    <>
                        {/* Error State */}
                        <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                            <AlertCircle size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-[#E0E0E0]">Voice Initialization Failed</h3>
                        <p className="text-sm text-[#A0A0A0]">{error}</p>
                        <button
                            onClick={onRetry}
                            className="mt-2 px-6 py-2.5 bg-[#FF69B4] text-white font-medium rounded-lg hover:bg-[#FF69B4]/80 transition-colors flex items-center gap-2"
                        >
                            <RotateCw size={16} />
                            Try Again
                        </button>
                    </>
                ) : isReady ? (
                    <>
                        {/* Ready State */}
                        <div className="w-14 h-14 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
                            <Check size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-[#E0E0E0]">Voice Ready!</h3>
                        <p className="text-sm text-[#A0A0A0]">Mai will now speak to you~ ♡</p>
                    </>
                ) : (
                    <>
                        {/* Loading/Progress State */}
                        <div className="w-14 h-14 rounded-full bg-[#FF69B4]/20 text-[#FF69B4] flex items-center justify-center relative">
                            {progress < 100 ? (
                                <RotateCw size={28} className="animate-spin" />
                            ) : (
                                <Volume2 size={28} />
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-[#E0E0E0]">
                            {progress < 50 ? 'Downloading Voice...' : progress < 100 ? 'Preparing Voice...' : 'Almost Ready...'}
                        </h3>
                        <p className="text-sm text-[#A0A0A0]">
                            {progress < 50 ? 'Loading AI voice model' : 'Initializing speech engine'}
                        </p>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-[#1E1E2E] rounded-full overflow-hidden border border-[#FF69B4]/30">
                            <div
                                className="h-full bg-gradient-to-r from-[#FF69B4] to-[#00FFFF] transition-all duration-300 ease-out"
                                style={{ width: `${Math.max(5, progress)}%` }}
                            />
                        </div>
                        <span className="text-xs text-[#A0A0A0] font-mono">{Math.round(progress)}%</span>
                    </>
                )}
            </div>
        </div>
    );
});

VoiceActivationModal.displayName = 'VoiceActivationModal';

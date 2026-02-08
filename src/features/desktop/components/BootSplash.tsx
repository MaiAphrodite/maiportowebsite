"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useDesktopActions } from '@/features/desktop/context/DesktopContext';

const BOOT_MESSAGES = [
    "Initializing Portfolio Protocol...",
    "Loading Mai's World...",
    "Curating Cute Things...",
    "Preparing Showcase...",
    "Welcome to Mai's Portfolio! ♡"
];

export const BootSplash = () => {
    const { setBooted } = useDesktopActions();
    const [loadProgress, setLoadProgress] = useState(0);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [isComplete, setIsComplete] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);

    // Track actual browser load progress
    useEffect(() => {
        let animationFrame: number;

        const updateProgress = () => {
            // Use Performance API to track actual loading
            if (typeof window !== 'undefined' && window.performance) {
                // Remove unused 'entries'
                const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

                if (navigation) {
                    // Calculate progress based on navigation timing
                    const loadTime = navigation.loadEventEnd || navigation.domContentLoadedEventEnd || navigation.domComplete;
                    const totalTime = navigation.responseEnd;

                    if (loadTime > 0 && totalTime > 0) {
                        const ratio = Math.min(loadTime / (totalTime * 3), 1);
                        setLoadProgress(prev => Math.max(prev, ratio * 100));
                    }
                }

                // Also check document readyState
                if (document.readyState === 'complete') {
                    setLoadProgress(100);
                } else if (document.readyState === 'interactive') {
                    setLoadProgress(prev => Math.max(prev, 70));
                } else {
                    // Increment slowly if still loading
                    setLoadProgress(prev => Math.min(prev + 0.5, 60));
                }
            }

            animationFrame = requestAnimationFrame(updateProgress);
        };

        // Start tracking
        updateProgress();

        // Listen for load complete
        const handleLoad = () => setLoadProgress(100);
        window.addEventListener('load', handleLoad);

        return () => {
            cancelAnimationFrame(animationFrame);
            window.removeEventListener('load', handleLoad);
        };
    }, []);

    // Update message based on load progress
    useEffect(() => {
        const messageIndex = Math.min(
            Math.floor((loadProgress / 100) * BOOT_MESSAGES.length),
            BOOT_MESSAGES.length - 1
        );

        if (messageIndex !== currentMessageIndex) {
            setTimeout(() => {
                setDisplayedText("");
                setCurrentMessageIndex(messageIndex);
            }, 0);
        }
    }, [loadProgress, currentMessageIndex]);

    // Typewriter effect for current message
    useEffect(() => {
        const currentMessage = BOOT_MESSAGES[currentMessageIndex];

        if (displayedText.length < currentMessage.length) {
            const typeTimer = setTimeout(() => {
                setDisplayedText(currentMessage.slice(0, displayedText.length + 1));
            }, 30);
            return () => clearTimeout(typeTimer);
        }
    }, [currentMessageIndex, displayedText]);

    // Fade out when fully loaded
    useEffect(() => {
        if (loadProgress >= 100 && displayedText === BOOT_MESSAGES[BOOT_MESSAGES.length - 1]) {
            const fadeTimer = setTimeout(() => {
                setIsFadingOut(true);
                setTimeout(() => {
                    setIsComplete(true);
                    setBooted(true);
                }, 600);
            }, 500);
            return () => clearTimeout(fadeTimer);
        }
    }, [loadProgress, displayedText, setBooted]);

    if (isComplete) return null;

    return (
        <div
            className={`
                fixed inset-0 z-[99999] flex flex-col items-center justify-center
                transition-all duration-500 ease-out
                ${isFadingOut ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}
            `}
            style={{ background: 'var(--desktop-bg)' }}
        >
            {/* Soft decorative dots pattern */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `radial-gradient(circle, var(--boot-dots) 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                }}
            />

            {/* Floating decorative hearts */}
            <div className="absolute top-20 left-20 text-4xl opacity-20 animate-bounce" style={{ animationDuration: '3s', color: 'var(--boot-hearts)' }}>♡</div>
            <div className="absolute top-32 right-24 text-2xl opacity-15 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s', color: 'var(--boot-hearts)' }}>♡</div>
            <div className="absolute bottom-32 left-32 text-3xl opacity-20 animate-bounce" style={{ animationDuration: '2.8s', animationDelay: '1s', color: 'var(--boot-hearts)' }}>♡</div>

            {/* Logo Container */}
            <div className="relative mb-6">
                {/* Logo with gentle bounce */}
                <div
                    className="relative w-36 h-36 md:w-44 md:h-44"
                    style={{ animation: 'gentle-float 2.5s ease-in-out infinite' }}
                >
                    <Image
                        src="/assets/maiveclogo.png"
                        alt="Mai"
                        fill
                        className="object-contain"
                        priority
                        sizes="(max-width: 768px) 144px, 176px"
                    />
                </div>
            </div>

            {/* Title */}
            <h1
                className="text-3xl md:text-4xl font-bold mb-2"
                style={{
                    color: 'var(--boot-title)',
                    fontFamily: 'var(--font-fredoka), var(--font-mplus), sans-serif'
                }}
            >
                MaiOS
            </h1>

            <p className="text-sm mb-8" style={{ color: 'var(--mai-subtext)' }}>
                Your cozy desktop companion~
            </p>

            {/* Current message */}
            <div
                className="mb-8 px-8 py-4 rounded-3xl"
                style={{
                    background: 'var(--boot-card-bg)',
                    border: '2px solid var(--mai-border)',
                    boxShadow: 'none',
                    minWidth: '280px',
                    textAlign: 'center'
                }}
            >
                <span style={{ color: 'var(--mai-text)', fontSize: '0.95rem', fontWeight: 'bold' }}>
                    {displayedText || BOOT_MESSAGES[currentMessageIndex]}
                    {loadProgress < 100 && (
                        <span className="animate-pulse" style={{ color: 'var(--mai-primary)' }}> ●</span>
                    )}
                </span>
            </div>

            {/* Progress bar */}
            <div className="w-64 md:w-80">
                <div
                    className="h-4 rounded-full overflow-hidden"
                    style={{
                        background: 'var(--boot-progress-bg)',
                        border: '2px solid var(--mai-border)'
                    }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-300 ease-out"
                        style={{
                            width: `${loadProgress}%`,
                            background: 'var(--boot-progress-fill)'
                        }}
                    />
                </div>
                <div className="text-center mt-3 font-mono" style={{ color: 'var(--boot-footer)', fontSize: '0.75rem' }}>
                    {Math.round(loadProgress)}%
                </div>
            </div>

            {/* Footer */}
            <div
                className="absolute bottom-8 text-xs"
                style={{ color: 'var(--boot-footer)' }}
            >
                Mai Aphrodite • made with ♡
            </div>

            {/* Keyframes */}
            <style jsx>{`
                @keyframes gentle-float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
            `}</style>
        </div>
    );
};

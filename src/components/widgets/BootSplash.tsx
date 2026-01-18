"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

const BOOT_MESSAGES = [
    "Waking up Mai...",
    "Preparing your cozy space...",
    "Loading cute things...",
    "Almost ready~",
    "Welcome back! ♡"
];

export const BootSplash = () => {
    const [loadProgress, setLoadProgress] = useState(0);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [isComplete, setIsComplete] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [isDark, setIsDark] = useState(false);

    // Detect theme
    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
        };
        checkTheme();

        // Watch for theme changes
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        return () => observer.disconnect();
    }, []);

    // Track actual browser load progress
    useEffect(() => {
        let animationFrame: number;

        const updateProgress = () => {
            // Use Performance API to track actual loading
            if (typeof window !== 'undefined' && window.performance) {
                const entries = performance.getEntriesByType('resource');
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
            setDisplayedText("");
            setCurrentMessageIndex(messageIndex);
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
                setTimeout(() => setIsComplete(true), 600);
            }, 500);
            return () => clearTimeout(fadeTimer);
        }
    }, [loadProgress, displayedText]);

    if (isComplete) return null;

    // Theme-aware colors
    const theme = {
        bg: isDark
            ? 'linear-gradient(135deg, #1E1E2E 0%, #2D2D3A 50%, #181825 100%)'
            : 'linear-gradient(135deg, #FDFDD0 0%, #FFE4EC 50%, #FFD1DC 100%)',
        dots: isDark ? '#FF69B4' : '#FFB6C1',
        glow: isDark ? 'rgba(255, 105, 180, 0.4)' : '#FFB6C1',
        title: isDark ? '#E0E0E0' : '#2D2D3A',
        subtitle: isDark ? '#A0A0A0' : '#6B7280',
        cardBg: isDark ? 'rgba(45, 45, 58, 0.8)' : 'rgba(255, 255, 255, 0.7)',
        cardBorder: isDark ? '#FF69B4' : '#FFD1DC',
        text: isDark ? '#E0E0E0' : '#4A4A4A',
        progressBg: isDark ? 'rgba(30, 30, 46, 0.8)' : 'rgba(255, 255, 255, 0.6)',
        progressFill: isDark
            ? 'linear-gradient(90deg, #FF69B4 0%, #00FFFF 100%)'
            : 'linear-gradient(90deg, #FF69B4 0%, #FFB6C1 100%)',
        footer: isDark ? '#6B7280' : '#9CA3AF',
        hearts: isDark ? '#FF69B4' : '#FFB6C1'
    };

    return (
        <div
            className={`
                fixed inset-0 z-[99999] flex flex-col items-center justify-center
                transition-all duration-500 ease-out
                ${isFadingOut ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}
            `}
            style={{ background: theme.bg }}
        >
            {/* Soft decorative dots pattern */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `radial-gradient(circle, ${theme.dots} 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                }}
            />

            {/* Floating decorative hearts */}
            <div className="absolute top-20 left-20 text-4xl opacity-20 animate-bounce" style={{ animationDuration: '3s', color: theme.hearts }}>♡</div>
            <div className="absolute top-32 right-24 text-2xl opacity-15 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s', color: theme.hearts }}>♡</div>
            <div className="absolute bottom-32 left-32 text-3xl opacity-20 animate-bounce" style={{ animationDuration: '2.8s', animationDelay: '1s', color: theme.hearts }}>♡</div>

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
                    />
                </div>
            </div>

            {/* Title */}
            <h1
                className="text-3xl md:text-4xl font-bold mb-2"
                style={{
                    color: theme.title,
                    fontFamily: 'var(--font-fredoka), var(--font-mplus), sans-serif'
                }}
            >
                MaiOS
            </h1>

            <p className="text-sm mb-8" style={{ color: theme.subtitle }}>
                Your cozy desktop companion~
            </p>

            {/* Current message */}
            <div
                className="mb-8 px-6 py-3 rounded-2xl"
                style={{
                    background: theme.cardBg,
                    border: `2px solid ${theme.cardBorder}`,
                    minWidth: '280px',
                    textAlign: 'center'
                }}
            >
                <span style={{ color: theme.text, fontSize: '0.95rem' }}>
                    {displayedText || BOOT_MESSAGES[currentMessageIndex]}
                    {loadProgress < 100 && (
                        <span className="animate-pulse" style={{ color: '#FF69B4' }}> ●</span>
                    )}
                </span>
            </div>

            {/* Progress bar */}
            <div className="w-64 md:w-80">
                <div
                    className="h-3 rounded-full overflow-hidden"
                    style={{
                        background: theme.progressBg,
                        border: `2px solid ${theme.cardBorder}`
                    }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-300 ease-out"
                        style={{
                            width: `${loadProgress}%`,
                            background: theme.progressFill
                        }}
                    />
                </div>
                <div className="text-center mt-3" style={{ color: theme.footer, fontSize: '0.75rem' }}>
                    {Math.round(loadProgress)}%
                </div>
            </div>

            {/* Footer */}
            <div
                className="absolute bottom-8 text-xs"
                style={{ color: theme.footer }}
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

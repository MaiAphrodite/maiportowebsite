"use client";

import { useEffect, useRef } from 'react';

interface GestureOptions {
    onBack?: () => void;
    onHome?: () => void;
    edgeThreshold?: number; // How close to edge to start (pixels)
    swipeThreshold?: number; // Min distance to trigger (pixels)
}

/**
 * Hook to handle mobile edge swipe gestures (back/home).
 * Since native gestures may not work reliably in fullscreen PWAs,
 * this provides explicit touch-based gesture detection.
 */
export const useMobileGestures = (options: GestureOptions = {}) => {
    const {
        onBack,
        onHome,
        edgeThreshold = 20, // Start within 20px of left edge for back
        swipeThreshold = 80, // Swipe at least 80px to trigger
    } = options;

    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            touchStartRef.current = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now(),
            };
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStartRef.current) return;

            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartRef.current.x;
            const deltaY = touch.clientY - touchStartRef.current.y;
            const deltaTime = Date.now() - touchStartRef.current.time;
            const startX = touchStartRef.current.x;
            const startY = touchStartRef.current.y;

            // Only trigger if swipe was fast enough (under 400ms)
            if (deltaTime > 400) {
                touchStartRef.current = null;
                return;
            }

            // Ensure horizontal movement is dominant
            if (Math.abs(deltaX) < Math.abs(deltaY) * 1.5) {
                touchStartRef.current = null;
                return;
            }

            // Back gesture: Start from left edge, swipe right
            if (startX <= edgeThreshold && deltaX >= swipeThreshold && onBack) {
                e.preventDefault();
                onBack();
            }

            // Home gesture: Swipe up from bottom edge
            const screenHeight = window.innerHeight;
            if (
                startY >= screenHeight - 30 && // Start within 30px of bottom
                deltaY <= -swipeThreshold && // Swipe up
                onHome
            ) {
                e.preventDefault();
                onHome();
            }

            touchStartRef.current = null;
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: false });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [edgeThreshold, swipeThreshold, onBack, onHome]);
};

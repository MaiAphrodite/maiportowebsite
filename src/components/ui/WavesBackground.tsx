'use client';

import React, { useEffect, useRef } from 'react';
import { topoFieldRef, topoTransitionRef } from '@/lib/topoTransitionBridge';

// Helper: simple eased interpolation
function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const WavesBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseRef = useRef({ x: -1000, y: -1000, prevX: -1000, prevY: -1000 });
    const stirTrailRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number }>>([]);

    // Transition State
    const transitionState = useRef({
        isActive: false,
        startTime: 0,
        duration: 2000,
        targetTheme: 'dark' as 'light' | 'dark',
        onComplete: null as (() => void) | null,
        hasSwapped: false,
        origin: { x: 0, y: 0 }
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = 0;
        let height = 0;
        let time = 0;

        // OPTIMIZATION: Further increased cellSize for better performance
        const cellSize = 18;
        const contourCount = 6;
        const speed = 0.005;

        // Colors
        let currentThemeColors = { line: '', bg: '' };
        let nextThemeColors = { line: '', bg: '' };

        let field: Float32Array;
        let cols = 0;
        let rows = 0;

        const getThemeColors = (theme: 'light' | 'dark') => {
            if (theme === 'dark') {
                return {
                    line: 'rgba(245, 194, 231, 0.30)',
                    fill: '#1e1e2e',
                    accent: '#f5c2e7'
                };
            } else {
                return {
                    line: 'rgba(234, 118, 203, 0.30)',
                    fill: '#eff1f5',
                    accent: '#ea76cb'
                };
            }
        };

        const updateDimensions = () => {
            width = container.offsetWidth;
            height = container.offsetHeight;

            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            cols = Math.ceil(width / cellSize) + 2;
            rows = Math.ceil(height / cellSize) + 2;
            field = new Float32Array(cols * rows);

            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            currentThemeColors = getThemeColors(isDark ? 'dark' : 'light');
            nextThemeColors = getThemeColors(isDark ? 'light' : 'dark');
        };

        const handleMouseMove = (e: MouseEvent) => {
            const prev = mouseRef.current;
            const vx = e.clientX - prev.x;
            const vy = e.clientY - prev.y;
            const speed = Math.sqrt(vx * vx + vy * vy);

            if (speed > 2) {
                stirTrailRef.current.push({
                    x: e.clientX,
                    y: e.clientY,
                    vx: vx,
                    vy: vy,
                    life: 1.0
                });
                if (stirTrailRef.current.length > 30) {
                    stirTrailRef.current.shift();
                }
            }
            mouseRef.current = { x: e.clientX, y: e.clientY, prevX: prev.x, prevY: prev.y };
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                const prev = mouseRef.current;
                const tx = e.touches[0].clientX;
                const ty = e.touches[0].clientY;
                const vx = tx - prev.x;
                const vy = ty - prev.y;
                const speed = Math.sqrt(vx * vx + vy * vy);
                if (speed > 2) {
                    stirTrailRef.current.push({ x: tx, y: ty, vx, vy, life: 1.0 });
                    if (stirTrailRef.current.length > 30) stirTrailRef.current.shift();
                }
                mouseRef.current = { x: tx, y: ty, prevX: prev.x, prevY: prev.y };
            }
        };

        const lerp = (a: number, b: number, level: number) => (level - a) / (b - a);

        const draw = (now: number) => {
            let tProgress = 0;
            let eProgress = 0;

            if (transitionState.current.isActive) {
                const elapsed = now - transitionState.current.startTime;
                tProgress = Math.min(elapsed / transitionState.current.duration, 1.0);
                eProgress = easeInOutCubic(tProgress);

                if (tProgress > 0.6 && !transitionState.current.hasSwapped) {
                    transitionState.current.hasSwapped = true;
                    if (transitionState.current.onComplete) {
                        transitionState.current.onComplete();
                    }
                }

                if (tProgress >= 1.0) {
                    transitionState.current.isActive = false;
                }
            }

            ctx.clearRect(0, 0, width, height);

            // Field generation
            const cx1 = width * 0.15 + Math.sin(time * 0.07) * 120;
            const cy1 = height * 0.3 + Math.cos(time * 0.09) * 100;
            const cx2 = width * 0.85 + Math.cos(time * 0.06) * 130;
            const cy2 = height * 0.25 + Math.sin(time * 0.08) * 110;
            const cx3 = width * 0.5 + Math.sin(time * 0.05) * 150;
            const cy3 = height * 0.8 + Math.cos(time * 0.07) * 90;
            const cx4 = width * 0.25 + Math.cos(time * 0.08) * 100;
            const cy4 = height * 0.7 + Math.sin(time * 0.06) * 120;
            const cx5 = width * 0.75 + Math.sin(time * 0.09) * 110;
            const cy5 = height * 0.55 + Math.cos(time * 0.05) * 130;

            let minVal = Infinity, maxVal = -Infinity;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const px = col * cellSize;
                    const py = row * cellSize;

                    const d1 = Math.sqrt((px - cx1) ** 2 + (py - cy1) ** 2);
                    const d2 = Math.sqrt((px - cx2) ** 2 + (py - cy2) ** 2);
                    const d3 = Math.sqrt((px - cx3) ** 2 + (py - cy3) ** 2);
                    const d4 = Math.sqrt((px - cx4) ** 2 + (py - cy4) ** 2);
                    const d5 = Math.sqrt((px - cx5) ** 2 + (py - cy5) ** 2);

                    const val = Math.sin(d1 * 0.006 + time * 0.25) * 1.0
                        + Math.sin(d2 * 0.008 - time * 0.20) * 0.8
                        + Math.cos(d3 * 0.010 + time * 0.15) * 0.6
                        + Math.sin(d4 * 0.012 - time * 0.18) * 0.5
                        + Math.cos(d5 * 0.014 + time * 0.12) * 0.4
                        + Math.sin(px * 0.004 + py * 0.003 + time * 0.3) * 0.3;

                    field[row * cols + col] = val;

                    if (val < minVal) minVal = val;
                    if (val > maxVal) maxVal = val;
                }
            }

            // Trail
            const trail = stirTrailRef.current;
            for (let s = trail.length - 1; s >= 0; s--) {
                trail[s].life -= 0.008;
                if (trail[s].life <= 0) trail.splice(s, 1);
            }
            if (trail.length > 0) {
                const pushRadius = 120;
                const pushR2 = pushRadius * pushRadius;
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        const px = col * cellSize;
                        const py = row * cellSize;
                        let push = 0;
                        for (let s = 0; s < trail.length; s++) {
                            const sp = trail[s];
                            const dx = px - sp.x; const dy = py - sp.y; const d2 = dx * dx + dy * dy;
                            if (d2 < pushR2) push += (1 - d2 / pushR2) ** 2 * sp.life * 0.15;
                        }
                        field[row * cols + col] += push;
                    }
                }
            }


            // Draw Logic
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            const drawContours = (currentCtx: CanvasRenderingContext2D, isNewTheme: boolean) => {
                currentCtx.strokeStyle = isNewTheme ? nextThemeColors.line : currentThemeColors.line;
                currentCtx.lineWidth = isNewTheme ? 1.2 : 0.8;

                for (let c = 0; c < contourCount; c++) {
                    const level = minVal + (maxVal - minVal) * (c + 1) / (contourCount + 1);
                    currentCtx.beginPath();

                    for (let row = 0; row < rows - 1; row++) {
                        for (let col = 0; col < cols - 1; col++) {
                            const idx = row * cols + col;
                            const tl = field[idx]; const tr = field[idx + 1];
                            const bl = field[idx + cols]; const br = field[idx + cols + 1];

                            let ci = 0;
                            if (tl > level) ci |= 1; if (tr > level) ci |= 2;
                            if (br > level) ci |= 4; if (bl > level) ci |= 8;
                            if (ci === 0 || ci === 15) continue;

                            const x0 = col * cellSize; const y0 = row * cellSize;
                            const topX = x0 + lerp(tl, tr, level) * cellSize; const topY = y0;
                            const rightX = x0 + cellSize; const rightY = y0 + lerp(tr, br, level) * cellSize;
                            const bottomX = x0 + lerp(bl, br, level) * cellSize; const bottomY = y0 + cellSize;
                            const leftX = x0; const leftY = y0 + lerp(tl, bl, level) * cellSize;

                            switch (ci) {
                                case 1: case 14: currentCtx.moveTo(topX, topY); currentCtx.lineTo(leftX, leftY); break;
                                case 2: case 13: currentCtx.moveTo(topX, topY); currentCtx.lineTo(rightX, rightY); break;
                                case 3: case 12: currentCtx.moveTo(leftX, leftY); currentCtx.lineTo(rightX, rightY); break;
                                case 4: case 11: currentCtx.moveTo(rightX, rightY); currentCtx.lineTo(bottomX, bottomY); break;
                                case 5: currentCtx.moveTo(topX, topY); currentCtx.lineTo(rightX, rightY); currentCtx.moveTo(bottomX, bottomY); currentCtx.lineTo(leftX, leftY); break;
                                case 6: case 9: currentCtx.moveTo(topX, topY); currentCtx.lineTo(bottomX, bottomY); break;
                                case 7: case 8: currentCtx.moveTo(leftX, leftY); currentCtx.lineTo(bottomX, bottomY); break;
                                case 10: currentCtx.moveTo(topX, topY); currentCtx.lineTo(leftX, leftY); currentCtx.moveTo(rightX, rightY); currentCtx.lineTo(bottomX, bottomY); break;
                            }
                        }
                    }
                    currentCtx.stroke();
                }
            };

            // 1. Draw OLD Theme
            drawContours(ctx, false);

            // 2. Draw NEW Theme (Peak Flood Mask)
            if (transitionState.current.isActive) {
                const nextColors = getThemeColors(transitionState.current.targetTheme);
                const range = maxVal - minVal;
                const buffer = range * 0.1;
                const floodLevel = (maxVal + buffer) - ((range + buffer * 2) * eProgress);

                // --- OPTIMIZED SINGLE PASS ---
                // We combine the fill path generation and logic to avoid redundant iterations if possible
                // But for now, we just rely on the coarser grid (cellSize=18)

                // Fill Path
                ctx.save();
                ctx.beginPath();

                for (let row = 0; row < rows - 1; row++) {
                    for (let col = 0; col < cols - 1; col++) {
                        const idx = row * cols + col;
                        const tl = field[idx]; const tr = field[idx + 1];
                        const bl = field[idx + cols]; const br = field[idx + cols + 1];

                        let ci = 0;
                        if (tl > floodLevel) ci |= 1; if (tr > floodLevel) ci |= 2;
                        if (br > floodLevel) ci |= 4; if (bl > floodLevel) ci |= 8;
                        if (ci === 0) continue;

                        const x0 = col * cellSize; const y0 = row * cellSize;
                        const pt = (v1: number, v2: number) => lerp(v1, v2, floodLevel) * cellSize;

                        const topX = x0 + pt(tl, tr); const topY = y0;
                        const rightX = x0 + cellSize; const rightY = y0 + pt(tr, br);
                        const bottomX = x0 + pt(bl, br); const bottomY = y0 + cellSize;
                        const leftX = x0; const leftY = y0 + pt(tl, bl);

                        switch (ci) {
                            case 15: ctx.rect(x0, y0, cellSize, cellSize); break;
                            case 1: ctx.moveTo(x0, y0); ctx.lineTo(topX, topY); ctx.lineTo(leftX, leftY); ctx.closePath(); break;
                            case 2: ctx.moveTo(topX, topY); ctx.lineTo(x0 + cellSize, y0); ctx.lineTo(rightX, rightY); ctx.closePath(); break;
                            case 3: ctx.moveTo(x0, y0); ctx.lineTo(x0 + cellSize, y0); ctx.lineTo(rightX, rightY); ctx.lineTo(leftX, leftY); ctx.closePath(); break;
                            case 4: ctx.moveTo(rightX, rightY); ctx.lineTo(x0 + cellSize, y0 + cellSize); ctx.lineTo(bottomX, bottomY); ctx.closePath(); break;
                            case 5:
                                ctx.moveTo(x0, y0); ctx.lineTo(topX, topY); ctx.lineTo(leftX, leftY); ctx.closePath();
                                ctx.moveTo(rightX, rightY); ctx.lineTo(x0 + cellSize, y0 + cellSize); ctx.lineTo(bottomX, bottomY); ctx.closePath();
                                break;
                            case 6: ctx.moveTo(topX, topY); ctx.lineTo(x0 + cellSize, y0); ctx.lineTo(x0 + cellSize, y0 + cellSize); ctx.lineTo(bottomX, bottomY); ctx.closePath(); break;
                            case 7: ctx.moveTo(x0, y0); ctx.lineTo(x0 + cellSize, y0); ctx.lineTo(x0 + cellSize, y0 + cellSize); ctx.lineTo(bottomX, bottomY); ctx.lineTo(leftX, leftY); ctx.closePath(); break;
                            case 8: ctx.moveTo(leftX, leftY); ctx.lineTo(bottomX, bottomY); ctx.lineTo(x0, y0 + cellSize); ctx.closePath(); break;
                            case 9: ctx.moveTo(x0, y0); ctx.lineTo(topX, topY); ctx.lineTo(bottomX, bottomY); ctx.lineTo(x0, y0 + cellSize); ctx.closePath(); break;
                            case 10:
                                ctx.moveTo(topX, topY); ctx.lineTo(x0 + cellSize, y0); ctx.lineTo(rightX, rightY); ctx.closePath();
                                ctx.moveTo(leftX, leftY); ctx.lineTo(bottomX, bottomY); ctx.lineTo(x0, y0 + cellSize); ctx.closePath();
                                break;
                            case 11: ctx.moveTo(x0, y0); ctx.lineTo(x0 + cellSize, y0); ctx.lineTo(rightX, rightY); ctx.lineTo(bottomX, bottomY); ctx.lineTo(x0, y0 + cellSize); ctx.closePath(); break;
                            case 12: ctx.moveTo(leftX, leftY); ctx.lineTo(rightX, rightY); ctx.lineTo(x0 + cellSize, y0 + cellSize); ctx.lineTo(x0, y0 + cellSize); ctx.closePath(); break;
                            case 13: ctx.moveTo(x0, y0); ctx.lineTo(topX, topY); ctx.lineTo(rightX, rightY); ctx.lineTo(x0 + cellSize, y0 + cellSize); ctx.lineTo(x0, y0 + cellSize); ctx.closePath(); break;
                            case 14: ctx.moveTo(topX, topY); ctx.lineTo(x0 + cellSize, y0); ctx.lineTo(x0 + cellSize, y0 + cellSize); ctx.lineTo(bottomX, bottomY); ctx.lineTo(leftX, leftY); ctx.closePath(); break;
                        }
                    }
                }

                ctx.fillStyle = nextColors.fill;
                ctx.fill();
                ctx.clip();
                drawContours(ctx, true);
                ctx.restore();


                // --- PASS 2: SHORELINE (No Glow for Perf) ---
                // Removed shadowBlur to fix lag

                ctx.save();
                ctx.beginPath();

                for (let row = 0; row < rows - 1; row++) {
                    for (let col = 0; col < cols - 1; col++) {
                        const idx = row * cols + col;
                        const tl = field[idx]; const tr = field[idx + 1];
                        const bl = field[idx + cols]; const br = field[idx + cols + 1];

                        let ci = 0;
                        if (tl > floodLevel) ci |= 1; if (tr > floodLevel) ci |= 2;
                        if (br > floodLevel) ci |= 4; if (bl > floodLevel) ci |= 8;
                        if (ci === 0 || ci === 15) continue;

                        const x0 = col * cellSize; const y0 = row * cellSize;
                        const pt = (v1: number, v2: number) => lerp(v1, v2, floodLevel) * cellSize;
                        const topX = x0 + pt(tl, tr); const topY = y0;
                        const rightX = x0 + cellSize; const rightY = y0 + pt(tr, br);
                        const bottomX = x0 + pt(bl, br); const bottomY = y0 + cellSize;
                        const leftX = x0; const leftY = y0 + pt(tl, bl);

                        switch (ci) {
                            case 1: ctx.moveTo(topX, topY); ctx.lineTo(leftX, leftY); break;
                            case 2: ctx.moveTo(topX, topY); ctx.lineTo(rightX, rightY); break;
                            case 3: ctx.moveTo(leftX, leftY); ctx.lineTo(rightX, rightY); break;
                            case 4: ctx.moveTo(rightX, rightY); ctx.lineTo(bottomX, bottomY); break;
                            case 5: ctx.moveTo(topX, topY); ctx.lineTo(leftX, leftY); ctx.moveTo(rightX, rightY); ctx.lineTo(bottomX, bottomY); break;
                            case 6: ctx.moveTo(topX, topY); ctx.lineTo(bottomX, bottomY); break;
                            case 7: ctx.moveTo(leftX, leftY); ctx.lineTo(bottomX, bottomY); break;
                            case 8: ctx.moveTo(leftX, leftY); ctx.lineTo(bottomX, bottomY); break;
                            case 9: ctx.moveTo(topX, topY); ctx.lineTo(bottomX, bottomY); break;
                            case 10: ctx.moveTo(topX, topY); ctx.lineTo(rightX, rightY); ctx.moveTo(leftX, leftY); ctx.lineTo(bottomX, bottomY); break;
                            case 11: ctx.moveTo(rightX, rightY); ctx.lineTo(bottomX, bottomY); break;
                            case 12: ctx.moveTo(leftX, leftY); ctx.lineTo(rightX, rightY); break;
                            case 13: ctx.moveTo(topX, topY); ctx.lineTo(rightX, rightY); break;
                            case 14: ctx.moveTo(topX, topY); ctx.lineTo(leftX, leftY); break;
                        }
                    }
                }

                // No shadowBlur here
                ctx.strokeStyle = nextColors.accent;
                ctx.lineWidth = 1.0;
                ctx.stroke();
                ctx.restore();
            }

            time += speed;
            animationFrameId = requestAnimationFrame(draw);
        };

        updateDimensions();

        topoTransitionRef.current = (newTheme, onComplete, origin) => {
            const center = { x: width / 2, y: height / 2 };
            transitionState.current = {
                isActive: true,
                startTime: performance.now(),
                duration: 2000,
                targetTheme: newTheme,
                onComplete: onComplete,
                hasSwapped: false,
                origin: origin || center
            };
        };

        const observer = new MutationObserver(() => {
            updateDimensions();
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'style', 'data-theme']
        });

        window.addEventListener('resize', updateDimensions);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);

        const startLoop = (now: number) => {
            draw(now);
        };
        animationFrameId = requestAnimationFrame(startLoop);

        return () => {
            topoTransitionRef.current = null;
            window.removeEventListener('resize', updateDimensions);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            cancelAnimationFrame(animationFrameId);
            observer.disconnect();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{ isolation: 'isolate' }}
        >
            <canvas ref={canvasRef} />
        </div>
    );
};

export default WavesBackground;

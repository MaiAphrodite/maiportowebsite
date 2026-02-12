'use client';

import React, { useEffect, useRef } from 'react';

const WavesBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseRef = useRef({ x: -1000, y: -1000, prevX: -1000, prevY: -1000 });
    // Trail of "stir" disturbances that fade over time
    const stirTrailRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number }>>([]);

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

        // Configuration
        const cellSize = 8;         // Fine grid for smooth contour curves
        const contourCount = 8;    // Minimal, clean contour lines
        const speed = 0.005;

        let lineColor = '';
        let field: Float32Array;
        let cols = 0;
        let rows = 0;

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

            const style = getComputedStyle(document.documentElement);
            // Use the theme's border color (usually pink) with very low opacity
            // This gives the "pink but with this tone" look
            const pinkRaw = style.getPropertyValue('--mai-border').trim() || '#f5c2e7';

            // Parse hex to rgb to add alpha
            const tempEl = document.createElement('div');
            tempEl.style.color = pinkRaw;
            document.body.appendChild(tempEl);
            const computed = getComputedStyle(tempEl).color;
            document.body.removeChild(tempEl);

            const match = computed.match(/(\d+)/g);
            if (match && match.length >= 3) {
                lineColor = `rgba(${match[0]}, ${match[1]}, ${match[2]}, 0.30)`;
            } else {
                lineColor = 'rgba(245, 194, 231, 0.30)';
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            const prev = mouseRef.current;
            const vx = e.clientX - prev.x;
            const vy = e.clientY - prev.y;
            const speed = Math.sqrt(vx * vx + vy * vy);

            // Only add stir points when actually moving
            if (speed > 2) {
                stirTrailRef.current.push({
                    x: e.clientX,
                    y: e.clientY,
                    vx: vx,
                    vy: vy,
                    life: 1.0 // starts at 1, fades to 0
                });
                // Keep trail manageable (max 30 points)
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

        // Linear interpolation helper
        const lerp = (a: number, b: number, level: number) => (level - a) / (b - a);

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 0.8;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            const _mouseX = mouseRef.current.x;
            const _mouseY = mouseRef.current.y;

            // === Drifting epicenters (3 broad sources) ===
            const cx1 = width * 0.3 + Math.sin(time * 0.1) * 250;
            const cy1 = height * 0.4 + Math.cos(time * 0.13) * 200;

            const cx2 = width * 0.7 + Math.cos(time * 0.08) * 280;
            const cy2 = height * 0.6 + Math.sin(time * 0.07) * 220;

            const cx3 = width * 0.5 + Math.sin(time * 0.06) * 300;
            const cy3 = height * 0.25 + Math.cos(time * 0.09) * 260;

            // === 1. Compute 2D noise field ===
            let minVal = Infinity, maxVal = -Infinity;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const px = col * cellSize;
                    const py = row * cellSize;

                    // Radial distances + angles (for spirals)
                    const ddx1 = px - cx1, ddy1 = py - cy1;
                    const d1 = Math.sqrt(ddx1 * ddx1 + ddy1 * ddy1);
                    const a1 = Math.atan2(ddy1, ddx1); // angle from center

                    const ddx2 = px - cx2, ddy2 = py - cy2;
                    const d2 = Math.sqrt(ddx2 * ddx2 + ddy2 * ddy2);
                    const a2 = Math.atan2(ddy2, ddx2);

                    const ddx3 = px - cx3, ddy3 = py - cy3;
                    const d3 = Math.sqrt(ddx3 * ddx3 + ddy3 * ddy3);
                    const a3 = Math.atan2(ddy3, ddx3);

                    // Spiral waves: sin(distance + angle * arms + time)
                    // The angle term makes rings twist into spirals
                    // Different arm counts (1, 2, 1) create varied spiral shapes
                    const val = Math.sin(d1 * 0.008 + a1 * 1.0 + time * 0.3)
                        + Math.sin(d2 * 0.010 + a2 * 2.0 - time * 0.2) * 0.7
                        + Math.cos(d3 * 0.012 + a3 * 1.0 + time * 0.15) * 0.5
                        + Math.sin(px * 0.005 + py * 0.003 + time * 0.4) * 0.3;

                    const idx = row * cols + col;
                    field[idx] = val;

                    if (val < minVal) minVal = val;
                    if (val > maxVal) maxVal = val;
                }
            }

            // === Knife-cut trail: clip contour segments near mouse path ===
            const trail = stirTrailRef.current;

            // Trail decay
            for (let s = trail.length - 1; s >= 0; s--) {
                trail[s].life -= 0.008; // ~2 seconds to fully fade
                if (trail[s].life <= 0) {
                    trail.splice(s, 1);
                }
            }

            // Subtle push: gently bend contours away from trail (wider than clip zone)
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
                            const dx = px - sp.x;
                            const dy = py - sp.y;
                            const d2 = dx * dx + dy * dy;
                            if (d2 < pushR2) {
                                const r = 1 - d2 / pushR2;
                                push += r * r * sp.life * 0.15;
                            }
                        }
                        field[row * cols + col] += push;
                    }
                }
            }

            // === 2. Extract contours using Marching Squares ===
            for (let c = 0; c < contourCount; c++) {
                const level = minVal + (maxVal - minVal) * (c + 1) / (contourCount + 1);

                ctx.beginPath();

                for (let row = 0; row < rows - 1; row++) {
                    for (let col = 0; col < cols - 1; col++) {
                        const idx = row * cols + col;

                        // Corner values
                        const tl = field[idx];
                        const tr = field[idx + 1];
                        const bl = field[idx + cols];
                        const br = field[idx + cols + 1];

                        // Case index (which corners are above threshold)
                        let ci = 0;
                        if (tl > level) ci |= 1;
                        if (tr > level) ci |= 2;
                        if (br > level) ci |= 4;
                        if (bl > level) ci |= 8;

                        // Skip empty/full cells
                        if (ci === 0 || ci === 15) continue;

                        // Cell center for trail proximity check
                        const cellCenterX = (col + 0.5) * cellSize;
                        const cellCenterY = (row + 0.5) * cellSize;

                        // "Knife cut": skip this cell if it's near the mouse trail
                        let clipped = false;
                        for (let s = 0; s < trail.length; s++) {
                            const sp = trail[s];
                            const tdx = cellCenterX - sp.x;
                            const tdy = cellCenterY - sp.y;
                            const cutR = 60 * sp.life; // Radius shrinks as it fades
                            if (tdx * tdx + tdy * tdy < cutR * cutR) {
                                clipped = true;
                                break;
                            }
                        }
                        if (clipped) continue;

                        // Cell origin
                        const x0 = col * cellSize;
                        const y0 = row * cellSize;

                        // Interpolated edge crossing points
                        const topX = x0 + lerp(tl, tr, level) * cellSize;
                        const topY = y0;
                        const rightX = x0 + cellSize;
                        const rightY = y0 + lerp(tr, br, level) * cellSize;
                        const bottomX = x0 + lerp(bl, br, level) * cellSize;
                        const bottomY = y0 + cellSize;
                        const leftX = x0;
                        const leftY = y0 + lerp(tl, bl, level) * cellSize;

                        // Draw line segments based on marching squares case
                        switch (ci) {
                            case 1: case 14:
                                ctx.moveTo(topX, topY); ctx.lineTo(leftX, leftY); break;
                            case 2: case 13:
                                ctx.moveTo(topX, topY); ctx.lineTo(rightX, rightY); break;
                            case 3: case 12:
                                ctx.moveTo(leftX, leftY); ctx.lineTo(rightX, rightY); break;
                            case 4: case 11:
                                ctx.moveTo(rightX, rightY); ctx.lineTo(bottomX, bottomY); break;
                            case 5:
                                ctx.moveTo(topX, topY); ctx.lineTo(rightX, rightY);
                                ctx.moveTo(bottomX, bottomY); ctx.lineTo(leftX, leftY);
                                break;
                            case 6: case 9:
                                ctx.moveTo(topX, topY); ctx.lineTo(bottomX, bottomY); break;
                            case 7: case 8:
                                ctx.moveTo(leftX, leftY); ctx.lineTo(bottomX, bottomY); break;
                            case 10:
                                ctx.moveTo(topX, topY); ctx.lineTo(leftX, leftY);
                                ctx.moveTo(rightX, rightY); ctx.lineTo(bottomX, bottomY);
                                break;
                        }
                    }
                }

                ctx.stroke();
            }

            time += speed;
            animationFrameId = requestAnimationFrame(draw);
        };

        updateDimensions();

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

        draw();

        return () => {
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

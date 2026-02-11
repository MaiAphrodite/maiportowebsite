'use client';

import React, { useEffect, useRef } from 'react';

const WavesBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseRef = useRef({ x: -1000, y: -1000 });

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
        const waveCount = 50;
        const waveSpacing = 30;
        const amplitude = 40;
        const frequency = 0.002;
        const speed = 0.0025;

        // Interaction tweaks for perfect smoothness
        const interactionRadius = 300;
        const interactionForce = 0.8; // Lower force multiplier for this formula

        // Theme colors
        let bgColor = '';
        let lineColor = '';

        const updateDimensions = () => {
            width = container.offsetWidth;
            height = container.offsetHeight;

            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            const style = getComputedStyle(document.documentElement);
            bgColor = style.getPropertyValue('--rice-bg').trim() || '#1e1e2e';
            lineColor = style.getPropertyValue('--mai-border').trim() || '#f5c2e7';
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        }

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1.5;

            const mouseX = mouseRef.current.x;
            const mouseY = mouseRef.current.y;

            for (let i = 0; i < waveCount; i++) {
                ctx.beginPath();
                const baseY = -100 + i * (height + 200) / waveCount;

                for (let x = 0; x <= width; x += 5) {
                    // Multi-frequency Sine Wave
                    const n1 = Math.sin(x * frequency + time + i * 0.2);
                    const n2 = Math.sin(x * (frequency * 2) - time * 1.2 + i * 0.3) * 0.5;
                    const n3 = Math.sin(x * (frequency * 0.5) + time * 0.5) * 0.3;

                    const noise = n1 + n2 + n3;
                    let y = baseY + noise * amplitude;

                    // Mouse Interaction - Hybrid Lens + Smooth Falloff
                    const dx = x - mouseX;
                    const dy = y - mouseY;
                    const dist = Math.hypot(dx, dy);

                    if (dist < interactionRadius) {
                        // 1. Calculate the ratio (0 to 1)
                        const ratio = 1 - (dist / interactionRadius);

                        // 2. Quartic Falloff: (1 - r)^4 or similar
                        // This guarantees the value and its derivative are 0 at the edge.
                        // Using ratio^2 * ratio^2 (power of 4) creates a very smooth "bell" shape
                        // that blends perfectly into the background.
                        const falloff = ratio * ratio * ratio * ratio;

                        // 3. Proportional Displacement (Lens)
                        // Multiply by dy to ensure 0 displacement at center (removes diamond)
                        // Multiply by high-power falloff to ensure 0 displacement at edge (removes circle)
                        y += dy * falloff * interactionForce;
                    }

                    if (x === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }

                ctx.stroke();
            }

            time += speed;
            animationFrameId = requestAnimationFrame(draw);
        };

        // Initialize
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

        // Start loop
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

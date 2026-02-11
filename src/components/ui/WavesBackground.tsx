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
        const waveCount = 40;
        const waveSpacing = 30; // Base vertical spacing
        const amplitude = 30;
        const frequency = 0.015;
        const speed = 0.04;
        const interactionRadius = 250;
        const interactionForce = 80;

        // Theme colors
        let bgColor = '';
        let lineColor = '';

        const updateDimensions = () => {
            width = container.offsetWidth;
            height = container.offsetHeight;

            // Handle high DPI displays
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            // Update colors from CSS variables
            const style = getComputedStyle(document.documentElement);
            bgColor = style.getPropertyValue('--rice-bg').trim() || '#1e1e2e';
            lineColor = style.getPropertyValue('--mai-border').trim() || '#f5c2e7';
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        // Also track touch for mobile
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        }

        const draw = () => {
            // Clear canvas with theme background
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, width, height);

            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1.5;

            const mouseX = mouseRef.current.x;
            const mouseY = mouseRef.current.y;

            // Draw waves
            for (let i = 0; i < waveCount; i++) {
                ctx.beginPath();

                // Base Y position for this wave
                // Distribute waves across the screen height + some buffer
                const baseY = -100 + i * (height + 200) / waveCount;

                for (let x = 0; x <= width; x += 5) { // Step of 5px for smoothness vs performance
                    // Basic Sine Wave
                    // Adding 'i' to phase creates the "offset" effect between lines
                    const noise = Math.sin(x * frequency + time + i * 0.5);
                    let y = baseY + noise * amplitude;

                    // Mouse Interaction
                    const dist = Math.hypot(x - mouseX, y - mouseY); // Distance to mouse

                    if (dist < interactionRadius) {
                        // Calculate force: closer = stronger
                        const force = (interactionRadius - dist) / interactionRadius;

                        // Direction away from mouse
                        // We mainly want to push lines vertically or "around" the cursor
                        // Let's push them away from the cursor in Y direction
                        const dy = y - mouseY;
                        const sign = dy > 0 ? 1 : -1;

                        // A smooth bulge effect
                        y += sign * force * interactionForce;
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
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 -z-10 pointer-events-none"
            style={{ isolation: 'isolate' }}
        >
            <canvas ref={canvasRef} />
        </div>
    );
};

export default WavesBackground;

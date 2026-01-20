"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useDesktop } from '@/features/desktop/context/DesktopContext';
import { commands } from '../lib/commandRegistry';

// Catppuccin Mocha palette for ricing
const COLORS = {
    rosewater: '#F5E0DC',
    flamingo: '#F2CDCD',
    pink: '#F5C2E7',
    mauve: '#CBA6F7',
    red: '#F38BA8',
    maroon: '#EBA0AC',
    peach: '#FAB387',
    yellow: '#F9E2AF',
    green: '#A6E3A1',
    teal: '#94E2D5',
    sky: '#89DCEB',
    sapphire: '#74C7EC',
    blue: '#89B4FA',
    lavender: '#B4BEFE',
    text: '#CDD6F4',
    subtext1: '#BAC2DE',
    subtext0: '#A6ADC8',
    overlay2: '#9399B2',
    overlay1: '#7F849C',
    overlay0: '#6C7086',
    surface2: '#585B70',
    surface1: '#45475A',
    surface0: '#313244',
    base: '#1E1E2E',
    mantle: '#181825',
    crust: '#11111B',
};

// Parse terminal line for syntax highlighting
const TerminalLine = ({ line }: { line: string }) => {
    // Prompt lines
    if (line.startsWith('maios@user:~$')) {
        const parts = line.split('$');
        return (
            <div className="whitespace-pre-wrap mb-0.5 leading-relaxed">
                <span style={{ color: COLORS.pink }}>maios</span>
                <span style={{ color: COLORS.overlay1 }}>@</span>
                <span style={{ color: COLORS.mauve }}>user</span>
                <span style={{ color: COLORS.overlay1 }}>:</span>
                <span style={{ color: COLORS.blue }}>~</span>
                <span style={{ color: COLORS.text }}>$ </span>
                <span style={{ color: COLORS.text }}>{parts.slice(1).join('$').trim()}</span>
            </div>
        );
    }

    // Error lines
    if (line.toLowerCase().includes('command not found') || line.toLowerCase().includes('error')) {
        return <div className="whitespace-pre-wrap mb-0.5 leading-relaxed" style={{ color: COLORS.red }}>{line}</div>;
    }

    // Success lines
    if (line.toLowerCase().includes('[success]') || line.toLowerCase().includes('complete')) {
        return <div className="whitespace-pre-wrap mb-0.5 leading-relaxed" style={{ color: COLORS.green }}>{line}</div>;
    }

    // Processing lines (for hacknasa)
    if (line.includes('...')) {
        return <div className="whitespace-pre-wrap mb-0.5 leading-relaxed" style={{ color: COLORS.yellow }}>{line}</div>;
    }

    // Headers 
    if (line.startsWith('Available commands:') || line.startsWith('----------')) {
        return <div className="whitespace-pre-wrap mb-0.5 leading-relaxed" style={{ color: COLORS.pink }}>{line}</div>;
    }

    // maifetch art/info lines (check for ASCII art chars or info format)
    if (line.includes('/\\') || line.includes('( ') || line.includes('(__)') || line.match(/^.*:\s\w/)) {
        // Split into art and info parts (art is first 20 chars, info is rest)
        const artPart = line.substring(0, 20);
        const infoPart = line.substring(20);

        if (infoPart.includes(':')) {
            const [label, ...valueParts] = infoPart.split(':');
            const value = valueParts.join(':');
            return (
                <div className="whitespace-pre-wrap mb-0.5 leading-relaxed">
                    <span style={{ color: COLORS.mauve }}>{artPart}</span>
                    <span style={{ color: COLORS.pink }}>{label}:</span>
                    <span style={{ color: COLORS.text }}>{value}</span>
                </div>
            );
        }
        return <div className="whitespace-pre-wrap mb-0.5 leading-relaxed" style={{ color: COLORS.mauve }}>{line}</div>;
    }

    // Help command indented lines
    if (line.startsWith('  ')) {
        const [cmd, ...desc] = line.trim().split(' - ');
        if (desc.length > 0) {
            return (
                <div className="whitespace-pre-wrap mb-0.5 leading-relaxed">
                    <span style={{ color: COLORS.green }}>  {cmd}</span>
                    <span style={{ color: COLORS.overlay1 }}> - {desc.join(' - ')}</span>
                </div>
            );
        }
    }

    // Color palette blocks (neofetch style)
    if (line.includes('████')) {
        const paletteColors = [COLORS.red, COLORS.peach, COLORS.yellow, COLORS.green, COLORS.teal, COLORS.blue, COLORS.mauve, COLORS.pink];
        return (
            <div className="whitespace-pre-wrap mb-0.5 leading-relaxed">
                <span style={{ color: COLORS.text }}>{line.split('████')[0]}</span>
                {paletteColors.map((color, i) => (
                    <span key={i} style={{ color }}>██</span>
                ))}
            </div>
        );
    }

    // Default text
    return <div className="whitespace-pre-wrap mb-0.5 leading-relaxed" style={{ color: COLORS.text }}>{line}</div>;
};

// Blinking cursor component
const BlinkingCursor = () => (
    <span className="animate-blink inline-block w-2 h-4 ml-0.5" style={{ backgroundColor: COLORS.pink }} />
);

export const Terminal = () => {
    const [lines, setLines] = useState<string[]>([
        "",
        "  ╔═══════════════════════════════════════════╗",
        "  ║     ✿  MaiOS [Version 1.0.0]  ✿           ║",
        "  ║     (c) Mai Corporation                   ║",
        "  ╚═══════════════════════════════════════════╝",
        "",
        "  Welcome back, user! Type 'help' for commands.",
        "  Try: maifetch, hacknasa, love",
        ""
    ]);
    const [input, setInput] = useState('');
    const endRef = useRef<HTMLDivElement>(null);
    const { openWindow } = useDesktop();

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lines]);

    const handleCommand = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const trimmedInput = input.trim();
            if (!trimmedInput) return;

            const [cmdName, ...args] = trimmedInput.toLowerCase().split(' ');
            setLines(prev => [...prev, `maios@user:~$ ${input}`]);
            setInput('');

            const commandHandler = commands[cmdName];
            if (commandHandler) {
                await commandHandler({
                    args,
                    setLines,
                    openWindow,
                    clearTerminal: () => setLines([])
                });
            } else {
                setLines(prev => [...prev, `Command not found: ${cmdName}`]);
            }
        }
    };

    return (
        <div
            className="p-4 h-full font-code text-sm overflow-auto selection:bg-[#F5C2E7] selection:text-[#1E1E2E]"
            style={{ backgroundColor: COLORS.base, color: COLORS.text }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Output lines with syntax highlighting */}
            {lines.map((line, i) => (
                <TerminalLine key={i} line={line} />
            ))}

            {/* Input line with styled prompt */}
            <div className="flex items-center">
                <span style={{ color: COLORS.pink }}>maios</span>
                <span style={{ color: COLORS.overlay1 }}>@</span>
                <span style={{ color: COLORS.mauve }}>user</span>
                <span style={{ color: COLORS.overlay1 }}>:</span>
                <span style={{ color: COLORS.blue }}>~</span>
                <span style={{ color: COLORS.text }}>$ </span>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleCommand}
                    className="bg-transparent border-none outline-none flex-1 font-code"
                    style={{ color: COLORS.text }}
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                />
                <BlinkingCursor />
            </div>
            <div ref={endRef} />
        </div>
    );
};

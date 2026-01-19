"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useDesktop } from '@/features/desktop/context/DesktopContext';

export const Terminal = () => {
    const [lines, setLines] = useState<string[]>([
        "MaiOS [Version 1.0.0]",
        "(c) Mai Corporation. All rights reserved.",
        "",
        "Type 'help' for available commands.",
        ""
    ]);
    const [input, setInput] = useState('');
    const endRef = useRef<HTMLDivElement>(null);
    const { openWindow } = useDesktop();

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lines]);

    const handleCommand = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const cmd = input.trim().toLowerCase();
            const newLines = [...lines, `maios@user:~$ ${input}`];

            if (cmd === 'help') {
                newLines.push("Available commands:", "  help     - Show this help message", "  clear    - Clear terminal", "  about    - Open About Me", "  exit     - Close terminal", "  ls       - List files (simulated)");
            } else if (cmd === 'clear') {
                setLines([]);
                setInput('');
                return;
            } else if (cmd === 'exit') {
                // Ideally close the window, but we need the ID. For now just say bye.
                newLines.push("Session terminated.");
            } else if (cmd === 'about') {
                newLines.push("Opening About Me...");
                openWindow({ id: 'about', title: 'About Me', type: 'markdown', content: '# About Me\n...' });
            } else if (cmd === 'ls') {
                newLines.push("Documents  Downloads  Music  Pictures  Videos  welcome.txt");
            } else if (cmd !== '') {
                newLines.push(`Command not found: ${cmd}`);
            }

            setLines(newLines);
            setInput('');
        }
    };

    return (
        <div className="bg-[#1E1E1E] text-mai-secondary p-4 h-full font-mono text-sm overflow-auto" onClick={(e) => e.stopPropagation()}>
            {lines.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap mb-1">{line}</div>
            ))}
            <div className="flex items-center gap-2">
                <span className="text-mai-primary">maios@user:~$</span>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleCommand}
                    className="bg-transparent border-none outline-none flex-1 text-white"
                    autoFocus
                />
            </div>
            <div ref={endRef} />
        </div>
    );
};

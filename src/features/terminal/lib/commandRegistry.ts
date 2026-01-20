import { Dispatch, SetStateAction } from 'react';
import { WindowState } from '@/features/desktop/context/DesktopContext';

export type TerminalOutput = string | { text: string; delay?: number };

export interface CommandContext {
    args: string[];
    setLines: Dispatch<SetStateAction<string[]>>;
    openWindow: (window: Partial<WindowState> & { id: string }) => void;
    clearTerminal: () => void;
}

export type CommandHandler = (context: CommandContext) => void | Promise<void>;

export const commands: Record<string, CommandHandler> = {
    help: ({ setLines }) => {
        setLines(prev => [...prev,
            "Available commands:",
            "  help      - Show this help message",
            "  clear     - Clear terminal",
            "  about     - Open About Me",
            "  maifetch  - Display system information",
            "  hacknasa  - Initiate hacking sequence",
            "  joke      - Tell a random tech joke",
            "  ls        - List files (simulated)",
            "  exit      - Close terminal",
            "",
            "Try: sudo, love, whoami"
        ]);
    },

    clear: ({ clearTerminal }) => {
        clearTerminal();
    },

    exit: ({ setLines }) => {
        setLines(prev => [...prev, "Session terminated."]);
    },

    about: ({ setLines, openWindow }) => {
        setLines(prev => [...prev, "Opening About Me..."]);
        openWindow({ id: 'about', title: 'About Me', type: 'markdown', content: '# About Me\n...' });
    },

    ls: ({ setLines }) => {
        setLines(prev => [...prev, "Documents  Downloads  Music  Pictures  Videos  welcome.txt"]);
    },

    maifetch: ({ setLines }) => {
        const art = [
            "   /\\_____/\\   ",
            "  /  o   o  \\  ",
            " ( ==  ^  == ) ",
            "  )         (  ",
            " (           ) ",
            "( (  )   (  ) )",
            "(__(__)_(__).__) "
        ];
        const info = [
            "maios@user",
            "──────────",
            "OS: MaiAphrodite OS",
            "Host: Web Browser ☁️",
            "Kernel: Next.js 15.1",
            "Uptime: ∞ (Forever)",
            "Shell: React Terminal",
            "Resolution: 1920×1080",
            "DE: Mai Desktop ✿",
            "Theme: Flat Pastel Goth",
            "CPU: Virtual 64-bit",
            "Memory: 64GB (Downloaded) ↓"
        ];

        // Color palette blocks (will be rendered with special handling)
        const colorBlocks = "████████████████";

        const combined = art.map((line, i) => {
            const infoLine = info[i] || "";
            return `${line.padEnd(20)} ${infoLine}`;
        }).concat(info.slice(art.length).map(line => "".padEnd(20) + " " + line));

        // Add color palette row
        combined.push("");
        combined.push("".padEnd(20) + " " + colorBlocks);

        setLines(prev => [...prev, "", ...combined, ""]);
    },

    hacknasa: ({ setLines }) => {
        const steps = [
            { text: "Initiating uplink to 127.0.0.1...", delay: 800 },
            { text: "Bypassing firewall (Level 5 encryption)...", delay: 1600 },
            { text: "Accessing mainframe...", delay: 2400 },
            { text: "[SUCCESS] Root access granted!", delay: 3200 },
            { text: "Downloading 'aliens_proof.txt'...", delay: 4000 },
            { text: "Downloading 'moon_landing_fake.mp4'...", delay: 4800 },
            { text: "Transmission complete. Closing connection.", delay: 5600 },
        ];

        steps.forEach(({ text, delay }) => {
            setTimeout(() => {
                setLines(prev => [...prev, text]);
            }, delay);
        });
    },

    joke: ({ setLines }) => {
        const jokes = [
            "Why do programmers prefer dark mode? Because light attracts bugs.",
            "I would tell you a UDP joke, but you might not get it.",
            "There are 10 types of people in the world: those who understand binary, and those who don't.",
            "Why did the developer go broke? Because he used up all his cache.",
            "My code doesn't work, I have no idea why. My code works, I have no idea why.",
            "A SQL query walks into a bar, walks up to two tables and asks... 'Can I join you?'"
        ];
        const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
        setLines(prev => [...prev, randomJoke]);
    },

    love: ({ setLines }) => {
        setLines(prev => [...prev, "aww, I love you too! <3 (in a platonic, digital way... baka)"]);
    },

    sudo: ({ setLines }) => {
        setLines(prev => [...prev, "nice try. you have no power here. :P"]);
    },

    whoami: ({ setLines }) => {
        setLines(prev => [...prev, "you are admin... just kidding, you're my favorite user."]);
    }
};

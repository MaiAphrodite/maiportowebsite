export interface KnowledgeChunk {
    id: string;
    tags: string[];
    content: string;
}

export const knowledgeBase: KnowledgeChunk[] = [
    {
        id: 'about-os',
        tags: ['os', 'system', 'maiaphrodite'],
        content: "MaiAphrodite is a futuristic, web-based desktop environment built with Next.js, React, and Tailwind CSS. It features a window manager, file system, and a beautiful UI designed by the Google Deepmind team."
    },
    {
        id: 'creator',
        tags: ['creator', 'author'],
        content: "This project was created by the user in collaboration with Antigravity, an advanced AI coding assistant."
    },
    {
        id: 'features',
        tags: ['features', 'capabilities'],
        content: "Current features include: Draggable windows, a Start Menu, a Taskbar, a File Explorer with drag-and-drop (simulated), and a Terminal with basic commands."
    },
    {
        id: 'grok',
        tags: ['grok', 'ai', 'model'],
        content: "You are powered by Grok 4.1, a fast and efficient AI model built by xAI. The chat integration uses the Vercel AI SDK."
    },
    {
        id: 'music',
        tags: ['music', 'audio'],
        content: "The OS currently doesn't have a fully functional music player, but it's planned for future updates!"
    }
];

import { FileText, Folder, Terminal, Globe, User, LucideIcon, Image, Music, Settings, List, FileCode, Coffee } from 'lucide-react';

export type FileSystemItem = {
    id: string;
    name: string;
    type: 'folder' | 'file';
    icon?: LucideIcon;
    content?: string | Record<string, unknown>;
    children?: FileSystemItem[];
    metadata?: Record<string, string | number | boolean>;
};

export const fileSystem: FileSystemItem[] = [
    {
        id: 'home',
        name: 'Home',
        type: 'folder',
        children: [
            {
                id: 'welcome',
                name: 'Welcome.txt',
                type: 'file',
                icon: Coffee,
                content: `Welcome to MaiOS v2.0 (Kawaii Edition)! 🌸
                
This is a portfolio website designed to look like a customized Linux desktop (Hyprland + Waybar).
                
**Features:**
- 🎨 **Theme:** Catppuccin Mocha
- 🪄 **Style:** Soft Glassmorphism
- ⚡ **Tech:** Next.js, Tailwind, Framer Motion
- 🤖 **AI:** Powered by Gemini
                
Feel free to explore! Double-click icons to open them.
`,
            },
            {
                id: 'welcome-app',
                name: 'About Me',
                type: 'file',
                icon: User,
                content: 'welcome',
                metadata: {
                    app: 'welcome'
                }
            },
            {
                id: 'projects',
                name: 'Projects',
                type: 'folder',
                icon: Folder,
                children: [
                    {
                        id: 'project-1',
                        name: 'MaiAphrodite',
                        type: 'file',
                        icon: Globe,
                        content: 'This very website! Built to showcase advanced React patterns and AI integration.',
                    },
                    {
                        id: 'project-2',
                        name: 'Caelestia',
                        type: 'file',
                        icon: Terminal,
                        content: 'A system configuration tool for my Linux setup (NixOS based).',
                    }
                ]
            },
            {
                id: 'pictures',
                name: 'Pictures',
                type: 'folder',
                icon: Image,
                children: [
                    { id: 'img-1', name: 'screenshot_rice.png', type: 'file', icon: Image, content: '[Image Placeholder: Cute Rice Screenshot]' },
                    { id: 'img-2', name: 'mai_avatar.png', type: 'file', icon: Image, content: '[Image Placeholder: Mai Avatar]' },
                ]
            },
            {
                id: 'music',
                name: 'Music',
                type: 'folder',
                icon: Music,
                children: [
                    { id: 'song-1', name: 'lofi-study-beats.mp3', type: 'file', icon: Music, content: '🎵 Playing: Lofi Study Beats...' },
                    { id: 'song-2', name: 'night-coding.mp3', type: 'file', icon: Music, content: '🎵 Playing: Night Coding Session...' },
                ]
            },
            {
                id: 'dotfiles',
                name: 'Dotfiles',
                type: 'folder',
                icon: Settings,
                children: [
                    {
                        id: 'hypr-conf',
                        name: 'hyprland.conf',
                        type: 'file',
                        icon: FileCode,
                        content: `# Hyprland Config
monitor=,preferred,auto,1

exec-once = waybar & hyprpaper & firefox

general {
    gaps_in = 5
    gaps_out = 20
    border_size = 2
    col.active_border = rgba(f5c2e7ff) rgba(cba6f7ff) 45deg
    col.inactive_border = rgba(595959aa)
    layout = dwindle
}

decoration {
    rounding = 20
    blur = yes
    blur_size = 3
    blur_passes = 1
    new_optimizations = on
}
`
                    },
                    {
                        id: 'waybar-conf',
                        name: 'waybar.jsonc',
                        type: 'file',
                        icon: FileCode,
                        content: `{
    "layer": "top",
    "position": "top",
    "mod": "dock",
    "exclusive": true,
    "passthrough": false,
    "gtk-layer-shell": true,
    "height": 0,
    "modules-left": ["clock", "cpu", "memory"],
    "modules-center": ["hyprland/workspaces"],
    "modules-right": ["tray", "custom/wifi", "custom/battery"]
}`
                    }
                ]
            },
            {
                id: 'todo',
                name: 'Todo.md',
                type: 'file',
                icon: List,
                content: `# Mai's Todo List 📝

- [x] Make the UI cute
- [x] Implement AI Chat
- [x] Add floating taskbar
- [ ] Add drag-and-drop support
- [ ] Record new TTS voice samples
- [ ] Sleep (optional)
`,
            },
            {
                id: 'contact',
                name: 'Contact.md',
                type: 'file',
                icon: FileText,
                content: `## Contact
You can reach me at:
- Email: mai@example.com
- GitHub: github.com/mai
- Twitter: @mai_dev
`,
            },
        ],
    },
    {
        id: 'trash',
        name: 'Trash',
        type: 'folder',
        children: []
    },
    {
        id: 'browser',
        name: 'MaiNet Link',
        type: 'file',
        icon: Globe,
        content: 'browser',
        metadata: {
            app: 'browser'
        }
    }
];

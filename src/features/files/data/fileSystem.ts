import { FileText, Folder, Terminal, Globe, User, LucideIcon } from 'lucide-react';

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
                id: 'about',
                name: 'About Me',
                type: 'file',
                icon: User,
                content: `# About Me
Hi! I'm Mai, a creative developer who loves aesthetic interfaces.
I built this portfolio to look like a customized Linux desktop!

**Skills:**
- React / Next.js
- Tailwind CSS
- Design Systems
- Ricing Linux Distros
`,
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
                        content: 'This very website! Built with Next.js and Tailwind.',
                    },
                    {
                        id: 'project-2',
                        name: 'Caelestia',
                        type: 'file',
                        icon: Terminal,
                        content: 'A system configuration tool for my Linux setup.',
                    }
                ]
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
            {
                id: 'welcome-txt',
                name: 'Welcome.txt',
                type: 'file',
                icon: FileText,
                content: 'Welcome to MaiOS!\n\nThis is a text file on the desktop.\nDouble-click to open me!',
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
        content: 'browser', // Component content ID
        metadata: {
            app: 'browser'
        }
    }
];

"use client";

import React from 'react';
import Image from 'next/image';
import { useDesktopActions } from '@/features/desktop/context/DesktopContext';
import { ArrowRight, Folder, Mail, Github, Globe } from 'lucide-react';

import { GithubUserProfile } from '@/services/github';

interface WelcomeAppProps {
    profile?: GithubUserProfile | null;
}

export const WelcomeApp = ({ profile }: WelcomeAppProps) => {
    const { openWindow } = useDesktopActions();

    const handleOpenProjects = () => {
        openWindow({
            id: 'projects',
            title: 'Projects',
            type: 'component',
            content: { app: 'explorer', initialPath: ['projects'] },
            size: { width: 800, height: 600 }
        });
    };

    const handleOpenContact = () => {
        openWindow({
            id: 'contact',
            title: 'Contact',
            type: 'markdown',
            content: `## Let's Connect! ✨\n\nI'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.\n\n**Data Source:** GitHub Profile\n\n**Email:** (Check GitHub)\n**GitHub:** [${profile?.login || 'MaiAphrodite'}](https://github.com/${profile?.login || 'MaiAphrodite'})\n**Location:** ${profile?.location || 'The Cloud'}`,
            size: { width: 450, height: 350 }
        });
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center select-none">
            {/* Avatar */}
            <div className="relative mb-5">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 shadow-lg ring-2 ring-pink-500/30">
                    <Image
                        src={profile?.avatar_url || "/assets/maiveclogo.png"}
                        alt={profile?.name || "Mai"}
                        fill
                        className="object-cover"
                    />
                </div>
                <div
                    className="absolute -bottom-1 -right-1 bg-green-400 w-5 h-5 rounded-full border-[3px] border-[#1e1e2e]"
                    title="Available for work"
                />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                {profile?.name ? `Hi, I'm ${profile.name.split(' ')[0]}!` : "Hi, I'm Mai!"}
            </h1>

            {/* Subtitle */}
            <p className="text-sm text-white/60 mb-6 max-w-xs font-medium line-clamp-2">
                {profile?.bio || "Full Stack Developer • AI Enthusiast • Building cozy digital experiences"}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mb-6">
                <button
                    onClick={handleOpenProjects}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] shadow-md shadow-pink-500/20"
                >
                    <Folder size={18} />
                    Projects
                    <ArrowRight size={16} className="ml-1" />
                </button>

                <button
                    onClick={handleOpenContact}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] border border-white/10"
                >
                    <Mail size={18} />
                    Contact
                </button>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
                <a
                    href={profile?.html_url || "https://github.com/MaiAphrodite"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                    <Github size={18} />
                </a>
                {profile?.blog && (
                    <a
                        href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 text-white/40 hover:text-blue-400 hover:bg-blue-400/10 rounded-full transition-all"
                    >
                        <Globe size={18} />
                    </a>
                )}
            </div>
        </div>
    );
};

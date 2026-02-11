"use client";

import React from 'react';
import { WelcomeApp } from '@/features/portfolio/components/WelcomeApp';
import { MusicWidget } from '@/features/portfolio/components/MusicWidget';
import { useDesktopActions, WindowContent } from '@/features/desktop/context/DesktopContext';
import { Folder, Terminal, Globe, ArrowRight } from 'lucide-react';
import { fileSystem, FileSystemItem } from '@/features/files/data/fileSystem';
import { fetchGithubRepos, GithubRepo, fetchGithubUser, GithubUserProfile, inferTechStack } from '@/services/github';
import { fetchMediumArticles, MediumArticle } from '@/services/medium';
import { useState, useEffect } from 'react';

export const Dashboard = () => {
    // Hybrid Dashboard Component
    const { openWindow } = useDesktopActions();
    const [projects, setProjects] = useState<GithubRepo[]>([]);
    const [articles, setArticles] = useState<MediumArticle[]>([]);
    const [profile, setProfile] = useState<GithubUserProfile | null>(null);
    const [techStack, setTechStack] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const [repos, blogPosts, userProfile] = await Promise.all([
                fetchGithubRepos('MaiAphrodite'),
                fetchMediumArticles(),
                fetchGithubUser('MaiAphrodite')
            ]);

            setProjects(repos);
            setArticles(blogPosts);
            setProfile(userProfile);
            setTechStack(inferTechStack(repos));
            setLoading(false);
        };
        loadData();
    }, []);



    const handleIconClick = (item: FileSystemItem) => {
        if (item.type === 'folder') {
            openWindow({
                id: item.id,
                title: item.name,
                type: 'component',
                content: { app: 'explorer', initialPath: [item.id] }
            });
        } else if (item.id === 'about') {
            openWindow({ id: 'about', title: 'About Me', type: 'markdown', content: item.content as WindowContent });
        } else if (item.id === 'browser') {
            openWindow({
                id: 'browser',
                title: 'MaiNet Navigator',
                type: 'component',
                content: 'browser',
                size: { width: 1024, height: 768 }
            });
        } else if (item.id === 'welcome-app') {
            openWindow({
                id: 'welcome-app',
                title: 'Welcome',
                type: 'component',
                content: 'welcome',
                variant: 'widget',
                size: { width: 500, height: 450 },
                position: { x: Math.max(50, (window.innerWidth - 500) / 2), y: 120 }
            });
        } else {
            openWindow({ id: item.id, title: item.name, type: 'markdown', content: item.content as WindowContent });
        }
    };

    // Filter out Welcome and Music items if they exist in fileSystem to avoid redundancy with widgets?
    // User wants "Hybrid", so maybe redundant icons are okay, or maybe we hide them.
    // For now, let's show all items from fileSystem for "Full Desktop" feel.

    return (
        <div className="w-full h-full overflow-y-auto overflow-x-hidden pt-20 px-4 pb-20 scrollbar-hide">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column / Top on Mobile */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    {/* Hero Widget */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-1 shadow-2xl">
                        <WelcomeApp profile={profile} />
                    </div>

                    {/* Featured Projects Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? (
                            // Skeleton Loading
                            <>
                                <div className="h-40 bg-white/5 rounded-3xl animate-pulse" />
                                <div className="h-40 bg-white/5 rounded-3xl animate-pulse" />
                            </>
                        ) : (
                            projects.slice(0, 4).map((repo) => (
                                <div
                                    key={repo.id}
                                    onClick={() => window.open(repo.html_url, '_blank')}
                                    className="group bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-6 cursor-pointer transition-all hover:scale-[1.02] hover:border-pink-500/30 flex flex-col h-full"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-pink-500/20 text-pink-400 rounded-2xl">
                                            {repo.language === 'TypeScript' || repo.language === 'JavaScript' ? <Globe size={24} /> : <Terminal size={24} />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-white/40 flex items-center gap-1">
                                                ⭐ {repo.stargazers_count}
                                            </span>
                                            <ArrowRight className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 truncate">{repo.name}</h3>
                                    <p className="text-white/60 text-sm mb-4 line-clamp-2 flex-grow">
                                        {repo.description || 'No description provided.'}
                                    </p>
                                    <div className="flex gap-2 text-xs font-mono text-pink-300/80 mt-auto">
                                        {repo.language && (
                                            <span className="px-2 py-1 bg-pink-500/10 rounded-md">
                                                {repo.language}
                                            </span>
                                        )}
                                        <span className="px-2 py-1 bg-white/5 rounded-md text-white/40">
                                            {new Date(repo.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Latest Writes (Medium) */}
                    <div className="flex items-center justify-between mb-4 mt-8">
                        <h3 className="text-white/40 text-xs font-bold uppercase tracking-wider">Latest Writes</h3>
                        <a href="https://medium.com/@maiaphrodite" target="_blank" className="text-pink-400 hover:text-pink-300 text-xs transition-colors">View All</a>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
                        ) : (
                            articles.slice(0, 3).map((article, index) => (
                                <a
                                    key={index}
                                    href={article.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 transition-all hover:border-pink-500/30"
                                >
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-medium truncate group-hover:text-pink-300 transition-colors">{article.title}</h4>
                                        <p className="text-white/40 text-xs mt-1">{article.date} • Medium</p>
                                    </div>
                                    <ArrowRight size={16} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </a>
                            ))
                        )}
                        {!loading && articles.length === 0 && (
                            <div className="text-white/40 text-sm italic p-4 text-center bg-white/5 rounded-2xl border border-white/5">
                                No articles found yet. Time to write something! ✍️
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column / Bottom on Mobile */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Audio Player */}
                    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-lg">
                        <MusicWidget />
                    </div>

                    {/* Integrated Desktop Icons Grid */}
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 min-h-[300px]">
                        <h3 className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">Desktop ({fileSystem.length})</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {fileSystem.map((item) => {
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleIconClick(item)}
                                        className="flex flex-col items-center justify-start p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-mai-text mb-2 border border-white/10 group-hover:border-pink-500/50 group-hover:scale-105 transition-all">
                                            {item.icon ? <item.icon size={20} className="text-white/80" /> : <Folder size={20} className="text-white/80" />}
                                        </div>
                                        <span className="text-[10px] text-center text-white/70 font-medium truncate w-full group-hover:text-white">
                                            {item.name}
                                        </span>
                                    </div>
                                );
                            })}

                            {/* Static Terminal Shortcut */}
                            <div
                                onClick={() => openWindow({ id: 'terminal', title: 'Terminal', type: 'component', content: 'terminal' })}
                                className="flex flex-col items-center justify-start p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-green-400 mb-2 border border-white/10 group-hover:border-green-500/50 group-hover:scale-105 transition-all">
                                    <Terminal size={20} />
                                </div>
                                <span className="text-[10px] text-center text-white/70 font-medium truncate w-full group-hover:text-white">
                                    Terminal
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tech Stack / Skills */}
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex-1">
                        <h3 className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">Tech Specs</h3>
                        <div className="flex flex-wrap gap-2">
                            {loading ? (
                                <div className="h-6 w-full bg-white/5 rounded-full animate-pulse" />
                            ) : (
                                (techStack.length > 0 ? techStack : ['Next.js', 'React', 'TypeScript']).map(tech => (
                                    <span key={tech} className="px-3 py-1 bg-white/5 rounded-full text-xs text-white/60 border border-white/5">
                                        {tech}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

"use client";

import React from 'react';
import Image from 'next/image';
import { MusicWidget } from '@/features/portfolio/components/MusicWidget';
import { useDesktopActions, WindowContent } from '@/features/desktop/context/DesktopContext';
import { Folder, Terminal, Globe, ArrowRight, Mail, Github } from 'lucide-react';
import { fileSystem, FileSystemItem } from '@/features/files/data/fileSystem';
import { fetchGithubRepos, GithubRepo, fetchGithubUser, GithubUserProfile, inferTechStack } from '@/features/portfolio/services/github';
import { fetchMediumArticles, MediumArticle } from '@/features/portfolio/services/medium';
import { useState, useEffect } from 'react';


export const Dashboard = () => {
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

    const handleOpenProjects = () => {
        openWindow({
            id: 'projects', title: 'Projects', type: 'component',
            content: { app: 'explorer', initialPath: ['projects'] },
            size: { width: 800, height: 600 }
        });
    };

    const handleOpenContact = () => {
        openWindow({
            id: 'contact', title: 'Contact', type: 'markdown',
            content: `## Let's Connect! ✨\n\nI'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.\n\n**Email:** (Check GitHub)\n**GitHub:** [${profile?.login || 'MaiAphrodite'}](https://github.com/${profile?.login || 'MaiAphrodite'})\n**Location:** ${profile?.location || 'The Cloud'}`,
            size: { width: 450, height: 350 }
        });
    };

    const handleIconClick = (item: FileSystemItem) => {
        if (item.type === 'folder') {
            openWindow({ id: item.id, title: item.name, type: 'component', content: { app: 'explorer', initialPath: [item.id] } });
        } else if (item.id === 'about') {
            openWindow({ id: 'about', title: 'About Me', type: 'markdown', content: item.content as WindowContent });
        } else if (item.id === 'browser') {
            openWindow({ id: 'browser', title: 'MaiNet Navigator', type: 'component', content: 'browser', size: { width: 1024, height: 768 } });
        } else if (item.id === 'welcome-app') {
            openWindow({ id: 'welcome-app', title: 'Welcome', type: 'component', content: 'welcome', variant: 'widget', size: { width: 500, height: 450 }, position: { x: Math.max(50, (window.innerWidth - 500) / 2), y: 120 } });
        } else {
            openWindow({ id: item.id, title: item.name, type: 'markdown', content: item.content as WindowContent });
        }
    };

    const totalStars = projects.reduce((sum, r) => sum + r.stargazers_count, 0);

    return (
        <div className="w-full h-full overflow-y-auto overflow-x-hidden pt-16 px-6 pb-20 scrollbar-hide relative z-0">
            {/* Flex container to center content with side gutters */}
            <div className="flex justify-center relative min-h-full">

                {/* LEFT SIDE GUTTER (Hidden on smaller screens) */}
                <div className="gfx-gutter-container hidden xl:flex border-r border-mai-border/10 mr-4">
                    <span className="gfx-vertical-text mb-auto">MAI APHRODITE // PORTFOLIO</span>
                    {/* Grayscale ramp removed */}
                </div>

                {/* MAIN CONTENT (Existing Wrapper) */}
                <div className="max-w-7xl w-full">

                    {/* Page corner crosses */}
                    <div className="gfx-page-cross tl" />
                    <div className="gfx-page-cross tr" />
                    <div className="gfx-page-cross bl" />
                    <div className="gfx-page-cross br" />

                    {/* ═══ TOP METADATA BAR ═══ */}
                    <div className="gfx-top-bar">
                        <span className="gfx-meta" style={{ opacity: 1 }}>MAI APHRODITE</span>
                        <div className="flex items-center gap-3">
                            <span className="gfx-jp">ポートフォリオ</span>
                            <span className="gfx-meta" style={{ opacity: 1 }}>{'© 2025 // PERSONAL'}</span>
                        </div>
                    </div>

                    {/* Proof sheet accent bars */}
                    <div className="flex gap-3 mt-2 mb-4">
                        <div className="gfx-accent-bar pink flex-1" />
                        <span className="gfx-reg-mark" />
                        <span className="gfx-reg-mark" />
                    </div>

                    {/* ═══ GFX HERO SECTION ═══ */}
                    <div className="relative mb-4">
                        {/* Watermark */}
                        <div className="gfx-watermark -top-8 -left-4 select-none">MAI</div>

                        {/* Corner brackets */}
                        <div className="gfx-corner-tl" />
                        <div className="gfx-corner-br" />

                        {/* Corner metadata */}
                        <div className="absolute top-2 right-4 z-10 flex items-center gap-4">
                            <span className="gfx-meta">2025</span>
                            <span className="gfx-cross">＋</span>
                            <span className="gfx-meta">portfolio</span>
                            <span className="gfx-cross">＋</span>
                            <span className="gfx-meta">v2.0</span>
                        </div>

                        {/* Vertical side label REMOVED */}

                        {/* Big accent number in background */}
                        <div className="gfx-big-number absolute right-0 top-0 hidden md:block">01</div>

                        {/* Diagonal stripe accent */}
                        <div className="gfx-stripes absolute -right-2 top-12 w-16 h-24 rounded-sm hidden lg:block" />

                        {/* Boxed timestamp */}
                        <div className="absolute bottom-2 right-4 z-10 hidden md:flex items-center gap-3">
                            <span className="gfx-sec-code">SEC_01</span>
                            <span className="gfx-timestamp">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 py-8">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-mai-border/20 shadow-lg ring-2 ring-mai-primary/30">
                                    <Image
                                        src={profile?.avatar_url || "/assets/maiveclogo.png"}
                                        alt={profile?.name || "Mai"}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-mai-success w-5 h-5 rounded-full border-[3px] border-rice-bg" title="Available for work" />
                            </div>

                            {/* Name + Bio */}
                            <div className="flex-1 min-w-0">
                                {/* Slug line */}
                                <div className="gfx-slash-label mb-1">{'// v2.0 — portfolio'}</div>

                                <div className="flex items-baseline gap-3 flex-wrap">
                                    <h1
                                        className="text-5xl md:text-7xl font-bold text-mai-text leading-none tracking-tight"
                                        style={{ fontFamily: 'var(--font-fredoka), sans-serif' }}
                                    >
                                        {profile?.name?.split(' ')[0] || 'Mai'}
                                    </h1>
                                    <span className="text-base md:text-lg font-light text-mai-subtext tracking-wide">
                                        Full Stack Developer
                                    </span>
                                </div>
                                <p className="text-sm text-mai-subtext/70 mt-3 max-w-lg italic leading-relaxed">
                                    &ldquo;{profile?.bio || "Building cozy digital experiences — one pixel at a time."}&rdquo;
                                </p>

                                {/* Availability */}
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-mai-success" />
                                    <span className="gfx-meta">available for work</span>
                                    <span className="gfx-sq" />
                                    <span className="gfx-meta">UTC+7</span>
                                </div>

                                {/* Colophon-style metadata */}
                                <div className="gfx-data-row mt-3">
                                    <span>{profile?.location || 'INDONESIA'}</span>
                                    <span className="gfx-sq" />
                                    <span>1920×1080</span>
                                    <span className="gfx-sq" />
                                    <span>sRGB</span>
                                    <span className="gfx-sq" />
                                    <span>2025</span>
                                </div>
                            </div>

                            {/* Social + CTAs */}
                            <div className="flex flex-col items-end gap-3 shrink-0">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleOpenProjects}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-mai-primary to-mai-accent text-white font-semibold rounded-xl transition-all hover:scale-[1.03] shadow-md shadow-mai-primary/20 text-sm"
                                    >
                                        <Folder size={16} />
                                        Projects
                                        <ArrowRight size={14} />
                                    </button>
                                    <button onClick={handleOpenContact} className="p-2.5 text-mai-subtext hover:text-mai-text hover:bg-mai-text/10 rounded-xl transition-all border border-mai-border/10">
                                        <Mail size={16} />
                                    </button>
                                    <a href={profile?.html_url || "https://github.com/MaiAphrodite"} target="_blank" rel="noopener noreferrer" className="p-2.5 text-mai-subtext hover:text-mai-text hover:bg-mai-text/10 rounded-xl transition-all border border-mai-border/10">
                                        <Github size={16} />
                                    </a>
                                </div>
                                {/* Barcode decoration */}

                            </div>
                        </div>

                        {/* Stat Boxes + Data Row */}
                        <div className="relative z-10 flex items-center gap-3 flex-wrap mb-2">
                            <span className="gfx-cross mr-1">＋</span>
                            <div className="gfx-stat-box">
                                <span className="stat-label">Repos</span>
                                <span className="stat-value">{loading ? '—' : profile?.public_repos ?? projects.length}</span>
                            </div>
                            <div className="gfx-stat-box">
                                <span className="stat-label">Followers</span>
                                <span className="stat-value">{loading ? '—' : profile?.followers ?? 0}</span>
                            </div>
                            <div className="gfx-stat-box">
                                <span className="stat-label">Stars</span>
                                <span className="stat-value">{loading ? '—' : totalStars}</span>
                            </div>
                            <span className="gfx-cross ml-1">＋</span>
                            <div className="gfx-line-h flex-1 hidden md:block" />
                            <span className="gfx-meta hidden md:block">github.com/{profile?.login || 'MaiAphrodite'}</span>
                        </div>

                        {/* Colophon metadata */}
                        <div className="gfx-data-row mt-1 mb-2">
                            <span>Fredoka</span>
                            <span className="gfx-sq" />
                            <span>M PLUS Rounded 1c</span>
                            <span className="gfx-sq" />
                            <span>JetBrains Mono</span>
                            <span className="gfx-sq" />
                            <span>Catppuccin</span>
                            <span>＋</span>
                            <span className="gfx-jp ml-2">デザイン</span>
                        </div>
                    </div>

                    {/* ═══ SEPARATOR ═══ */}
                    <div className="gfx-separator" />

                    {/* ═══ MAIN CONTENT ═══ */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Left Column */}
                        <div className="lg:col-span-8 flex flex-col gap-8">

                            {/* 01 — Projects */}
                            <div className="relative">
                                {/* Stripe fill decoration */}
                                <div className="gfx-stripe-block absolute -left-3 top-8 w-20 h-32 hidden lg:block" />

                                {/* Big accent number */}
                                <div className="gfx-big-number absolute -right-4 -top-6 hidden md:block">02</div>

                                <div className="flex items-center gap-3 mb-5">
                                    <span className="gfx-section-number">01</span>
                                    <span className="text-mai-text font-light text-lg tracking-wide">Projects</span>
                                    <span className="gfx-sec-code ml-1">RCN.{String(projects.length).padStart(3, '0')}</span>
                                    <div className="flex-1 h-px bg-mai-border/20" />
                                    <span className="gfx-cross">＋</span>
                                    <span className="gfx-meta">{projects.length} repos</span>
                                    <span className="gfx-sq" />
                                    <span className="gfx-slash-label">{'// featured'}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {loading ? (
                                        <>
                                            <div className="h-40 rounded-3xl animate-pulse" style={{ background: 'var(--card-bg)' }} />
                                            <div className="h-40 rounded-3xl animate-pulse" style={{ background: 'var(--card-bg)' }} />
                                        </>
                                    ) : (
                                        projects.slice(0, 4).map((repo, idx) => (
                                            <div
                                                key={repo.id}
                                                onClick={() => openWindow({
                                                    id: `repo-${repo.name}`,
                                                    title: repo.name,
                                                    type: 'component',
                                                    content: { app: 'repo-detail', data: { repo, owner: 'MaiAphrodite' } },
                                                    size: { width: 900, height: 600 }
                                                })}
                                                className="group relative backdrop-blur-md rounded-3xl p-6 cursor-pointer transition-all hover:scale-[1.02] flex flex-col h-full"
                                                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--card-hover-bg)'; e.currentTarget.style.borderColor = 'var(--card-hover-border)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.borderColor = 'var(--card-border)'; }}
                                            >
                                                {/* Card corner brackets */}
                                                <div className="gfx-corner-tl" style={{ width: '12px', height: '12px' }} />
                                                <div className="gfx-corner-br" style={{ width: '12px', height: '12px' }} />

                                                {/* Card index */}
                                                <span className="absolute top-3 right-4 gfx-slash-label">{'// 0'}{idx + 1}</span>

                                                {/* GFX: Chevron arrows */}
                                                <div className="absolute bottom-3 right-4 flex gap-0.5 opacity-10">
                                                    <span className="text-[10px] font-mono text-mai-text">▶▶▶</span>
                                                </div>

                                                {/* GFX: Caution label for first card */}
                                                {idx === 0 && (
                                                    <div className="absolute bottom-3 left-4 flex items-center gap-1 opacity-15">
                                                        <span className="text-[8px] font-mono text-mai-text tracking-widest">⚠ REMOVABLE MODULE</span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="p-3 bg-mai-primary/20 text-mai-primary rounded-2xl">
                                                        {repo.language === 'TypeScript' || repo.language === 'JavaScript' ? <Globe size={24} /> : <Terminal size={24} />}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-mai-subtext flex items-center gap-1">
                                                            ⭐ {repo.stargazers_count}
                                                        </span>
                                                        <ArrowRight className="text-mai-subtext/40 group-hover:text-mai-text group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-bold text-mai-text mb-2 truncate">{repo.name}</h3>
                                                <p className="text-mai-subtext text-sm mb-4 line-clamp-2 flex-grow">
                                                    {repo.description || 'No description provided.'}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs font-mono text-mai-primary/80 mt-auto">
                                                    {repo.language && (
                                                        <span className="px-2 py-1 bg-mai-primary/10 rounded-md">{repo.language}</span>
                                                    )}
                                                    <span className="px-2 py-1 bg-mai-text/5 rounded-md text-mai-subtext">
                                                        {new Date(repo.updated_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="gfx-hash ml-auto">GRM-{String(repo.id).slice(-4)}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Post-projects colophon */}
                                <div className="gfx-data-row mt-4">
                                    <span>github.com</span>
                                    <span className="gfx-sq" />
                                    <span>{techStack[0] || 'TypeScript'}</span>
                                    <span className="gfx-sq" />
                                    <span>{projects.length || '—'} repositories</span>
                                    <span>＋</span>
                                </div>
                            </div>

                            {/* 02 — Writes */}
                            <div className="relative">
                                {/* Stripe fill on writes section */}
                                <div className="gfx-stripe-block absolute -right-3 top-10 w-16 h-28 hidden lg:block" />

                                {/* GFX: Danger kanji watermark */}
                                <div className="absolute -right-2 top-0 text-mai-text opacity-[0.03] text-6xl font-bold pointer-events-none select-none hidden lg:block" style={{ fontFamily: 'var(--font-mplus)' }}>危険</div>

                                <div className="flex items-center gap-3 mb-5">
                                    <span className="gfx-section-number">02</span>
                                    <span className="text-mai-text font-light text-lg tracking-wide">Writes</span>
                                    <span className="gfx-jp ml-1">記事</span>
                                    <div className="flex-1 h-px bg-mai-border/20" />
                                    <span className="gfx-cross">＋</span>
                                    <span className="gfx-slash-label">{'// medium articles'}</span>
                                    <a href="https://medium.com/@maiaphrodite" target="_blank" className="text-mai-primary hover:text-mai-primary/80 text-xs transition-colors">View All</a>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {loading ? (
                                        <div className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--card-bg)' }} />
                                    ) : (
                                        articles.slice(0, 3).map((article, index) => (
                                            <div
                                                key={index}
                                                onClick={() => openWindow({
                                                    id: `article-${index}`,
                                                    title: article.title,
                                                    type: 'component',
                                                    content: { app: 'article-detail', data: article },
                                                    size: { width: 600, height: 500 }
                                                })}
                                                className="group relative flex items-center gap-4 backdrop-blur-md rounded-2xl p-4 transition-all cursor-pointer"
                                                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                                            >
                                                {/* GFX: Bracket decorations */}
                                                <div className="gfx-corner-tl" style={{ width: '8px', height: '8px' }} />
                                                <div className="gfx-corner-br" style={{ width: '8px', height: '8px' }} />

                                                {/* Article number */}
                                                <span className="gfx-boxed">{String(index + 1).padStart(2, '0')}</span>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-mai-text font-medium truncate group-hover:text-mai-primary transition-colors">{article.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-mai-subtext text-xs">{article.date} • Medium</p>
                                                        <span className="gfx-hash">SEC_{String(index + 1).padStart(2, '0')}</span>
                                                    </div>
                                                </div>
                                                {/* GFX: Directional arrow cluster */}
                                                <div className="flex items-center gap-1">
                                                    <span className="text-mai-subtext/10 text-[10px] font-mono">→→</span>
                                                    <ArrowRight size={16} className="text-mai-subtext/40 group-hover:text-mai-text group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {!loading && articles.length === 0 && (
                                        <div className="text-mai-subtext text-sm italic p-4 text-center rounded-2xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                                            No articles found yet. Time to write something! ✍️
                                        </div>
                                    )}
                                </div>

                                {/* Post-articles colophon */}
                                <div className="gfx-data-row mt-4">
                                    <span>medium.com</span>
                                    <span className="gfx-sq" />
                                    <span>{articles.length || '—'} entries</span>
                                    <span>＋</span>
                                    <span className="gfx-jp">通り</span>

                                </div>
                            </div>
                        </div>

                        {/* Right Column / Sidebar */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            {/* Audio Player */}
                            <div className="relative bg-gradient-to-br from-mai-accent/20 to-mai-primary/20 backdrop-blur-xl border border-mai-border/10 rounded-xl shadow-lg">
                                <div className="gfx-corner-tl" style={{ width: '16px', height: '16px' }} />
                                <div className="gfx-corner-br" style={{ width: '16px', height: '16px' }} />
                                {/* GFX: Chevron strip — bottom-right corner, behind content */}
                                <div className="absolute bottom-1 right-4 flex items-center gap-1 opacity-10 z-0 pointer-events-none">
                                    <span className="text-[7px] font-mono text-mai-text tracking-[0.15em]">◀◀◀ ONEWAY</span>
                                </div>
                                <MusicWidget />
                            </div>

                            {/* Desktop Icons Grid */}
                            <div className="relative backdrop-blur-md rounded-3xl p-6 min-h-[240px]" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                                <div className="gfx-corner-tl" style={{ width: '16px', height: '16px' }} />
                                <div className="gfx-corner-br" style={{ width: '16px', height: '16px' }} />

                                {/* GFX: Caution kanji */}
                                <div className="absolute top-2 right-4 opacity-[0.04] text-3xl font-bold pointer-events-none select-none" style={{ fontFamily: 'var(--font-mplus)' }}>警告</div>

                                {/* GFX: Diagonal hatch marks */}
                                <div className="absolute -bottom-1 -left-1 w-8 h-8 gfx-stripes rounded-sm opacity-30" />

                                <div className="flex items-center gap-3 mb-4">
                                    <span className="gfx-section-number">03</span>
                                    <span className="text-mai-text font-light text-sm tracking-wide">Desktop</span>
                                    <span className="gfx-jp ml-1">デスク</span>
                                    <span className="gfx-cross ml-auto">＋</span>
                                    <span className="gfx-meta">{fileSystem.length} items</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {fileSystem.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleIconClick(item)}
                                            className="flex flex-col items-center justify-start p-2 rounded-xl hover:bg-mai-text/10 transition-all cursor-pointer group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-mai-text/5 flex items-center justify-center text-mai-text mb-2 border border-mai-border/10 group-hover:border-mai-primary/50 group-hover:scale-105 transition-all">
                                                {item.icon ? <item.icon size={20} className="text-mai-text/80" /> : <Folder size={20} className="text-mai-text/80" />}
                                            </div>
                                            <span className="text-[10px] text-center text-mai-subtext font-medium truncate w-full group-hover:text-mai-text">{item.name}</span>
                                        </div>
                                    ))}
                                    <div
                                        onClick={() => openWindow({ id: 'terminal', title: 'Terminal', type: 'component', content: 'terminal' })}
                                        className="flex flex-col items-center justify-start p-2 rounded-xl hover:bg-mai-text/10 transition-all cursor-pointer group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-mai-text/5 flex items-center justify-center text-mai-success mb-2 border border-mai-border/10 group-hover:border-mai-success/50 group-hover:scale-105 transition-all">
                                            <Terminal size={20} />
                                        </div>
                                        <span className="text-[10px] text-center text-mai-subtext font-medium truncate w-full group-hover:text-mai-text">Terminal</span>
                                    </div>
                                </div>

                                {/* Desktop colophon */}
                                <div className="gfx-data-row mt-4 pt-3 border-t border-mai-border/10">
                                    <span>hyprland rice</span>
                                    <span className="gfx-sq" />
                                    <span>catppuccin</span>
                                    <span className="gfx-sq" />
                                    <span>フォワード</span>
                                </div>
                            </div>

                            {/* 04 — Tech Stack */}
                            <div className="relative backdrop-blur-md rounded-3xl p-6 flex-1" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                                {/* GFX: Corner brackets */}
                                <div className="gfx-corner-tl" style={{ width: '12px', height: '12px' }} />
                                <div className="gfx-corner-br" style={{ width: '12px', height: '12px' }} />

                                {/* GFX: CLASS label */}
                                <div className="absolute top-2 right-4 flex items-center gap-2">
                                    <span className="gfx-hash">CLASS GRM-976</span>
                                    <span className="gfx-reg-mark" />
                                </div>

                                {/* GFX: Watermark kanji */}
                                <div className="absolute bottom-2 right-4 opacity-[0.04] text-4xl font-bold pointer-events-none select-none" style={{ fontFamily: 'var(--font-mplus)' }}>通り</div>

                                <div className="flex items-center gap-3 mb-4">
                                    <span className="gfx-section-number">04</span>
                                    <span className="text-mai-text font-light text-sm tracking-wide">Stack</span>
                                    <span className="gfx-jp ml-1">技術</span>
                                    <span className="gfx-cross ml-auto">＋</span>
                                    <span className="gfx-slash-label">{'// tech specs'}</span>
                                </div>

                                {/* GFX: +5HP badge */}
                                <div className="flex items-center gap-1 mb-3 opacity-20">
                                    <span className="text-[9px] font-mono font-bold text-mai-text tracking-wider">▼ +5HP</span>
                                    <div className="flex gap-px">
                                        <div className="w-1 h-2 bg-mai-text" />
                                        <div className="w-1 h-3 bg-mai-text" />
                                        <div className="w-1 h-2 bg-mai-text" />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {loading ? (
                                        <div className="h-6 w-full rounded-full animate-pulse" style={{ background: 'var(--card-bg)' }} />
                                    ) : (
                                        (techStack.length > 0 ? techStack : ['Next.js', 'React', 'TypeScript']).map((tech) => (
                                            <span key={tech} className="px-3 py-1 bg-mai-text/5 rounded-full text-xs text-mai-subtext border border-mai-border/10 flex items-center gap-1.5">
                                                <span className="w-1 h-1 rounded-full bg-mai-primary/40" />
                                                {tech}
                                            </span>
                                        ))
                                    )}
                                </div>

                                {/* Tech colophon */}
                                <div className="gfx-data-row mt-4 pt-3 border-t border-mai-border/10">
                                    <span>GRM. 034</span>
                                    <span className="gfx-sq" />
                                    <span>SPEC RACING IND.</span>
                                    <span>→→</span>
                                    <span className="gfx-sq" />
                                    <span>Next.js</span>
                                    <span className="gfx-sq" />
                                    <span>Tailwind v4</span>
                                    <span className="gfx-sq" />
                                    <span>Vercel</span>
                                </div>
                            </div>

                            {/* Barcode + credits at bottom (removed) */}
                            {/* Moved to footer */}

                        </div>

                    </div>

                    {/* ═══ BOTTOM COLOPHON ═══ */}
                    <div className="mt-12 pt-6 border-t border-mai-border/10">

                        {/* Top row: data strip */}
                        <div className="gfx-data-row">
                            <span>© {new Date().getFullYear()}</span>
                            <span className="gfx-sq" />
                            <span>Mai Aphrodite</span>
                            <span>＋</span>
                            <span>Next.js</span>
                            <span className="gfx-sq" />
                            <span>{'Catppuccin Mocha // Latte'}</span>
                            <span className="gfx-sq" />
                            <span>Fredoka × M PLUS</span>
                        </div>
                        {/* Bottom row: Japanese + hash + dots */}
                        <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                                <span className="gfx-jp">校正シート</span>
                                <div className="gfx-accent-bar pink" style={{ width: '60px' }} />
                                <span className="gfx-hash">3C0063A1.{String(projects.length).padStart(2, '0')}B60C × {new Date().getFullYear() % 100}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="gfx-jp">開発</span>
                                <span className="gfx-dot" />
                                <span className="gfx-jp">デザイン</span>
                                <span className="gfx-dot" />
                                <span className="gfx-jp">ポートフォリオ</span>
                                <div className="ml-4 flex flex-col items-end gap-0.5 border-l border-mai-border/20 pl-4">
                                    <span className="gfx-meta">DESIGN BY</span>
                                    <span className="gfx-meta" style={{ opacity: 0.8, fontWeight: 700 }}>MAI APHRODITE</span>
                                </div>
                            </div>
                        </div>
                        {/* Final proof marks row */}
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-3">

                                <span className="gfx-sec-code">SEC_EP</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="gfx-reg-mark" />
                                <span className="gfx-reg-mark" />
                                <span className="gfx-dot" />
                                <span className="gfx-reg-mark" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE GUTTER (Hidden on smaller screens) */}
                <div className="gfx-gutter-container hidden xl:flex border-l border-mai-border/10 ml-4">
                    <div className="gfx-reg-target mb-auto" />
                    {/* CMYK strip removed */}
                    <div className="gfx-reg-target mt-auto" />
                </div>
            </div>
        </div>
    );
};

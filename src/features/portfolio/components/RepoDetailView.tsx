"use client";

import React, { useState, useEffect } from 'react';
import { Star, GitFork, ExternalLink, Code, Calendar, Globe } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GithubRepo, fetchRepoReadme } from '@/features/portfolio/services/github';

interface RepoDetailViewProps {
    repo: GithubRepo;
    owner: string;
}

export const RepoDetailView = ({ repo, owner }: RepoDetailViewProps) => {
    const [readme, setReadme] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRepoReadme(owner, repo.name).then(data => {
            setReadme(data);
            setLoading(false);
        });
    }, [owner, repo.name]);

    return (
        <div className="h-full flex flex-col overflow-hidden bg-mai-bg">
            {/* Header */}
            <div className="relative shrink-0 p-5 border-b border-mai-border/20" style={{ background: 'var(--card-bg)' }}>
                {/* GFX decorations */}
                <div className="absolute top-2 right-3 flex gap-0.5 opacity-15">
                    <span className="text-[8px] font-mono text-mai-text tracking-widest">▶▶▶</span>
                </div>
                <div className="absolute bottom-2 left-5 opacity-10">
                    <span className="text-[7px] font-mono text-mai-text tracking-wider">GRM-{String(repo.id).slice(-4)}</span>
                </div>

                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-mono text-mai-subtext tracking-widest uppercase">{owner}</span>
                            <span className="text-mai-subtext/30">/</span>
                        </div>
                        <h1 className="text-xl font-bold text-mai-text truncate">{repo.name}</h1>
                        {repo.description && (
                            <p className="text-sm text-mai-subtext mt-1.5 line-clamp-2">{repo.description}</p>
                        )}
                    </div>
                    <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-mai-primary/10 hover:bg-mai-primary/20 text-mai-primary rounded-lg text-xs font-semibold transition-colors border border-mai-primary/20"
                    >
                        <Globe size={14} />
                        View on GitHub
                        <ExternalLink size={12} />
                    </a>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 mt-3 text-xs">
                    {repo.language && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-mai-primary/10 rounded-md text-mai-primary font-mono">
                            <Code size={12} />
                            {repo.language}
                        </span>
                    )}
                    <span className="flex items-center gap-1 text-mai-subtext">
                        <Star size={12} className="text-yellow-500" />
                        {repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1 text-mai-subtext">
                        <Calendar size={12} />
                        {new Date(repo.updated_at).toLocaleDateString()}
                    </span>
                    {repo.topics && repo.topics.length > 0 && (
                        <div className="flex items-center gap-1.5 ml-auto">
                            {repo.topics.slice(0, 3).map(topic => (
                                <span key={topic} className="px-2 py-0.5 bg-mai-text/5 rounded text-[10px] text-mai-subtext font-mono">
                                    {topic}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* README Body */}
            <div className="flex-1 overflow-y-auto p-5">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-32 gap-3">
                        <div className="w-8 h-8 border-2 border-mai-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-mai-subtext font-mono">Fetching README.md...</span>
                    </div>
                ) : readme ? (
                    <div className="prose prose-sm prose-invert max-w-none
                        prose-headings:text-mai-text prose-headings:font-bold prose-headings:border-b prose-headings:border-mai-border/20 prose-headings:pb-2
                        prose-p:text-mai-subtext prose-p:leading-relaxed
                        prose-a:text-mai-primary prose-a:no-underline hover:prose-a:underline
                        prose-code:text-mai-primary prose-code:bg-mai-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
                        prose-pre:bg-mai-surface prose-pre:border prose-pre:border-mai-border/20 prose-pre:rounded-lg
                        prose-img:rounded-lg prose-img:border prose-img:border-mai-border/10
                        prose-strong:text-mai-text
                        prose-li:text-mai-subtext
                        prose-blockquote:border-mai-primary/30 prose-blockquote:text-mai-subtext
                        prose-hr:border-mai-border/20
                        prose-table:text-mai-subtext prose-th:text-mai-text prose-td:border-mai-border/20 prose-th:border-mai-border/20
                    ">
                        <Markdown remarkPlugins={[remarkGfm]}>{readme}</Markdown>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-mai-subtext text-sm">
                        <p className="mb-2">No README found for this repository.</p>
                        <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-mai-primary hover:underline text-xs"
                        >
                            View on GitHub instead →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

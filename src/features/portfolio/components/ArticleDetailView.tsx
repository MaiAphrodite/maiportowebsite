"use client";

import React from 'react';
import { ExternalLink, Calendar, BookOpen } from 'lucide-react';
import { MediumArticle } from '@/services/medium';

interface ArticleDetailViewProps {
    article: MediumArticle;
}

export const ArticleDetailView = ({ article }: ArticleDetailViewProps) => {
    return (
        <div className="h-full flex flex-col overflow-hidden bg-mai-bg">
            {/* Thumbnail / Header Visual */}
            {article.thumbnail ? (
                <div className="relative shrink-0 h-48 overflow-hidden">
                    <img
                        src={article.thumbnail}
                        alt={article.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-mai-bg via-mai-bg/40 to-transparent" />

                    {/* GFX overlay */}
                    <div className="absolute top-3 right-3 opacity-20">
                        <span className="text-[8px] font-mono text-white tracking-widest">▶▶▶ MEDIUM</span>
                    </div>
                </div>
            ) : (
                <div className="relative shrink-0 h-32 flex items-center justify-center" style={{ background: 'var(--card-bg)' }}>
                    <BookOpen size={40} className="text-mai-primary/20" />
                    <div className="absolute top-3 right-3 opacity-15">
                        <span className="text-[8px] font-mono text-mai-text tracking-widest">▶▶▶ MEDIUM</span>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 p-6 flex flex-col">
                {/* Meta */}
                <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center gap-1.5 text-xs text-mai-subtext">
                        <Calendar size={12} />
                        {article.date}
                    </span>
                    <span className="text-mai-subtext/30">•</span>
                    <span className="text-xs text-mai-subtext font-mono">Medium</span>

                    {/* GFX hash */}
                    <span className="ml-auto text-[8px] font-mono text-mai-text/10 tracking-widest">SEC_ART</span>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-mai-text mb-4 leading-tight">{article.title}</h1>

                {/* Divider */}
                <div className="h-px w-full bg-gradient-to-r from-mai-border/20 via-mai-primary/10 to-transparent mb-6" />

                {/* Description placeholder */}
                <p className="text-mai-subtext text-sm leading-relaxed mb-6 flex-1">
                    This article was published on Medium. Click the button below to read the full content on Medium.
                </p>

                {/* Action */}
                <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-gradient-to-r from-mai-primary to-mai-accent hover:opacity-90 text-white font-semibold rounded-xl transition-all hover:scale-[1.01] shadow-md"
                >
                    <BookOpen size={18} />
                    Read on Medium
                    <ExternalLink size={14} className="ml-1" />
                </a>

                {/* GFX bottom */}
                <div className="flex items-center justify-between mt-4 opacity-10">
                    <span className="text-[7px] font-mono text-mai-text tracking-widest">GRM ■ ARTICLES</span>
                    <span className="text-[7px] font-mono text-mai-text">◀◀◀</span>
                </div>
            </div>
        </div>
    );
};

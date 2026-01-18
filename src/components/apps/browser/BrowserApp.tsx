"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Lock, Search, Globe, AlertTriangle, Tv } from 'lucide-react';
import { SIMULATED_SITES, MOCK_SEARCH_RESULTS } from './browserData';
import { useDesktopActions } from '@/context/DesktopContext';

// --- Pages ---

const HomePage = ({ onNavigate }: { onNavigate: (url: string) => void }) => {
    const [query, setQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onNavigate(`mai://search?q=${encodeURIComponent(query)}`);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-full p-8 text-center animate-in fade-in duration-500">
            <div className="mb-8">
                <span className="text-6xl md:text-8xl font-black text-mai-primary tracking-tighter">Mai</span>
                <span className="text-6xl md:text-8xl font-thin text-mai-text tracking-tighter">Net</span>
            </div>

            <form onSubmit={handleSearch} className="w-full max-w-xl relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="text-mai-subtext group-focus-within:text-mai-primary transition-colors" size={20} />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search the simulation..."
                    className="w-full bg-mai-surface border-2 border-mai-border rounded-full py-4 pl-12 pr-6 text-lg shadow-sm focus:outline-none focus:border-mai-primary focus:ring-4 focus:ring-mai-primary/10 transition-all font-medium"
                />
            </form>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                {SIMULATED_SITES.map((site) => (
                    <button
                        key={site.url}
                        onClick={() => onNavigate(site.url)}
                        className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-mai-surface-dim/50 transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-full bg-mai-surface flex items-center justify-center text-mai-text border-2 border-mai-border group-hover:scale-110 transition-transform shadow-sm">
                            {site.icon === 'Tv' ? <Tv size={20} /> : <Globe size={20} />}
                        </div>
                        <span className="text-sm font-medium text-mai-text/80">{site.title}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const SearchPage = ({ query }: { query: string }) => {
    return (
        <div className="p-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-medium text-mai-subtext mb-6">Results for "{query}"</h2>

            <div className="space-y-8">
                {MOCK_SEARCH_RESULTS.map((result, i) => (
                    <div key={i} className="group cursor-pointer hover:translate-x-1 transition-transform">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-mai-surface border border-mai-border flex items-center justify-center text-[10px]">M</div>
                            <span className="text-sm text-mai-text/60 truncate">{result.url}</span>
                        </div>
                        <h3 className="text-xl text-blue-400 group-hover:underline font-medium mb-1">{result.title}</h3>
                        <p className="text-mai-subtext text-sm leading-relaxed">{result.snippet}</p>
                    </div>
                ))}

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3 mt-8">
                    <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
                    <div>
                        <h4 className="font-bold text-yellow-500 text-sm">Simulation Boundary Warning</h4>
                        <p className="text-xs text-yellow-500/80 mt-1">
                            Further search results are restricted by your current clearance level.
                            Please contact system administrator (Mai) for elevated privileges.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ErrorPage = ({ url }: { url: string }) => (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-mai-text">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-500 animate-pulse">
            <AlertTriangle size={48} />
        </div>
        <h1 className="text-3xl font-bold mb-2">Connection Reset</h1>
        <p className="text-mai-subtext max-w-md">
            The requested URL <code className="bg-mai-surface px-2 py-0.5 rounded text-red-400">{url}</code>
            violates the simulation integrity protocol.
        </p>
        <p className="text-xs text-mai-subtext/50 mt-8 font-mono">ERR_SIMULATION_BOUNDARY_REACHED</p>
    </div>
);

// --- Main App ---

export const BrowserApp = () => {
    const [history, setHistory] = useState<string[]>(['mai://home']);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [inputUrl, setInputUrl] = useState('mai://home');
    const [isLoading, setIsLoading] = useState(false);

    const currentUrl = history[currentIndex];

    const { openWindow } = useDesktopActions();

    const navigate = (url: string) => {
        // Intercept Special App URLs
        if (url === 'mai://live') {
            openWindow({
                id: 'chat-stream',
                title: 'Mai Stream - Live',
                type: 'component',
                content: 'stream-chat',
                size: { width: 900, height: 600 }
            });
            // Don't actually navigate the browser "page" if we opened a window?
            // Or maybe separate it? User wants to open it "directly there".
            // If they mean "inside the browser window", that's an iframe. 
            // If they mean "launch the app", this is correct.
            // Let's assume launch app window as it's better UX for "apps".
            // But maybe we should show a "Launching..." page in browser?
            return;
        }

        setIsLoading(true);
        // Simulate network delay
        setTimeout(() => {
            const newHistory = history.slice(0, currentIndex + 1);
            newHistory.push(url);
            setHistory(newHistory);
            setCurrentIndex(newHistory.length - 1);
            setInputUrl(url);
            setIsLoading(false);
        }, 500 + Math.random() * 500);
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setInputUrl(history[currentIndex - 1]);
        }
    };

    const handleForward = () => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setInputUrl(history[currentIndex + 1]);
        }
    };

    const handleRefresh = () => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 800);
    };

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let target = inputUrl;
        if (!target.includes('://')) {
            // Auto search
            navigate(`mai://search?q=${encodeURIComponent(target)}`);
            return;
        }

        // Block real web
        if (target.startsWith('http') || target.startsWith('www')) {
            navigate(`mai://error?url=${encodeURIComponent(target)}`);
            return;
        }

        navigate(target);
    };

    // Render Content
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="h-full flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-mai-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            );
        }

        if (currentUrl === 'mai://home') return <HomePage onNavigate={navigate} />;
        if (currentUrl.startsWith('mai://search')) {
            const params = new URLSearchParams(currentUrl.split('?')[1]);
            return <SearchPage query={params.get('q') || ''} />;
        }
        if (currentUrl.includes('error')) {
            const params = new URLSearchParams(currentUrl.split('?')[1]);
            return <ErrorPage url={params.get('url') || 'Unknown'} />;
        }

        // Default: 404/Error for unhandled pages
        return <ErrorPage url={currentUrl} />;
    };

    return (
        <div className="flex flex-col h-full bg-white text-gray-900 overflow-hidden font-sans">
            {/* Browser Interface */}
            <div className="h-14 bg-[#f0f2f5] border-b border-[#e1e3e6] flex items-center px-4 gap-3 shrink-0">
                <div className="flex items-center gap-1 text-gray-600">
                    <button onClick={handleBack} disabled={currentIndex === 0} className="p-1.5 rounded-full hover:bg-black/5 disabled:opacity-30 transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <button onClick={handleForward} disabled={currentIndex === history.length - 1} className="p-1.5 rounded-full hover:bg-black/5 disabled:opacity-30 transition-colors">
                        <ArrowRight size={18} />
                    </button>
                    <button onClick={handleRefresh} className="p-1.5 rounded-full hover:bg-black/5 transition-colors">
                        <RotateCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="flex-1 bg-white border-2 border-transparent focus-within:border-mai-primary/50 shadow-sm rounded-full overflow-hidden flex items-center h-9 px-3 transition-all">
                    {currentUrl.startsWith('mai://') ? <Lock size={12} className="text-green-500 mr-2" /> : <AlertTriangle size={12} className="text-red-500 mr-2" />}
                    <form onSubmit={handleUrlSubmit} className="flex-1">
                        <input
                            type="text"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            className="w-full text-sm outline-none text-gray-700 font-medium"
                            spellCheck={false}
                        />
                    </form>
                </div>

                <button onClick={() => navigate('mai://home')} className="p-2 rounded-full hover:bg-black/5 text-gray-600 transition-colors">
                    <Home size={18} />
                </button>
            </div>

            {/* Viewport */}
            <div className="flex-1 overflow-auto bg-white relative">
                {renderContent()}
            </div>

            {/* Status Bar (Fake) */}
            <div className="h-6 bg-[#f0f2f5] border-t border-[#e1e3e6] px-3 flex items-center justify-between text-[10px] text-gray-500 cursor-default select-none shrink-0">
                <span>Simulation Safe Mode: ON</span>
                <span>MaiNet v12.4.0</span>
            </div>
        </div>
    );
};

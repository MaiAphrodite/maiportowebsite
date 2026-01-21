"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Send, MoreHorizontal, Heart, RotateCw, Maximize2, Eye, EyeOff, RefreshCw, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { useDesktopActions, useDesktopState } from '@/features/desktop';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { useChatContext } from '@/features/chat/context/ChatContext';
import { useTyper } from '@/features/chat/hooks/useTyper';

// Resilient Turnstile Verification Component
const TurnstileVerification = React.memo(({
    onSuccess,
    onError
}: {
    onSuccess: (token: string) => void;
    onError: () => void;
}) => {
    const [status, setStatus] = useState<'loading' | 'visible' | 'failed' | 'success'>('loading');
    const [mode, setMode] = useState<'invisible' | 'managed'>('invisible');
    const [retryCount, setRetryCount] = useState(0);
    const turnstileRef = useRef<TurnstileInstance | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // Start timeout when loading
    useEffect(() => {
        if (status === 'loading') {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            const timeoutMs = mode === 'invisible' ? 8000 : 15000;
            timeoutRef.current = setTimeout(() => {
                console.warn('[Turnstile] Timeout - widget did not respond');
                if (mode === 'invisible') {
                    console.log('[Turnstile] Falling back to managed mode');
                    setMode('managed');
                    setStatus('visible');
                    setRetryCount(0);
                } else {
                    setStatus('failed');
                }
            }, timeoutMs);
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [status, mode, retryCount]);

    const handleSuccess = useCallback((token: string) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setStatus('success');
        onSuccess(token);
    }, [onSuccess]);

    const handleError = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        console.warn('[Turnstile] Error occurred');

        if (mode === 'invisible') {
            setMode('managed');
            setStatus('visible');
            setRetryCount(0);
        } else {
            setStatus('failed');
            onError();
        }
    }, [mode, onError]);

    const handleExpire = useCallback(() => {
        console.warn('[Turnstile] Token expired');
        setStatus('loading');
        turnstileRef.current?.reset();
    }, []);

    const handleRetry = useCallback(() => {
        setRetryCount(prev => prev + 1);
        setStatus('loading');
        turnstileRef.current?.reset();
    }, []);

    if (status === 'success') return null;

    if (status === 'loading' && mode === 'invisible') {
        return (
            <div className="flex items-center gap-2 text-mai-subtext text-xs py-2">
                <RotateCw size={12} className="animate-spin" />
                <span>Verifying...</span>
                <Turnstile
                    ref={turnstileRef}
                    siteKey={siteKey}
                    onSuccess={handleSuccess}
                    onError={handleError}
                    onExpire={handleExpire}
                    options={{ size: 'invisible', theme: 'light', retry: 'auto', retryInterval: 3000 }}
                />
            </div>
        );
    }

    if (mode === 'managed') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-mai-surface border-2 border-mai-border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 flex flex-col items-center gap-4 text-center animate-in zoom-in-95 duration-200">
                    {status === 'failed' ? (
                        <>
                            <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-2">
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-mai-text">Verification Failed</h3>
                            <p className="text-sm text-mai-subtext">We couldn&apos;t verify you automatically. Please try disabling ad-blockers or using a different browser.</p>
                            <Button onClick={handleRetry} className="mt-2 w-full bg-mai-primary text-white hover:bg-mai-primary/90">
                                <RefreshCw size={16} className="mr-2" />
                                Try Again
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center mb-2">
                                {status === 'loading' ? (<RotateCw size={24} className="animate-spin text-pink-500" />) : (<span className="text-2xl">🛡️</span>)}
                            </div>
                            <h3 className="text-lg font-bold text-mai-text">Security Check</h3>
                            <p className="text-sm text-mai-subtext mb-2">Please complete the verification below to continue chatting.</p>
                            <div className="min-h-[65px] flex justify-center w-full overflow-hidden relative">
                                <Turnstile
                                    ref={turnstileRef}
                                    key={`turnstile-${mode}-${retryCount}`}
                                    siteKey={siteKey}
                                    onSuccess={handleSuccess}
                                    onError={handleError}
                                    onExpire={handleExpire}
                                    options={{ size: 'normal', theme: 'light', retry: 'auto', retryInterval: 3000 }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }
    return null;
});
TurnstileVerification.displayName = 'TurnstileVerification';

type MessagePart = { type: string; text?: string };
type ChatMessage = { id: string; role: string; content?: string; parts?: MessagePart[]; createdAt?: Date | number };

const SubtitleWord = React.memo(({ word }: { word: string }) => (
    <span className="relative inline-block text-lg md:text-xl font-bold leading-relaxed px-[0.15em] -mx-[0.05em] animate-word-bounce" style={{ fontFamily: 'var(--font-fredoka), var(--font-mplus), sans-serif' }}>
        <span aria-hidden="true" className="absolute inset-0 px-[0.15em]" style={{ WebkitTextStroke: '6px #e879f9', color: 'transparent', left: 0, right: 0 }}>{word}</span>
        <span className="relative text-white z-10" style={{ textShadow: '0.5px 0.5px 0px rgba(0, 0, 0, 0.5)' }}>{word}</span>
    </span>
));
SubtitleWord.displayName = 'SubtitleWord';

// Sub-component: Stream Feed (Handles High Frequency Typing Updates)
const StreamFeed = React.memo(({
    latestAssistantMessage,
    isCompact,
    isVoiceEnabled,
    spokenText
}: {
    latestAssistantMessage: ChatMessage | undefined,
    isCompact: boolean,
    isVoiceEnabled: boolean,
    spokenText?: string
}) => {
    // Use context state for persistence across remounts
    const { displayedMessageId, setDisplayedMessageId } = useChatContext();

    // Filter message text logic
    const getMessageContent = (msg?: ChatMessage) => {
        if (!msg) return '';
        if (msg.content) return msg.content;
        if (msg.parts) {
            return msg.parts.filter((p: MessagePart) => p.type === 'text').map((p: MessagePart) => p.text).join('');
        }
        return '';
    };

    const getPagedSubtitle = (text: string) => {
        if (!text) return '';
        const words = text.split(' ');
        const pageSize = 20;
        const pageIndex = Math.floor((words.length - 1) / pageSize);
        const startIndex = pageIndex * pageSize;
        const currentWords = words.slice(startIndex, startIndex + pageSize);
        return currentWords.join(' ');
    };

    const currentFullText = getMessageContent(latestAssistantMessage);

    // --- MODULAR HOOK USAGE ---
    const { displayedText, setDisplayedText } = useTyper({
        fullText: currentFullText,
        isVoiceEnabled,
        spokenText,
        onTypeComplete: () => { }
    });
    // --------------------------

    // Watch for new messages (Reset logic)
    useEffect(() => {
        if (!latestAssistantMessage) {
            if (displayedText !== '') setDisplayedText('');
            return;
        }
        if (latestAssistantMessage.id !== displayedMessageId) {
            setDisplayedText('');
            setDisplayedMessageId(latestAssistantMessage.id);
        }
    }, [latestAssistantMessage, displayedMessageId, displayedText, setDisplayedMessageId, setDisplayedText]);

    const pagedSubtitle = getPagedSubtitle(displayedText);
    const words = React.useMemo(() => pagedSubtitle ? pagedSubtitle.split(' ') : [], [pagedSubtitle]);

    return (
        <div className={`relative bg-mai-surface-dim flex flex-col justify-center items-center overflow-hidden group aspect-video rounded-xl border-2 border-mai-border ${isCompact ? 'shrink-0 mx-3 mt-3' : 'flex-1 min-w-0 max-h-full m-3'}`}>
            <div className="absolute top-3 left-3 bg-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 flex items-center gap-1.5">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
            </div>
            <div className="absolute top-3 right-3 bg-mai-surface text-mai-text text-xs font-medium px-3 py-1.5 rounded-full z-10 flex items-center gap-1.5 border-2 border-mai-border">
                <span className="text-pink-500">♡</span> 1.2k watching
            </div>
            <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative w-full h-full">
                    <Image src="/assets/streamsimple.png" alt="Mai Live" fill className="object-contain" priority />
                </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-mai-surface/95 opacity-0 group-hover:opacity-100 transition-opacity flex items-center px-4 gap-4 rounded-b-xl">
                <Button variant="ghost" size="icon" className="text-mai-text hover:text-mai-primary hover:bg-transparent"><Maximize2 size={18} /></Button>
                <div className="flex-1 h-1.5 bg-mai-surface-dim rounded-full overflow-hidden">
                    <div className="w-full h-full bg-pink-400 rounded-full" />
                </div>
            </div>
            {words.length > 0 && (
                <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[90%] md:max-w-[70%] z-20 flex flex-wrap justify-center gap-x-1.5 gap-y-1">
                    {words.map((word, i) => (
                        <SubtitleWord key={`${i}-${word}`} word={word} />
                    ))}
                </div>
            )}
        </div>
    );
});

StreamFeed.displayName = 'StreamFeed';

const formatTimestamp = (date?: Date | number) => {
    if (!date) return '';
    const d = typeof date === 'number' ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatSidebar = React.memo(({
    allMessages,
    userMessages,
    messageTimestamps,
    status,
    isLoading,
    token,
    setToken,
    input,
    handleInputChange,
    handleSubmit,
    isCompact,
    showAiReplies,
    setShowAiReplies,
    isVoiceEnabled,
    setIsVoiceEnabled
}: {
    allMessages: ChatMessage[],
    userMessages: ChatMessage[],
    messageTimestamps: Map<string, Date>,
    status: string,
    isLoading: boolean,
    token: string | null,
    setToken: (t: string | null) => void,
    input: string,
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    handleSubmit: (e: React.FormEvent) => void,
    isCompact: boolean,
    showAiReplies: boolean,
    setShowAiReplies: (v: boolean) => void,
    isVoiceEnabled: boolean,
    setIsVoiceEnabled: (v: boolean) => void
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const getMessageContent = (msg?: ChatMessage) => {
        if (!msg) return '';
        if (msg.content) return msg.content;
        if (msg.parts) {
            return msg.parts.filter((p: MessagePart) => p.type === 'text').map((p: MessagePart) => p.text).join('');
        }
        return '';
    };

    const displayMessages = showAiReplies
        ? allMessages.filter((m: ChatMessage) => m.id !== 'welcome')
        : userMessages;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [displayMessages.length]);

    return (
        <div className={`bg-mai-surface flex flex-col overflow-hidden border-2 border-mai-border rounded-xl ${isCompact ? 'flex-1 min-h-0 mx-3 mb-3' : 'w-[300px] flex-none min-h-0 my-3 mr-3'}`}>
            <div className="p-3 border-b-2 border-mai-border flex justify-between items-center shrink-0 relative">
                <span className="text-mai-text font-semibold flex items-center gap-2">💬 Chat</span>
                <Button variant="ghost" size="icon" className="w-6 h-6 text-mai-subtext hover:text-mai-text" onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={16} /></Button>
                {menuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-1 bg-mai-surface border-2 border-mai-border rounded-xl shadow-lg z-50 min-w-[180px] overflow-hidden">
                            <button onClick={() => { setShowAiReplies(!showAiReplies); setMenuOpen(false); }} className="w-full px-3 py-2.5 flex items-center gap-2 text-sm text-mai-text hover:bg-mai-surface-dim transition-colors text-left">
                                {showAiReplies ? <Eye size={14} /> : <EyeOff size={14} />} <span>{showAiReplies ? 'Showing AI replies' : 'AI replies hidden'}</span>
                            </button>
                            <button onClick={() => { setIsVoiceEnabled(!isVoiceEnabled); setMenuOpen(false); }} className="w-full px-3 py-2.5 flex items-center gap-2 text-sm text-mai-text hover:bg-mai-surface-dim transition-colors text-left">
                                {isVoiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />} <span>{isVoiceEnabled ? 'Voice Mode On' : 'Voice Mode Off'}</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
            {isCompact && (
                <div className="px-3 py-2 border-b-2 border-mai-border bg-mai-surface shrink-0">
                    <form onSubmit={handleSubmit} className="flex gap-2 min-w-0">
                        <Input ref={inputRef} type="text" value={input} onChange={handleInputChange} placeholder={token ? "Say something cute~" : "Verifying..."} className="flex-1 min-w-0 bg-mai-surface-dim text-mai-text rounded-full px-4 py-2.5 text-sm focus-visible:ring-mai-primary border-2 border-mai-border disabled:opacity-50 placeholder:text-mai-subtext transition-all h-auto" disabled={!token} />
                        <Button type="submit" disabled={isLoading || !input.trim() || !token} variant="default" size="icon" className="bg-pink-400 hover:bg-pink-500 text-white rounded-full shrink-0"><Send size={16} /></Button>
                        <Button variant="ghost" size="icon" type="button" className="text-mai-subtext hover:text-pink-500 hover:bg-transparent shrink-0"><Heart size={18} /></Button>
                    </form>
                    {!token && (<div className="flex justify-center pt-2"><TurnstileVerification onSuccess={setToken} onError={() => setToken(null)} /></div>)}
                </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex gap-2 items-start opacity-80">
                    <div className="w-6 h-6 rounded-full bg-pink-400 flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">✦</div>
                    <div className="flex-1 min-w-0"><span className="text-mai-primary text-xs font-semibold mr-2">System</span><span className="text-mai-subtext text-sm">Welcome! Say hello to Mai~ ♡</span></div>
                </div>
                {displayMessages.map((msg: ChatMessage) => {
                    const isUser = msg.role === 'user';
                    const isLastUserMsg = isUser && msg.id === userMessages[userMessages.length - 1]?.id;
                    return (
                        <div key={msg.id} className="flex gap-2 items-start">
                            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] text-white font-bold ${isUser ? 'bg-blue-400' : 'bg-pink-400'}`}>{isUser ? 'You' : '♡'}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold ${isUser ? 'text-mai-secondary' : 'text-mai-primary'}`}>{isUser ? 'You' : 'Mai'}</span>
                                    <span className="text-[10px] text-mai-subtext opacity-60">{formatTimestamp(messageTimestamps.get(msg.id))}</span>
                                    {status === 'submitted' && isLastUserMsg && (<RotateCw size={12} className="text-mai-subtext animate-spin" />)}
                                </div>
                                <span className={`text-sm break-words leading-relaxed ${isLoading && isLastUserMsg ? 'text-mai-subtext' : 'text-mai-text'}`}>{getMessageContent(msg)}</span>
                            </div>
                        </div>
                    );
                })}
                {isLoading && (<div className="flex gap-2 items-start opacity-50"></div>)}
                <div ref={messagesEndRef} />
            </div>
            {!isCompact && (
                <div className="px-3 pt-2 border-t-2 border-mai-border bg-mai-surface relative" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
                    <form onSubmit={handleSubmit} className="flex gap-2 min-w-0">
                        <Input ref={inputRef} type="text" value={input} onChange={handleInputChange} placeholder={token ? "Say something cute~" : "Verifying..."} className="flex-1 min-w-0 bg-mai-surface-dim text-mai-text rounded-full px-4 py-2.5 text-sm focus-visible:ring-mai-primary border-2 border-mai-border disabled:opacity-50 placeholder:text-mai-subtext transition-all h-auto" disabled={!token} />
                        <Button type="submit" disabled={isLoading || !input.trim() || !token} variant="default" size="icon" className="bg-pink-400 hover:bg-pink-500 text-white rounded-full shrink-0"><Send size={16} /></Button>
                        <Button variant="ghost" size="icon" type="button" className="text-mai-subtext hover:text-pink-500 hover:bg-transparent shrink-0"><Heart size={18} /></Button>
                    </form>
                    {!token && (<div className="absolute bottom-full left-0 right-0 flex justify-center pb-2 pointer-events-auto"><TurnstileVerification onSuccess={setToken} onError={() => setToken(null)} /></div>)}
                </div>
            )}
        </div>
    );
});
ChatSidebar.displayName = 'ChatSidebar';

export const ChatStreamApp = () => {
    const { messages, sendMessage, status, isLoading, input, setInput, token, setToken, messageTimestamps, showAiReplies, setShowAiReplies, isVoiceEnabled, setIsVoiceEnabled } = useChatContext();
    const userMessages = messages.filter((m: ChatMessage) => m.role === 'user');
    const latestAssistantMessage = [...messages].reverse().find((m: ChatMessage) => m.role === 'assistant');

    const [spokenTranscript, setSpokenTranscript] = useState('');
    const { speak, speakMessage, reset: resetTTS } = useTTS({
        onSpeakStart: (text) => {
            setSpokenTranscript(prev => {
                if (!prev) return text;
                if (prev.endsWith(text)) return prev;
                return `${prev} ${text}`;
            });
        }
    });

    // Streaming state refs
    const lastSpokenIndexRef = useRef(0);
    const displayedMessageIdRef = useRef<string | null>(null);

    useEffect(() => { setSpokenTranscript(''); }, [latestAssistantMessage?.id]);

    const getMessageContent = (msg?: ChatMessage) => {
        if (!msg) return '';
        if (msg.content) return msg.content;
        if (msg.parts) {
            return msg.parts.filter((p: MessagePart) => p.type === 'text').map((p: MessagePart) => p.text).join('');
        }
        return '';
    };

    // Streaming sentence dispatch: speak sentences AS they arrive
    useEffect(() => {
        if (!latestAssistantMessage || latestAssistantMessage.role !== 'assistant') {
            lastSpokenIndexRef.current = 0;
            return;
        }

        // Reset on new message
        if (latestAssistantMessage.id !== displayedMessageIdRef.current) {
            displayedMessageIdRef.current = latestAssistantMessage.id;
            lastSpokenIndexRef.current = 0;
        }

        if (!isVoiceEnabled) return;

        const fullText = getMessageContent(latestAssistantMessage);
        const unspokenText = fullText.slice(lastSpokenIndexRef.current);

        // Look for natural break points: commas, semicolons, colons, dashes, or sentence-ending punctuation
        // This produces shorter phrases for lower latency
        const phraseMatch = unspokenText.match(/([,;:\-—.!?]+)(\s)/);

        if (phraseMatch && phraseMatch.index !== undefined) {
            const endIndex = phraseMatch.index + phraseMatch[0].length;
            const phrase = unspokenText.slice(0, endIndex).trim();

            // Only speak phrases with at least 3 words (avoid tiny fragments)
            const wordCount = phrase.split(/\s+/).length;
            if (phrase && wordCount >= 3) {
                console.log(`[TTS] Streaming phrase (${wordCount} words): "${phrase.slice(0, 40)}..."`);
                speak(phrase);
                lastSpokenIndexRef.current += endIndex;
            } else if (endIndex > 50) {
                // If phrase is too short but we've buffered a lot, speak anyway
                console.log(`[TTS] Streaming fragment: "${phrase.slice(0, 40)}..."`);
                speak(phrase);
                lastSpokenIndexRef.current += endIndex;
            }
        }
    }, [latestAssistantMessage, isVoiceEnabled, speak]);

    // Flush remaining text when streaming ends
    useEffect(() => {
        if (status !== 'streaming' && status !== 'submitted' && latestAssistantMessage && isVoiceEnabled) {
            const fullText = getMessageContent(latestAssistantMessage);
            if (fullText.length > lastSpokenIndexRef.current) {
                const remaining = fullText.slice(lastSpokenIndexRef.current).trim();
                if (remaining) {
                    console.log(`[TTS] Flush remaining: "${remaining.slice(0, 40)}..."`);
                    speak(remaining);
                    lastSpokenIndexRef.current = fullText.length;
                }
            }
        }
    }, [status, latestAssistantMessage, isVoiceEnabled, speak]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setInput(e.target.value); };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        // Reset TTS state for fresh turn (prevents progressive degradation)
        resetTTS();
        try { await sendMessage({ text: input }); setInput(''); } catch (error) { console.error("Start stream error:", error); }
    };

    const containerRef = useRef<HTMLDivElement>(null);
    const [isCompact, setIsCompact] = useState(false);
    const { updateWindowSize } = useDesktopActions();
    const { windows } = useDesktopState();
    const chatWindow = windows.find(w => w.id === 'chat-stream');



    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                const compact = width < 768;
                setIsCompact(compact);
                if (compact && chatWindow) {
                    const videoHeight = width * (9 / 16);
                    const minChatHeight = 350;
                    const requiredTotalHeight = videoHeight + minChatHeight + 60;
                    if (height < requiredTotalHeight) {
                        if (requiredTotalHeight - height > 10) {
                            updateWindowSize('chat-stream', { width: chatWindow.size.width, height: requiredTotalHeight });
                        }
                    }
                }
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, [chatWindow, updateWindowSize]);

    return (
        <div ref={containerRef} className="flex flex-col h-full w-full bg-mai-surface-dim text-mai-text overflow-hidden">
            <div className="bg-mai-surface px-4 py-2.5 flex items-center justify-between border-b-2 border-mai-border shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-pink-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 max-w-xl mx-4 bg-mai-surface-dim rounded-xl px-4 py-1.5 text-xs text-mai-subtext flex items-center gap-2 border-2 border-mai-border">
                        <span className="text-pink-500">♡</span>
                        <span className="text-mai-text font-medium">mai.stream/live</span>
                        <span className="ml-auto text-[10px] bg-gradient-to-r from-pink-400 to-rose-400 text-white px-2 py-0.5 rounded-xl">LIVE</span>
                    </div>
                </div>
            </div>
            <div className={`flex-1 flex overflow-hidden ${isCompact ? 'flex-col' : 'flex-row'}`}>
                <StreamFeed latestAssistantMessage={latestAssistantMessage} isCompact={isCompact} isVoiceEnabled={isVoiceEnabled} spokenText={spokenTranscript} />
                <ChatSidebar allMessages={messages} userMessages={userMessages} messageTimestamps={messageTimestamps} status={status} isLoading={isLoading} token={token} setToken={setToken} input={input} handleInputChange={handleInputChange} handleSubmit={handleSubmit} isCompact={isCompact} showAiReplies={showAiReplies} setShowAiReplies={setShowAiReplies} isVoiceEnabled={isVoiceEnabled} setIsVoiceEnabled={setIsVoiceEnabled} />
            </div>
        </div>
    );
};

"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Send, MoreHorizontal, Heart, RotateCw, Maximize2 } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { maiCharacter } from '@/data/characters';
import { Turnstile } from '@marsidev/react-turnstile';
import { useDesktopActions, useDesktopState } from '@/context/DesktopContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type MessagePart = { type: string; text?: string };
type ChatMessage = { id: string; role: string; content?: string; parts?: MessagePart[] };

const SubtitleWord = React.memo(({ word }: { word: string }) => (
    <span
        className="relative inline-block text-lg md:text-xl font-bold leading-relaxed px-[0.15em] -mx-[0.05em] animate-word-bounce"
        style={{
            fontFamily: 'var(--font-fredoka), var(--font-mplus), sans-serif',
        }}
    >
        {/* Back layer - gradient stroke */}
        <span
            aria-hidden="true"
            className="absolute inset-0 px-[0.15em]"
            style={{
                WebkitTextStroke: '6px #e879f9',
                color: 'transparent',
                left: 0,
                right: 0
            }}
        >
            {word}
        </span>
        {/* Front layer - white text with shadow */}
        <span
            className="relative text-white z-10"
            style={{ textShadow: '0.5px 0.5px 0px rgba(0, 0, 0, 0.5)' }}
        >
            {word}
        </span>
    </span>
));
SubtitleWord.displayName = 'SubtitleWord';

// Sub-component: Stream Feed (Handles High Frequency Typing Updates)
const StreamFeed = React.memo(({
    latestAssistantMessage,
    isCompact
}: {
    latestAssistantMessage: ChatMessage | undefined,
    isCompact: boolean
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [lastProcessedId, setLastProcessedId] = useState<string | null>(null);

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

    // Refs
    const fullTextRef = useRef(currentFullText);
    const displayedTextRef = useRef(displayedText);
    const isTypingRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync refs
    useEffect(() => { fullTextRef.current = currentFullText; }, [currentFullText]);
    useEffect(() => { displayedTextRef.current = displayedText; }, [displayedText]);

    // Sound Logic
    const playDialogueSound = (word: string) => {
        try {
            let min = 1;
            let max = 10;
            if (/[?!]/.test(word)) { min = 21; max = 30; }
            else if (/[.]/.test(word) || word.length > 8) { min = 11; max = 20; }
            else { min = 1; max = 10; }

            const fileIndex = Math.floor(Math.random() * (max - min + 1)) + min;
            const fileName = `bleep${String(fileIndex).padStart(3, '0')}.ogg`;

            const audio = new Audio(`/sounds/dialogue/${fileName}`);
            audio.volume = 0.7;
            audio.play().catch(() => { });
        } catch (_) { // eslint-disable-line @typescript-eslint/no-unused-vars
        }
    };

    // Typing Logic
    const advanceTyping = React.useCallback(() => {
        if (isTypingRef.current) return;

        const fullWords = fullTextRef.current.split(' ');
        const displayedWords = displayedTextRef.current ? displayedTextRef.current.split(' ') : [];

        if (displayedWords.length >= fullWords.length && displayedTextRef.current === fullTextRef.current) {
            isTypingRef.current = false;
            return;
        }

        isTypingRef.current = true;
        const nextWordIndex = displayedWords.length;
        const nextWord = fullWords[nextWordIndex] || '';
        const delay = 70 + (nextWord.length * 25);

        timeoutRef.current = setTimeout(() => {
            const nextWordCount = displayedWords.length + 1;
            const newText = fullWords.slice(0, nextWordCount).join(' ');
            setDisplayedText(newText);
            playDialogueSound(nextWord);
            isTypingRef.current = false;
        }, delay);
    }, []); // Empty dependencies as it uses Refs for all state

    // Watch for new messages
    useEffect(() => {
        if (!latestAssistantMessage) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            if (displayedText !== '') setDisplayedText('');
            return;
        }
        if (latestAssistantMessage.id !== lastProcessedId) {
            setDisplayedText('');
            setLastProcessedId(latestAssistantMessage.id);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            isTypingRef.current = false;
        }
    }, [latestAssistantMessage, lastProcessedId, displayedText]);

    // Typing Loops
    useEffect(() => { advanceTyping(); }, [displayedText, advanceTyping]);
    useEffect(() => { advanceTyping(); }, [currentFullText, advanceTyping]);
    useEffect(() => { return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }; }, []);

    const pagedSubtitle = getPagedSubtitle(displayedText);
    const words = React.useMemo(() => pagedSubtitle ? pagedSubtitle.split(' ') : [], [pagedSubtitle]);

    return (
        <div className={`
            relative bg-mai-surface-dim flex flex-col justify-center items-center overflow-hidden group aspect-video rounded-xl border-2 border-mai-border
            ${isCompact ? 'shrink-0 mx-3 mt-3' : 'flex-1 min-w-0 max-h-full m-3'}
        `}>
            {/* Overlay UI - Cute Live Badge */}
            <div className="absolute top-3 left-3 bg-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 flex items-center gap-1.5">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
            </div>
            <div className="absolute top-3 right-3 bg-mai-surface text-mai-text text-xs font-medium px-3 py-1.5 rounded-full z-10 flex items-center gap-1.5 border-2 border-mai-border">
                <span className="text-pink-500">♡</span> 1.2k watching
            </div>

            {/* Video Content */}
            <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative w-full h-full">
                    <Image
                        src="/assets/streamsimple.png"
                        alt="Mai Live"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
            </div>

            {/* Hover Controls - Soft style */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-mai-surface/95 opacity-0 group-hover:opacity-100 transition-opacity flex items-center px-4 gap-4 rounded-b-xl">
                <Button variant="ghost" size="icon" className="text-mai-text hover:text-mai-primary hover:bg-transparent"><Maximize2 size={18} /></Button>
                <div className="flex-1 h-1.5 bg-mai-surface-dim rounded-full overflow-hidden">
                    <div className="w-full h-full bg-pink-400 rounded-full" />
                </div>
            </div>

            {/* Subtitles - Gradient stroke style with bounce */}
            {words.length > 0 && (
                <div className="absolute bottom-12 md:bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[90%] md:max-w-[70%] z-20 flex flex-wrap justify-center gap-x-1.5 gap-y-1">
                    {words.map((word, i) => (
                        <SubtitleWord key={`${i}-${word}`} word={word} />
                    ))}
                </div>
            )}
        </div>
    );
});

StreamFeed.displayName = 'StreamFeed';

// Sub-component: Chat Sidebar (Static during typing)
const ChatSidebar = React.memo(({
    userMessages,
    status,
    isLoading,
    token,
    setToken,
    input,
    handleInputChange,
    handleSubmit,
    isCompact
}: {
    userMessages: ChatMessage[],
    status: string,
    isLoading: boolean,
    token: string | null,
    setToken: (t: string | null) => void,
    input: string,
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    handleSubmit: (e: React.FormEvent) => void,
    isCompact: boolean
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Helper for pure text extraction
    const getMessageContent = (msg?: ChatMessage) => {
        if (!msg) return '';
        if (msg.content) return msg.content;
        if (msg.parts) {
            return msg.parts.filter((p: MessagePart) => p.type === 'text').map((p: MessagePart) => p.text).join('');
        }
        return '';
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [userMessages.length]);

    return (
        <div className={`
            bg-mai-surface flex flex-col overflow-hidden border-2 border-mai-border rounded-xl
            ${isCompact
                ? 'flex-1 min-h-0 mx-3 mb-3'
                : 'w-[300px] flex-none min-h-0 my-3 mr-3'
            }
        `}>
            {/* Header */}
            <div className="p-3 border-b-2 border-mai-border flex justify-between items-center shrink-0">
                <span className="text-mai-text font-semibold flex items-center gap-2">
                    💬 Chat
                </span>
                <MoreHorizontal size={16} className="text-mai-subtext" />
            </div>

            {/* Mobile: Input at top (below video), Desktop: Input at bottom */}
            {isCompact && (
                <div className="px-3 py-2 border-b-2 border-mai-border bg-mai-surface shrink-0">
                    <form onSubmit={handleSubmit} className="flex gap-2 min-w-0">
                        <Input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            placeholder={token ? "Say something cute~" : "Verifying..."}
                            className="flex-1 min-w-0 bg-mai-surface-dim text-mai-text rounded-full px-4 py-2.5 text-sm focus-visible:ring-mai-primary border-2 border-mai-border disabled:opacity-50 placeholder:text-mai-subtext transition-all h-auto"
                            disabled={!token}
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !input.trim() || !token}
                            variant="default"
                            size="icon"
                            className="bg-pink-400 hover:bg-pink-500 text-white rounded-full shrink-0"
                        >
                            <Send size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" type="button" className="text-mai-subtext hover:text-pink-500 hover:bg-transparent shrink-0">
                            <Heart size={18} />
                        </Button>
                    </form>
                    {/* Turnstile - Mobile */}
                    {!token && (
                        <div className="flex justify-center pt-2">
                            <Turnstile
                                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                                onSuccess={setToken}
                                onError={() => setToken(null)}
                                onExpire={() => setToken(null)}
                                options={{ theme: 'light', size: 'flexible' }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Messages - scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* System welcome */}
                <div className="flex gap-2 items-start opacity-80">
                    <div className="w-6 h-6 rounded-full bg-pink-400 flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">✦</div>
                    <div className="flex-1 min-w-0">
                        <span className="text-mai-primary text-xs font-semibold mr-2">System</span>
                        <span className="text-mai-subtext text-sm">Welcome! Say hello to Mai~ ♡</span>
                    </div>
                </div>

                {userMessages.map((msg: ChatMessage, index: number) => (
                    <div key={msg.id} className="flex gap-2 items-start">
                        <div className="w-6 h-6 rounded-full bg-blue-400 flex-shrink-0 flex items-center justify-center text-[9px] text-white font-bold">You</div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-mai-secondary text-xs font-semibold">You</span>
                                {status === 'submitted' && index === userMessages.length - 1 && (
                                    <RotateCw size={12} className="text-mai-subtext animate-spin" />
                                )}
                            </div>
                            <span className={`text-sm break-words leading-relaxed ${isLoading && index === userMessages.length - 1 ? 'text-mai-subtext' : 'text-mai-text'}`}>
                                {getMessageContent(msg)}
                            </span>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-2 items-start opacity-50">
                        {/* Placeholder or spinner if desired */}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Desktop: Input at bottom */}
            {!isCompact && (
                <div className="px-3 pt-2 border-t-2 border-mai-border bg-mai-surface relative"
                    style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
                >
                    <form onSubmit={handleSubmit} className="flex gap-2 min-w-0">
                        <Input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            placeholder={token ? "Say something cute~" : "Verifying..."}
                            className="flex-1 min-w-0 bg-mai-surface-dim text-mai-text rounded-full px-4 py-2.5 text-sm focus-visible:ring-mai-primary border-2 border-mai-border disabled:opacity-50 placeholder:text-mai-subtext transition-all h-auto"
                            disabled={!token}
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !input.trim() || !token}
                            variant="default"
                            size="icon"
                            className="bg-pink-400 hover:bg-pink-500 text-white rounded-full shrink-0"
                        >
                            <Send size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" type="button" className="text-mai-subtext hover:text-pink-500 hover:bg-transparent shrink-0">
                            <Heart size={18} />
                        </Button>
                    </form>
                    {/* Turnstile - Desktop */}
                    {!token && (
                        <div className="absolute bottom-full left-0 right-0 flex justify-center pb-2 pointer-events-auto">
                            <Turnstile
                                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                                onSuccess={setToken}
                                onError={() => setToken(null)}
                                onExpire={() => setToken(null)}
                                options={{ theme: 'light', size: 'flexible' }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );

});

ChatSidebar.displayName = 'ChatSidebar';

export const ChatStreamApp = () => {
    const [input, setInput] = useState('');
    const [token, setToken] = useState<string | null>(null);
    const tokenRef = useRef<string | null>(null);

    useEffect(() => { tokenRef.current = token; }, [token]);
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log("Dev mode: Bypassing Turnstile");
            setToken('dev-bypass');
        }
    }, []);

    // eslint-disable-next-line react-hooks/refs
    const transport = React.useMemo(() => new TextStreamChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest: async ({ messages: msgs, ...rest }) => {
            const currentToken = tokenRef.current;
            console.log("Sending message with token:", currentToken ? currentToken.slice(0, 10) + "..." : "null");
            const transformedMessages = msgs.map((msg: ChatMessage) => {
                let content = msg.content;
                if (!content && msg.parts) {
                    content = msg.parts.filter((p: MessagePart) => p.type === 'text').map((p: MessagePart) => p.text).join('');
                }
                return { role: msg.role, content: content || '' };
            });
            return { ...rest, body: { messages: transformedMessages, token: currentToken } };
        }
    }), []); // Dependencies intentionally empty, we read tokenRef late

    const { messages, sendMessage, status } = useChat({
        transport,
        initialMessages: [{ id: 'welcome', role: 'assistant', content: maiCharacter.greeting }],
        onError: (err: Error) => {
            if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized')) {
                setToken(null);
            }
        }
    } as Parameters<typeof useChat>[0]);

    const isLoading = status === 'streaming' || status === 'submitted';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setInput(e.target.value); };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        try { await sendMessage({ text: input }); setInput(''); } catch (error) { console.error("Start stream error:", error); }
    };

    const userMessages = messages.filter((m: ChatMessage) => m.role === 'user');
    const latestAssistantMessage = [...messages].reverse().find((m: ChatMessage) => m.role === 'assistant');

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
            {/* Header - Cute browser-like */}
            <div className="bg-mai-surface px-4 py-2.5 flex items-center justify-between border-b-2 border-mai-border shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    {/* Decorative dots */}
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-pink-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    {/* URL bar */}
                    <div className="flex-1 max-w-xl mx-4 bg-mai-surface-dim rounded-xl px-4 py-1.5 text-xs text-mai-subtext flex items-center gap-2 border-2 border-mai-border">
                        <span className="text-pink-500">♡</span>
                        <span className="text-mai-text font-medium">mai.stream/live</span>
                        <span className="ml-auto text-[10px] bg-gradient-to-r from-pink-400 to-rose-400 text-white px-2 py-0.5 rounded-xl">LIVE</span>
                    </div>
                </div>
            </div>

            {/* Content Split */}
            <div className={`flex-1 flex overflow-hidden ${isCompact ? 'flex-col' : 'flex-row'}`}>
                <StreamFeed
                    latestAssistantMessage={latestAssistantMessage}
                    isCompact={isCompact}
                />

                <ChatSidebar
                    userMessages={userMessages}
                    status={status}
                    isLoading={isLoading}
                    token={token}
                    setToken={setToken}
                    input={input}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    isCompact={isCompact}
                />
            </div>
        </div>
    );
};

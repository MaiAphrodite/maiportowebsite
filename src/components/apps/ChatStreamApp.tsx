"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Send, MoreHorizontal, Heart, RotateCw, Maximize2 } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { maiCharacter } from '@/data/characters';
import { Turnstile } from '@marsidev/react-turnstile';
import { useDesktopActions, useDesktopState } from '@/context/DesktopContext';

type MessagePart = { type: string; text?: string };
type ChatMessage = { id: string; role: string; content?: string; parts?: MessagePart[] };

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

    return (
        <div className={`
            relative bg-black flex flex-col justify-center items-center overflow-hidden group aspect-video
            ${isCompact ? 'w-full shrink-0' : 'flex-1 min-w-0 max-h-full'}
        `}>
            {/* Overlay UI */}
            <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md z-10 flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
            </div>
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded-md z-10 flex items-center gap-1">
                <span className="text-red-500">●</span> 1.2k watching
            </div>

            {/* Video Content */}
            <div className="relative w-full h-full flex items-center justify-center bg-black">
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

            {/* Hover Controls */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center px-4 gap-4">
                <button className="text-white"><Maximize2 size={18} /></button>
                <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-red-600" />
                </div>
            </div>

            {/* Subtitles */}
            {pagedSubtitle && (
                <div className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[90%] md:max-w-[70%] z-20 flex justify-center">
                    <span
                        className="
                            inline-block
                            bg-black/60 backdrop-blur-sm text-yellow-300 px-4 py-2 rounded-lg 
                            text-lg md:text-xl font-medium shadow-lg leading-relaxed border border-white/10
                            text-center min-h-[3.5rem] flex items-center justify-center transition-all duration-300
                        "
                        style={{ fontFamily: 'var(--font-fredoka), sans-serif' }}
                    >
                        {pagedSubtitle}
                    </span>
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
            bg-[#181818] border-gray-700 flex flex-col overflow-hidden
            ${isCompact
                ? 'flex-1 w-full border-t min-h-0'
                : 'w-[350px] flex-none border-l min-h-0'
            }
        `}>
            <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-[#181818]">
                <span className="text-white font-medium">Top Chat</span>
                <MoreHorizontal size={16} className="text-gray-400" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <div className="flex gap-2 items-start opacity-70">
                    <div className="w-6 h-6 rounded-full bg-mai-primary flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">SYS</div>
                    <div className="flex-1 min-w-0">
                        <span className="text-gray-400 text-xs font-semibold mr-2">System</span>
                        <span className="text-gray-300 text-sm">Welcome to the stream! say hello to Mai!</span>
                    </div>
                </div>

                {userMessages.map((msg: ChatMessage, index: number) => (
                    <div key={msg.id} className="flex gap-2 items-start animate-in slide-in-from-left-2 duration-300">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">YOU</div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs font-semibold">You</span>
                                {status === 'submitted' && index === userMessages.length - 1 && (
                                    <RotateCw size={12} className="text-gray-500 animate-spin" />
                                )}
                            </div>
                            <span className={`text-sm break-words leading-tight ${isLoading && index === userMessages.length - 1 ? 'text-gray-400' : 'text-white'}`}>
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

            {/* Chat Input */}
            <div className="px-6 pb-6 pt-3 bg-[#181818] border-t border-gray-700 relative">
                <form onSubmit={handleSubmit} className="flex gap-2 min-w-0">
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder={token ? "Say something..." : "Verifying..."}
                        className="flex-1 min-w-0 bg-[#0f0f0f] text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-mai-primary border border-gray-700 disabled:opacity-50"
                        disabled={!token}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim() || !token}
                        className="p-2 bg-mai-primary text-white rounded-full hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send size={16} />
                    </button>
                    <div className="flex items-center gap-1 text-gray-400">
                        <Heart size={20} className="hover:text-red-500 cursor-pointer transition-colors" />
                    </div>
                </form>
                {/* Turnstile (Visible for interaction if needed) */}
                {!token && (
                    <div className="absolute bottom-full left-0 right-0 flex justify-center pb-2 pointer-events-auto">
                        <Turnstile
                            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                            onSuccess={setToken}
                            onError={() => setToken(null)}
                            onExpire={() => setToken(null)}
                            options={{ theme: 'dark', size: 'flexible' }}
                        />
                    </div>
                )}
            </div>
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
    const { windows } = useDesktopState(); // We need state here to check if we are the chat window, but we are inside the chat window component, so it's unavoidable.
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
        <div ref={containerRef} className="flex flex-col h-full w-full bg-[#0f0f0f] text-white overflow-hidden">
            {/* Header */}
            <div className="bg-[#202020] px-4 py-2 flex items-center justify-between border-b border-gray-700 shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex gap-1.5 opacity-50">
                        <div className="w-3 h-3 rounded-full bg-gray-600" />
                        <div className="w-3 h-3 rounded-full bg-gray-600" />
                        <div className="w-3 h-3 rounded-full bg-gray-600" />
                    </div>
                    <div className="flex-1 max-w-xl mx-4 bg-[#121212] rounded-full px-4 py-1.5 text-xs text-gray-400 flex items-center gap-2 border border-gray-700/50">
                        <span className="text-gray-500">🔒</span>
                        <span className="text-white">mai.stream/live</span>
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

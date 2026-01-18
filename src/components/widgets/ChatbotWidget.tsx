"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Send, MessageCircle, Maximize2, Minimize2, MoreHorizontal, ThumbsUp, Share2, Heart, RotateCw } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { maiCharacter } from '@/data/characters';
import { useMobile } from '@/hooks/useMobile';
import { Turnstile } from '@marsidev/react-turnstile';

type MessagePart = { type: string; text?: string };
type ChatMessage = { id: string; role: string; content?: string; parts?: MessagePart[] };

export const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isMobile = useMobile();

    const [input, setInput] = useState('');
    const [token, setToken] = useState<string | null>(null);
    const tokenRef = useRef<string | null>(null);

    // Update ref when state changes
    useEffect(() => {
        tokenRef.current = token;
    }, [token]);

    // Auto-bypass in development
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log("Dev mode: Bypassing Turnstile");
            setToken('dev-bypass');
        }
    }, []);

    const { messages, sendMessage, status } = useChat({
        transport: new TextStreamChatTransport({
            api: '/api/chat',
            prepareSendMessagesRequest: async ({ messages: msgs, ...rest }) => {
                const currentToken = tokenRef.current;

                // Transform messages logic...
                const transformedMessages = msgs.map((msg: ChatMessage) => {
                    let content = msg.content;
                    if (!content && msg.parts) {
                        content = msg.parts
                            .filter((p: MessagePart) => p.type === 'text')
                            .map((p: MessagePart) => p.text)
                            .join('');
                    }
                    return {
                        role: msg.role,
                        content: content || '',
                    };
                });
                return {
                    ...rest,
                    body: {
                        messages: transformedMessages,
                        token: currentToken
                    }
                };
            }
        }),
        initialMessages: [
            {
                id: 'welcome',
                role: 'assistant',
                content: maiCharacter.greeting
            }
        ],
        onFinish: () => {
            // Stream complete
        },
        onError: (err: Error) => {
            if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized')) {
                setToken(null);
            }
        }
    } as Parameters<typeof useChat>[0]);

    const isLoading = status === 'streaming' || status === 'submitted';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        try {
            await sendMessage({ text: input });
            setInput('');
        } catch (error) {
            console.error("Start stream error:", error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    // Filter messages for the sidebar (User only)
    const userMessages = messages.filter((m: ChatMessage) => m.role === 'user');

    // Get the latest assistant message for the subtitle
    // We look for the last message where role is assistant
    const latestAssistantMessage = [...messages].reverse().find((m: ChatMessage) => m.role === 'assistant');
    const [displayedText, setDisplayedText] = useState('');
    const [lastProcessedId, setLastProcessedId] = useState<string | null>(null);

    // Extract text content safely
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
        const pageSize = 20; // 20 words is roughly 2 lines of text

        // Calculate the starting index of the current page
        // as the text grows, this index jumps: 0, 20, 40...
        const pageIndex = Math.floor((words.length - 1) / pageSize);
        const startIndex = pageIndex * pageSize;

        // We display from the start of the current page up to the current last word
        // This means it fills up word by word, then clears and starts filling the next page
        const currentWords = words.slice(startIndex, startIndex + pageSize);

        return currentWords.join(' ');
    };

    const currentFullText = getMessageContent(latestAssistantMessage);

    // Typewriter effect: Slowly reveal text WORD BY WORD
    useEffect(() => {
        if (!latestAssistantMessage) {
            setDisplayedText('');
            return;
        }

        // Processing a new message? Reset.
        if (latestAssistantMessage.id !== lastProcessedId) {
            setDisplayedText('');
            setLastProcessedId(latestAssistantMessage.id);
            return;
        }

        const fullWords = currentFullText.split(' ');
        const displayedWords = displayedText ? displayedText.split(' ') : [];

        // If we are caught up, do nothing
        if (displayedWords.length >= fullWords.length && displayedText === currentFullText) {
            return;
        }

        // Determine the next word to show to calculate delay
        const nextWordIndex = displayedWords.length;
        const nextWord = fullWords[nextWordIndex] || '';

        // Calculate delay based on word complexity
        // Base delay (100ms) + (30ms per character)
        // Short word "a" (1) = 130ms
        // Long word "complexity" (10) = 400ms
        const delay = 100 + (nextWord.length * 30);

        const timeoutId = setTimeout(() => {
            const nextWordCount = displayedWords.length + 1;
            setDisplayedText(fullWords.slice(0, nextWordCount).join(' '));
        }, delay);

        return () => clearTimeout(timeoutId);
    }, [currentFullText, displayedText, latestAssistantMessage, lastProcessedId]);

    const pagedSubtitle = getPagedSubtitle(displayedText);

    return (
        <div className={`
            ${isMobile
                ? 'fixed bottom-2 right-2 z-[9000] flex flex-col items-end'
                : 'absolute bottom-4 right-4 z-[9000] flex flex-col items-end'
            }
        `}>

            {/* Stream Window */}
            {isOpen && (
                <div
                    className={`
                        bg-[#0f0f0f] border border-gray-700 shadow-2xl flex flex-col overflow-hidden mb-2 transition-all
                        ${isMobile
                            ? 'fixed inset-0 z-[9001]' // Fullscreen on mobile
                            : 'w-[900px] h-[600px] rounded-xl'
                        }
                    `}
                >
                    {/* Browser Chrome / Header */}
                    <div className="bg-[#202020] px-4 py-2 flex items-center justify-between border-b border-gray-700 shrink-0">
                        {/* Fake Tabs/URL */}
                        <div className="flex items-center gap-4 flex-1">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer" onClick={() => setIsOpen(false)} />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>

                            <div className="flex-1 max-w-xl mx-4 bg-[#121212] rounded-full px-4 py-1.5 text-xs text-gray-400 flex items-center gap-2 border border-gray-700/50">
                                <span className="text-gray-500">🔒</span>
                                <span className="text-white">mai.stream/live</span>
                            </div>
                        </div>

                        {!isMobile && (
                            <div className="text-gray-400">
                                <MoreHorizontal size={20} />
                            </div>
                        )}

                        {isMobile && (
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 p-1">
                                <X size={24} />
                            </button>
                        )}
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

                        {/* LEFT: Stream Feed */}
                        <div className="flex-[3] relative bg-black flex flex-col justify-center items-center overflow-hidden group">
                            {/* "Live" Badge */}
                            <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md z-10 flex items-center gap-1">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                LIVE
                            </div>

                            {/* Viewer Count Mockup */}
                            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded-md z-10 flex items-center gap-1">
                                <span className="text-red-500">●</span> 1.2k watching
                            </div>

                            {/* Character (The Stream) */}
                            <div className="relative w-full h-full max-w-2xl max-h-[80%] aspect-video md:aspect-auto">
                                <Image
                                    src="/assets/ai-character.png"
                                    alt="Mai Live"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>

                            {/* Video Controls Overlay (Visual only) */}
                            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center px-4 gap-4">
                                <button className="text-white"><Maximize2 size={18} /></button>
                                <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                                    <div className="w-full h-full bg-red-600" />
                                </div>
                            </div>

                            {/* Subtitles - The Main AI Interaction */}
                            {pagedSubtitle && (
                                <div className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[90%] md:max-w-[70%] z-20 flex justify-center">
                                    <span className="
                                        inline-block
                                        bg-black/60 backdrop-blur-sm text-yellow-300 px-4 py-2 rounded-lg 
                                        text-lg md:text-xl font-medium shadow-lg leading-relaxed border border-white/10
                                        text-center min-h-[3.5rem] flex items-center justify-center transition-all duration-300
                                    ">
                                        {pagedSubtitle}
                                    </span>
                                </div>
                            )}

                            {/* Loading/Thinking Indicator for AI */}



                        </div>

                        {/* RIGHT: Live Chat */}
                        <div className="flex-1 min-w-[300px] md:max-w-[350px] bg-[#181818] border-l border-gray-700 flex flex-col h-[40%] md:h-auto">
                            {/* Chat Header */}
                            <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-[#181818]">
                                <span className="text-white font-medium">Top Chat</span>
                                <MoreHorizontal size={16} className="text-gray-400" />
                            </div>

                            {/* Chat Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">

                                {/* Welcome Message Mockup */}
                                <div className="flex gap-2 items-start opacity-70">
                                    <div className="w-6 h-6 rounded-full bg-mai-primary flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">
                                        SYS
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-gray-400 text-xs font-semibold mr-2">System</span>
                                        <span className="text-gray-300 text-sm">Welcome to the stream! say hello to Mai!</span>
                                    </div>
                                </div>

                                {userMessages.map((msg: ChatMessage, index: number) => (
                                    <div key={msg.id} className="flex gap-2 items-start animate-in slide-in-from-left-2 duration-300">
                                        {/* Simple User Avatar Generation */}
                                        <div className="w-6 h-6 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">
                                            YOU
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400 text-xs font-semibold">You</span>
                                                {/* Show spinner on the latest message if loading */}
                                                {isLoading && index === userMessages.length - 1 && (
                                                    <RotateCw size={12} className="text-gray-500 animate-spin" />
                                                )}
                                            </div>
                                            <span className={`text-sm break-words leading-tight ${isLoading && index === userMessages.length - 1 ? 'text-gray-400' : 'text-white'}`}>
                                                {getMessageContent(msg)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="p-3 border-t border-gray-700 bg-[#181818] relative">
                                {!token && (
                                    <div className="absolute -top-12 left-0 right-0 flex justify-center p-2 bg-gradient-to-t from-[#181818] to-transparent">
                                        <Turnstile
                                            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                                            onSuccess={(token) => setToken(token)}
                                            options={{ theme: 'dark', size: 'compact' }}
                                        />
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                value={input || ''}
                                                onChange={handleInputChange}
                                                placeholder={token ? "Say something..." : "Verify to chat..."}
                                                disabled={isLoading || !token}
                                                className="w-full bg-[#2a2a2a] text-white px-4 py-2 rounded-full text-sm border-none focus:ring-1 focus:ring-mai-primary outline-none placeholder:text-gray-500 disabled:opacity-50"
                                                maxLength={200}
                                            />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 flex gap-1">
                                                <div className="p-1 hover:bg-white/10 rounded-full cursor-pointer"><ThumbsUp size={14} /></div>
                                                <div className="p-1 hover:bg-white/10 rounded-full cursor-pointer"><Heart size={14} /></div>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isLoading || !(input || '').trim() || !token}
                                            className="p-2 bg-mai-primary text-white rounded-full hover:brightness-110 disabled:opacity-50 disabled:grayscale transition-all"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-gray-500 px-1">
                                        <span>Slow mode is on</span>
                                        <span>0/200</span>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mascot / Desktop Icon */}
            {/* The entry point remains the same, but maybe slightly adjusted for the theme if needed, 
                for now keeping the original mascot behavior as it was good. */}
            <div className="relative group cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className={`
                    relative transition-transform duration-300 group-hover:scale-110
                    ${isMobile ? 'w-20 h-20' : 'w-32 h-32'}
                    ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'} 
                `}>
                    <Image
                        src="/assets/ai-character.png"
                        alt="Mai Mascot"
                        fill
                        className="object-contain drop-shadow-lg"
                        priority
                    />
                </div>

                {!isOpen && (
                    <div
                        className={`
                            absolute bg-mai-primary text-white rounded-full shadow-sm animate-bounce
                            ${isMobile ? '-top-1 -right-1 p-0.5' : '-top-2 -right-2 p-1'}
                        `}
                    >
                        <MessageCircle size={isMobile ? 14 : 20} />
                    </div>
                )}
            </div>
        </div>
    );
};


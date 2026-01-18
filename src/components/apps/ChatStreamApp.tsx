"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Send, MoreHorizontal, ThumbsUp, Heart, RotateCw, Maximize2 } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { maiCharacter } from '@/data/characters';
import { Turnstile } from '@marsidev/react-turnstile';
import { useDesktop } from '@/context/DesktopContext';

type MessagePart = { type: string; text?: string };
type ChatMessage = { id: string; role: string; content?: string; parts?: MessagePart[] };

export const ChatStreamApp = () => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
        scrollToBottom();
    }, [messages]);

    // Filter messages for the sidebar (User only)
    const userMessages = messages.filter((m: ChatMessage) => m.role === 'user');

    // Get the latest assistant message for the subtitle
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
        const pageSize = 20;

        const pageIndex = Math.floor((words.length - 1) / pageSize);
        const startIndex = pageIndex * pageSize;

        const currentWords = words.slice(startIndex, startIndex + pageSize);

        return currentWords.join(' ');
    };

    const currentFullText = getMessageContent(latestAssistantMessage);

    // Refs to track state avoiding closure staleness in timeouts
    const fullTextRef = useRef(currentFullText);
    const displayedTextRef = useRef(displayedText);
    const isTypingRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync refs
    useEffect(() => {
        fullTextRef.current = currentFullText;
    }, [currentFullText]);

    useEffect(() => {
        displayedTextRef.current = displayedText;
    }, [displayedText]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // Main typing logic
    const advanceTyping = () => {
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

        // Calculate delay
        // Base delay (70ms) + (25ms per character)
        const delay = 70 + (nextWord.length * 25);

        timeoutRef.current = setTimeout(() => {
            const nextWordCount = displayedWords.length + 1;
            const newText = fullWords.slice(0, nextWordCount).join(' ');

            setDisplayedText(newText);

            // Play sound effect
            playDialogueSound(nextWord);

            isTypingRef.current = false;
        }, delay);
    };

    // Watch for resets (new message)
    useEffect(() => {
        if (!latestAssistantMessage) {
            setDisplayedText('');
            return;
        }
        if (latestAssistantMessage.id !== lastProcessedId) {
            setDisplayedText('');
            setLastProcessedId(latestAssistantMessage.id);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            isTypingRef.current = false;
        }
    }, [latestAssistantMessage, lastProcessedId]);

    // Trigger typing when displayed text updates (continue loop)
    useEffect(() => {
        advanceTyping();
    }, [displayedText]);

    useEffect(() => {
        advanceTyping();
    }, [currentFullText]);

    const playDialogueSound = (word: string) => {
        try {
            let min = 1;
            let max = 10;

            if (/[?!]/.test(word)) {
                min = 21;
                max = 30;
            } else if (/[.]/.test(word) || word.length > 8) {
                min = 11;
                max = 20;
            } else {
                min = 1;
                max = 10;
            }

            const fileIndex = Math.floor(Math.random() * (max - min + 1)) + min;
            const fileName = `bleep${String(fileIndex).padStart(3, '0')}.ogg`;

            const audio = new Audio(`/sounds/dialogue/${fileName}`);
            audio.volume = 0.7;
            audio.play().catch(() => { });
        } catch (e) {
        }
    };

    const containerRef = useRef<HTMLDivElement>(null);
    const [isCompact, setIsCompact] = useState(false);
    const { updateWindowSize, windows } = useDesktop(); // Get access to window controls
    const chatWindow = windows.find(w => w.id === 'chat-stream');

    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                const compact = width < 768;
                setIsCompact(compact);

                // Auto-Resize Logic:
                // If we are in compact mode (stacked), and the height is too short to show chat, grow it.
                if (compact && chatWindow) {
                    // Calculate video height (16:9)
                    const videoHeight = width * (9 / 16);
                    const minChatHeight = 350; // Needs at least this for chat
                    const requiredTotalHeight = videoHeight + minChatHeight + 60; // +60 for header/margins

                    if (height < requiredTotalHeight) {
                        // We need to grow
                        // Debounce/Check to avoid loops? 
                        // It's safe because we only grow height based on width.
                        // But let's check difference to avoid micro-adjustments
                        if (requiredTotalHeight - height > 10) {
                            updateWindowSize('chat-stream', { width: chatWindow.size.width, height: requiredTotalHeight });
                        }
                    }
                }
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [chatWindow, updateWindowSize]);

    const pagedSubtitle = getPagedSubtitle(displayedText);

    return (
        <div ref={containerRef} className="flex flex-col h-full w-full bg-[#0f0f0f] text-white overflow-hidden">
            {/* Browser Chrome / Header */}
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

            {/* Main Content Area */}
            <div className={`flex-1 flex overflow-hidden ${isCompact ? 'flex-col' : 'flex-row'}`}>
                {/* Stream Feed */}
                <div className={`
                    relative bg-black flex flex-col justify-center items-center overflow-hidden group
                    ${isCompact ? 'w-full aspect-video shrink-0' : 'flex-[3] min-w-[320px] h-full'}
                `}>
                    <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md z-10 flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        LIVE
                    </div>

                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded-md z-10 flex items-center gap-1">
                        <span className="text-red-500">●</span> 1.2k watching
                    </div>

                    {/* Character (The Stream) - Standard Video Player Scaling */}
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                        <div className="relative w-full h-full">
                            <Image
                                src="/assets/ai-character.png"
                                alt="Mai Live"
                                fill
                                className="object-contain" // Ensures 16:9 image fits within bounds without cropping
                                priority
                            />
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center px-4 gap-4">
                        <button className="text-white"><Maximize2 size={18} /></button>
                        <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                            <div className="w-full h-full bg-red-600" />
                        </div>
                    </div>

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
                </div>

                {/* Live Chat */}
                <div className={`
                    bg-[#181818] border-gray-700 flex flex-col 
                    ${isCompact
                        ? 'flex-1 w-full border-t min-h-0'
                        : 'flex-1 min-w-[300px] md:max-w-[350px] h-full border-l'
                    }
                `}>
                    <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-[#181818]">
                        <span className="text-white font-medium">Top Chat</span>
                        <MoreHorizontal size={16} className="text-gray-400" />
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
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
                                <div className="w-6 h-6 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">
                                    YOU
                                </div>
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
                        <div ref={messagesEndRef} />
                    </div>

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
    );
};

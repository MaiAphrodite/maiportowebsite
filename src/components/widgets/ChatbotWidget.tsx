"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Send, MessageCircle } from 'lucide-react';
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

    // Auto-bypass in development to avoid "broken" chatbox if testing locally
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
                // Transform messages: extract content from parts for API compatibility
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
                        token: token // Pass Turnstile token
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
            console.error("Chat error:", err.message);
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

    return (
        <div className={`
            ${isMobile
                ? 'fixed bottom-2 right-2 z-[9000] flex flex-col items-end'
                : 'absolute bottom-4 right-4 z-[9000] flex flex-col items-end'
            }
        `}>

            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`
                        bg-mai-surface backdrop-blur-md border-4 border-mai-primary shadow-xl 
                        flex flex-col overflow-hidden mb-2 transition-all
                        ${isMobile
                            ? 'fixed inset-4 top-16 rounded-2xl w-auto h-auto'
                            : 'w-80 h-96 rounded-2xl'
                        }
                    `}
                    style={isMobile ? {} : { width: '320px', height: '384px' }}
                >
                    {/* Header */}
                    <div className="bg-mai-primary p-3 flex justify-between items-center text-white">
                        <span className="font-bold text-sm md:text-base">Chat with {maiCharacter.name}</span>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded p-1"><X size={16} /></button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-auto p-3 md:p-4 flex flex-col gap-3">
                        {messages.map((msg: ChatMessage) => {
                            // Extract text from parts safely, fallback to content
                            let textContent = '';
                            if (msg.parts) {
                                textContent = msg.parts.filter((p: MessagePart) => p.type === 'text').map((p: MessagePart) => p.text).join('');
                            }
                            if (!textContent && msg.content) {
                                textContent = msg.content;
                            }

                            if (!textContent) return null;

                            return (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`
                                        p-2 rounded-lg max-w-[85%] text-sm whitespace-pre-wrap
                                        ${msg.role === 'user'
                                            ? 'bg-mai-primary text-white rounded-br-none'
                                            : 'bg-mai-surface-dim text-mai-text border border-mai-border/20 rounded-tl-none'}
                                    `}>
                                        {textContent}
                                    </div>
                                </div>
                            );
                        })}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-mai-surface-dim text-mai-text border border-mai-border/20 rounded-lg rounded-tl-none p-2 text-sm italic opacity-70">
                                    {maiCharacter.name} is typing...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-2 md:p-3 bg-mai-surface-dim border-t border-mai-border/20">
                        {!token ? (
                            <div className="flex justify-center py-2 min-h-[50px] items-center">
                                <Turnstile
                                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                                    onSuccess={(token) => setToken(token)}
                                    options={{ theme: 'light', size: 'flexible' }}
                                />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex gap-2">
                                <input
                                    value={input || ''}
                                    onChange={handleInputChange}
                                    placeholder="Type a message..."
                                    disabled={isLoading}
                                    className="w-full px-3 py-2 rounded-full border border-mai-border/30 bg-mai-surface text-mai-text text-sm focus:outline-none focus:border-mai-primary disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !(input || '').trim()}
                                    className="p-2 bg-mai-primary text-white rounded-full hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Mascot / Toggle Button */}
            <div className="relative group cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className={`
                    relative transition-transform group-hover:scale-105 group-hover:-translate-y-2
                    ${isMobile ? 'w-20 h-20' : 'w-32 h-32'}
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

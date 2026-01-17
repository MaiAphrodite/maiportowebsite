"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Send, MessageCircle } from 'lucide-react';

export const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
        { role: 'bot', text: "Hi! I'm Mai. How can I help you today? ^_^" }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([...messages, { role: 'user', text: input }]);
        setInput('');

        // Mock response
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'bot', text: "That's interesting! Tell me more! (I'm a demo bot for now hehe)" }]);
        }, 1000);
    };

    return (
        <div className="absolute bottom-4 right-4 z-[9000] flex flex-col items-end">

            {/* Chat Window */}
            {isOpen && (
                <div
                    className="w-80 h-96 bg-mai-surface backdrop-blur-md rounded-2xl border-4 border-mai-primary shadow-xl flex flex-col overflow-hidden mb-2 transition-all"
                    style={{ width: '320px', height: '384px' }}
                >
                    {/* Header */}
                    <div className="bg-mai-primary p-3 flex justify-between items-center text-white">
                        <span className="font-bold">Chat with Mai</span>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded p-1"><X size={16} /></button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`
                                    p-2 rounded-lg max-w-[85%] text-sm
                                    ${msg.role === 'user'
                                        ? 'bg-mai-primary text-white rounded-br-none'
                                        : 'bg-mai-surface-dim text-mai-text border border-mai-border/20 rounded-tl-none'}
                                `}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-mai-surface-dim border-t border-mai-border/20 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            className="w-full px-3 py-2 rounded-full border border-mai-border/30 bg-mai-surface text-mai-text text-sm focus:outline-none focus:border-mai-primary"
                        />
                        <button onClick={handleSend} className="p-2 bg-mai-primary text-white rounded-full hover:bg-opacity-90">
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Mascot / Toggle Button */}
            <div className="relative group cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="w-32 h-32 relative transition-transform group-hover:scale-105 group-hover:-translate-y-2">
                    <Image
                        src="/assets/ai-character.png"
                        alt="Mai Mascot"
                        fill
                        className="object-contain drop-shadow-lg"
                        priority
                    />
                </div>

                {!isOpen && (
                    <div className="absolute -top-2 -right-2 bg-mai-primary text-white rounded-full p-1 shadow-sm animate-bounce" style={{ position: 'absolute', top: '-8px', right: '-8px' }}>
                        <MessageCircle size={20} />
                    </div>
                )}
            </div>
        </div>
    );
};

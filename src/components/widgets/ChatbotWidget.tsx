"use client";

import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute bottom-16 right-4 z-[9000] flex flex-col items-end gap-2" style={{ position: 'absolute', bottom: '4rem', right: '1rem' }}>
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="w-80 h-96 bg-white/90 backdrop-blur-md rounded-2xl border-4 border-pastel-pink shadow-xl flex flex-col overflow-hidden mb-2"
                        style={{ width: '320px', height: '384px', background: 'rgba(255,255,255,0.9)' }}
                    >
                        <div className="bg-pastel-pink p-3 flex justify-between items-center text-white" style={{ background: '#FFD1DC' }}>
                            <span className="font-bold">Mai AI Assistant</span>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-red-400 p-1 rounded"><X size={16} /></button>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto">
                            <div className="bg-pastel-lavender/50 p-2 rounded-lg rounded-tl-none self-start max-w-[85%] text-sm text-gray-700 mb-2">
                                Hi! I'm Mai's AI assistant. Ask me anything about her projects or skills! ( * ^ *)
                            </div>
                        </div>
                        <div className="p-2 border-t border-gray-100">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="w-full px-3 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-pastel-pink"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Character Trigger */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="relative group block"
                style={{ width: '96px', height: '96px', position: 'relative' }}
            >
                <div className="w-24 h-24 relative" style={{ width: '100%', height: '100%' }}>
                    {/* Character Image */}
                    <img
                        src="/assets/ai-character.png"
                        alt="AI Character"
                        className="w-full h-full object-contain drop-shadow-md"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />

                    {!isOpen && (
                        <div className="absolute -top-2 -right-2 bg-pastel-pink text-white rounded-full p-1 shadow-sm animate-bounce" style={{ position: 'absolute', top: '-8px', right: '-8px' }}>
                            <MessageCircle size={16} />
                        </div>
                    )}
                </div>
            </motion.button>
        </div>
    );
};

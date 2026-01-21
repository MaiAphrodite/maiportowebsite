"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { maiCharacter } from '@/features/chat/characters';

type MessagePart = { type: string; text?: string };
type ChatMessage = { id: string; role: string; content?: string; parts?: MessagePart[]; createdAt?: Date | number };

interface ChatContextType {
    messages: ChatMessage[];
    sendMessage: (params: { text: string }) => Promise<void>;
    status: string;
    isLoading: boolean;
    input: string;
    setInput: (value: string) => void;
    token: string | null;
    setToken: (token: string | null) => void;
    messageTimestamps: Map<string, Date>;
    showAiReplies: boolean;
    setShowAiReplies: (value: boolean) => void;
    // StreamFeed persistence
    displayedMessageId: string | null;
    setDisplayedMessageId: (id: string | null) => void;
    displayedText: string;
    setDisplayedText: (text: string) => void;
    // Voice
    isVoiceEnabled: boolean;
    setIsVoiceEnabled: (value: boolean) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [input, setInput] = useState('');
    // Dev bypass: initialize with token if in development
    const [token, setToken] = useState<string | null>(() =>
        process.env.NODE_ENV === 'development' ? 'dev-bypass' : null
    );
    const [showAiReplies, setShowAiReplies] = useState(false);
    const [displayedMessageId, setDisplayedMessageId] = useState<string | null>(null);
    const [displayedText, setDisplayedText] = useState('');
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
    // Use useState for stable mutable object to avoid "reading ref during render" lint
    const [messageTimestamps] = useState(() => new Map<string, Date>());

    const transport = React.useMemo(() => new TextStreamChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest: async ({ messages: msgs, ...rest }) => {
            const currentToken = token;
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
    }), [token]);

    const { messages, sendMessage, status } = useChat({
        id: 'mai-stream-chat',
        transport,
        initialMessages: [{ id: 'welcome', role: 'assistant', content: maiCharacter.greeting }],
        onError: (err: Error) => {
            if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized')) {
                setToken(null);
            }
        }
    } as Parameters<typeof useChat>[0]);

    const isLoading = status === 'streaming' || status === 'submitted';

    // Track timestamps
    useEffect(() => {
        messages.forEach(msg => {
            if (!messageTimestamps.has(msg.id)) {
                messageTimestamps.set(msg.id, new Date());
            }
        });
    }, [messages, messageTimestamps]);

    const wrappedSendMessage = useCallback(async (params: { text: string }) => {
        await sendMessage(params);
    }, [sendMessage]);

    const value: ChatContextType = {
        messages: messages as ChatMessage[],
        sendMessage: wrappedSendMessage,
        status,
        isLoading,
        input,
        setInput,
        token,
        setToken,
        messageTimestamps,
        showAiReplies,
        setShowAiReplies,
        displayedMessageId,
        setDisplayedMessageId,
        displayedText,
        setDisplayedText,
        isVoiceEnabled,
        setIsVoiceEnabled,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

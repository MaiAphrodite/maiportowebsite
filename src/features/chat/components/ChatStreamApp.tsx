"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Send, MoreHorizontal, Heart, RotateCw, Maximize2, Eye, EyeOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { useDesktopActions, useDesktopState } from '@/features/desktop';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { useChatContext } from '@/features/chat/context/ChatContext';

// Resilient Turnstile Verification Component
const TurnstileVerification = React.memo(({
    onSuccess,
    onError,
    compact = false
}: {
    onSuccess: (token: string) => void;
    onError: () => void;
    compact?: boolean;
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
            // Clear any existing timeout
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            // Set timeout: 8 seconds for invisible, 15 for managed
            const timeoutMs = mode === 'invisible' ? 8000 : 15000;
            timeoutRef.current = setTimeout(() => {
                console.warn('[Turnstile] Timeout - widget did not respond');
                if (mode === 'invisible') {
                    // Fallback to visible/managed mode
                    console.log('[Turnstile] Falling back to managed mode');
                    setMode('managed');
                    setStatus('visible');
                    setRetryCount(0);
                } else {
                    // Managed mode also timed out
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
            // Fallback to managed mode
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

    // Success state - don't render anything
    if (status === 'success') return null;



    // Loading state for invisible mode - show subtle indicator
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
                    options={{
                        size: 'invisible',
                        theme: 'light',
                        retry: 'auto',
                        retryInterval: 3000
                    }}
                />
            </div>
        );
    }

    // Modal/Visible Mode (Managed)
    // Covers 'visible', 'failed', and 'loading' (during retry)
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
                            <p className="text-sm text-mai-subtext">
                                We couldn't verify you automatically. Please try disabling ad-blockers or using a different browser.
                            </p>
                            <Button
                                onClick={handleRetry}
                                className="mt-2 w-full bg-mai-primary text-white hover:bg-mai-primary/90"
                            >
                                <RefreshCw size={16} className="mr-2" />
                                Try Again
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center mb-2">
                                {status === 'loading' ? (
                                    <RotateCw size={24} className="animate-spin text-pink-500" />
                                ) : (
                                    <span className="text-2xl">🛡️</span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-mai-text">Security Check</h3>
                            <p className="text-sm text-mai-subtext mb-2">
                                Please complete the verification below to continue chatting.
                            </p>

                            <div className="min-h-[65px] flex justify-center w-full overflow-hidden relative">
                                <Turnstile
                                    ref={turnstileRef}
                                    key={`turnstile-${mode}-${retryCount}`}
                                    siteKey={siteKey}
                                    onSuccess={handleSuccess}
                                    onError={handleError}
                                    onExpire={handleExpire}
                                    options={{
                                        size: 'normal',
                                        theme: 'light',
                                        retry: 'auto',
                                        retryInterval: 3000
                                    }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return null; // Fallback for any other state
});
TurnstileVerification.displayName = 'TurnstileVerification';

type MessagePart = { type: string; text?: string };
type ChatMessage = { id: string; role: string; content?: string; parts?: MessagePart[]; createdAt?: Date | number };

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
    // Use context state for persistence across remounts
    const {
        displayedMessageId,
        setDisplayedMessageId,
        displayedText,
        setDisplayedText,
    } = useChatContext();

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
    // Sound Logic - Advanced Web Audio API
    // Using a ref to keep one context alive (lazy init)
    const audioContextRef = useRef<AudioContext | null>(null);

    // Helper: Create Reverb Impulse
    const createReverbImpulse = (ctx: AudioContext) => {
        const duration = 0.5; // Short tail (0.5s)
        const decay = 2.0;
        const rate = ctx.sampleRate;
        const length = rate * duration;
        const impulse = ctx.createBuffer(2, length, rate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            // White noise with exponential decay
            const mul = Math.pow(1 - i / length, decay);
            left[i] = (Math.random() * 2 - 1) * mul;
            right[i] = (Math.random() * 2 - 1) * mul;
        }
        return impulse;
    };

    // Cache the reverb buffer
    const reverbBufferRef = useRef<AudioBuffer | null>(null);

    const playDialogueSound = (word: string) => {
        try {
            if (!audioContextRef.current) {
                // @ts-expect-error - webkitAudioContext for Safari compatibility
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            // Lazy generate reverb buffer once
            if (!reverbBufferRef.current) {
                reverbBufferRef.current = createReverbImpulse(ctx);
            }

            let min = 1;
            let max = 10;
            if (/[?!]/.test(word)) { min = 21; max = 30; }
            else if (/[.]/.test(word) || word.length > 8) { min = 11; max = 20; }
            else { min = 1; max = 10; }

            const fileIndex = Math.floor(Math.random() * (max - min + 1)) + min;
            const fileName = `bleep${String(fileIndex).padStart(3, '0')}.opus`;

            fetch(`/sounds/dialogue/${fileName}`)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    // Node Structure:
                    // Source -> Gain -> Panner -> Filter -> [Dry/Wet Split]
                    //                                   |-> Destination (Dry)
                    //                                   |-> Convolver (Reverb) -> Destination (Wet)

                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;

                    const gainNode = ctx.createGain();
                    const pannerNode = ctx.createStereoPanner();
                    const filterNode = ctx.createBiquadFilter(); // Warmth LPF
                    const convolverNode = ctx.createConvolver(); // Reverb
                    const reverbGainNode = ctx.createGain();     // Reverb Level

                    // 1. Configure Nodes
                    filterNode.type = 'lowpass';
                    filterNode.frequency.value = 8000; // Brighten: Open up to 8kHz (was 3.5k)
                    filterNode.Q.value = 0.7;

                    convolverNode.buffer = reverbBufferRef.current;
                    reverbGainNode.gain.value = 0.15; // Tighten: Reduce reverb wash (was 0.25)

                    // 2. Connect Graph
                    source.connect(gainNode);
                    gainNode.connect(pannerNode);
                    pannerNode.connect(filterNode);

                    // Dry Path
                    filterNode.connect(ctx.destination);

                    // Wet Path (Reverb)
                    filterNode.connect(convolverNode);
                    convolverNode.connect(reverbGainNode);
                    reverbGainNode.connect(ctx.destination);

                    // 3. Settings (Pitch, Pan, Volume)
                    const lengthFactor = word.length < 4 ? 0.1 : 0;
                    const randomJitter = (Math.random() * 0.3) - 0.1;

                    // Intonation Logic (Prosody)
                    let pitchMod = 0;
                    const isEndOfSentence = /[.!]$/.test(word);
                    const isQuestion = /[?]$/.test(word);
                    const isComma = /[,;:]$/.test(word);

                    if (isEndOfSentence) pitchMod = -0.3;
                    if (isQuestion) pitchMod = 0.35;
                    if (isComma) pitchMod = 0.1;

                    // Pitch Ceiling: Clamp to prevent squeaky sounds
                    let basePitch = 1.2 + lengthFactor + randomJitter + pitchMod;
                    basePitch = Math.max(0.85, Math.min(basePitch, 1.55)); // Clamp 0.85 - 1.55

                    source.playbackRate.value = basePitch;

                    // Stereo Drift: Smooth oscillation (sine wave based on time)
                    const driftSpeed = 0.5; // Cycles per second
                    const driftAmount = 0.35; // Max pan (-0.35 to +0.35)
                    const timeSec = Date.now() / 1000;
                    const panValue = Math.sin(timeSec * driftSpeed * Math.PI * 2) * driftAmount;
                    pannerNode.pan.value = panValue;

                    // 4. Envelopes (Roundness) + Emphasis
                    const now = ctx.currentTime;
                    gainNode.gain.setValueAtTime(0, now);

                    // Emphasis: Louder for long/important words, quieter for short filler words
                    const fillerWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'and', 'in', 'it', 'for', 'on', 'with'];
                    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
                    let emphasisVol = 0.5;
                    if (fillerWords.includes(cleanWord)) {
                        emphasisVol = 0.35; // Quieter filler
                    } else if (word.length > 6) {
                        emphasisVol = 0.6; // Louder important words
                    }
                    emphasisVol += (Math.random() * 0.1); // Jitter

                    gainNode.gain.linearRampToValueAtTime(emphasisVol, now + 0.002);

                    // 5. Duration Matching: Bleep length scales with word length
                    // Short words = quick blip, long words = extended sound
                    const minDuration = 0.08; // 80ms minimum
                    const maxDuration = 0.35; // 350ms maximum
                    const msPerChar = 0.025;  // 25ms per character
                    let targetDuration = minDuration + (cleanWord.length * msPerChar);
                    targetDuration = Math.max(minDuration, Math.min(targetDuration, maxDuration));

                    // Fade out envelope matches target duration
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + targetDuration);

                    source.start(now);
                    source.stop(now + targetDuration + 0.02); // Stop slightly after fade completes
                })
                .catch(() => { });

        } catch (_) { // eslint-disable-line @typescript-eslint/no-unused-vars
        }
    };

    // Typing Logic
    const advanceTyping = React.useCallback(() => {
        if (isTypingRef.current) return;

        const fullText = fullTextRef.current;
        const displayedText = displayedTextRef.current;

        // Handle empty text
        if (!fullText || fullText.trim() === '') {
            return;
        }

        const fullWords = fullText.split(' ').filter(w => w.length > 0);
        const displayedWords = displayedText ? displayedText.split(' ').filter(w => w.length > 0) : [];

        // Check if we've displayed all words
        if (displayedWords.length >= fullWords.length) {
            isTypingRef.current = false;
            return;
        }

        isTypingRef.current = true;
        const nextWordIndex = displayedWords.length;
        const nextWord = fullWords[nextWordIndex] || '';

        // Base delay per word length
        let delay = 70 + (nextWord.length * 25);

        // Sentence Cadence: Slow at start/end, faster in middle
        // Find sentence boundaries
        let sentenceStart = 0;
        for (let i = nextWordIndex - 1; i >= 0; i--) {
            if (/[.!?]$/.test(fullWords[i])) {
                sentenceStart = i + 1;
                break;
            }
        }
        let sentenceEnd = fullWords.length - 1;
        for (let i = nextWordIndex; i < fullWords.length; i++) {
            if (/[.!?]$/.test(fullWords[i])) {
                sentenceEnd = i;
                break;
            }
        }
        const sentenceLength = sentenceEnd - sentenceStart + 1;
        const posInSentence = nextWordIndex - sentenceStart;
        const sentenceProgress = sentenceLength > 1 ? posInSentence / (sentenceLength - 1) : 0.5;

        // Parabola: slowest at 0 and 1, fastest at 0.5
        // cadenceMod ranges from 0.8 (fast mid) to 1.2 (slow edges)
        const cadenceMod = 0.8 + 0.4 * Math.abs(sentenceProgress - 0.5) * 2;
        delay = delay * cadenceMod;

        // Rhythm Jitter: Randomize delay by +/- 15%
        const jitter = 1 + ((Math.random() * 0.3) - 0.15);
        delay = delay * jitter;

        // Punctuation Pauses (The "Breath")
        // Fix: Check PREVIOUS word to pause *after* it, not *before* the current word.
        const prevWord = fullWords[nextWordIndex - 1] || '';

        if (/[,;:]$/.test(prevWord)) delay += 150; // Pause after comma
        if (/[.!?]$/.test(prevWord)) delay += 300; // Pause after sentence end

        timeoutRef.current = setTimeout(() => {
            const newText = fullWords.slice(0, nextWordIndex + 1).join(' ');
            setDisplayedText(newText);
            playDialogueSound(nextWord);
            isTypingRef.current = false;

            // Trigger next word immediately after this one finishes
            // This ensures continuous typing even if useEffect doesn't trigger
            // Trigger next word immediately after this one finishes
            // This ensures continuous typing even if useEffect doesn't trigger
        }, delay);
    }, [setDisplayedText, playDialogueSound]); // playDialogueSound is stable (defined in component scope)

    // Watch for new messages
    useEffect(() => {
        if (!latestAssistantMessage) {
            if (displayedText !== '') setDisplayedText('');
            return;
        }
        if (latestAssistantMessage.id !== displayedMessageId) {
            setDisplayedText('');
            setDisplayedMessageId(latestAssistantMessage.id);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            isTypingRef.current = false;
        }
    }, [latestAssistantMessage, displayedMessageId, displayedText, setDisplayedMessageId, setDisplayedText]);

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

// Helper to format timestamp
const formatTimestamp = (date?: Date | number) => {
    if (!date) return '';
    const d = typeof date === 'number' ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Sub-component: Chat Sidebar (Static during typing)
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
    setShowAiReplies
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
    setShowAiReplies: (v: boolean) => void
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    // Helper for pure text extraction
    const getMessageContent = (msg?: ChatMessage) => {
        if (!msg) return '';
        if (msg.content) return msg.content;
        if (msg.parts) {
            return msg.parts.filter((p: MessagePart) => p.type === 'text').map((p: MessagePart) => p.text).join('');
        }
        return '';
    };

    // Use original messages array order - SDK maintains proper interleaving
    // Filter to get all messages except welcome, or just user messages if AI hidden
    const displayMessages = showAiReplies
        ? allMessages.filter((m: ChatMessage) => m.id !== 'welcome')
        : userMessages;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [displayMessages.length]);

    return (
        <div className={`
            bg-mai-surface flex flex-col overflow-hidden border-2 border-mai-border rounded-xl
            ${isCompact
                ? 'flex-1 min-h-0 mx-3 mb-3'
                : 'w-[300px] flex-none min-h-0 my-3 mr-3'
            }
        `}>
            {/* Header with Settings Menu */}
            <div className="p-3 border-b-2 border-mai-border flex justify-between items-center shrink-0 relative">
                <span className="text-mai-text font-semibold flex items-center gap-2">
                    💬 Chat
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 text-mai-subtext hover:text-mai-text"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <MoreHorizontal size={16} />
                </Button>

                {/* Dropdown Menu */}
                {menuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-1 bg-mai-surface border-2 border-mai-border rounded-xl shadow-lg z-50 min-w-[180px] overflow-hidden">
                            <button
                                onClick={() => {
                                    setShowAiReplies(!showAiReplies);
                                    setMenuOpen(false);
                                }}
                                className="w-full px-3 py-2.5 flex items-center gap-2 text-sm text-mai-text hover:bg-mai-surface-dim transition-colors text-left"
                            >
                                {showAiReplies ? <Eye size={14} /> : <EyeOff size={14} />}
                                <span>{showAiReplies ? 'Showing AI replies' : 'AI replies hidden'}</span>
                            </button>
                        </div>
                    </>
                )}
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
                            <TurnstileVerification
                                onSuccess={setToken}
                                onError={() => setToken(null)}
                                compact={true}
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

                {displayMessages.map((msg: ChatMessage) => {
                    const isUser = msg.role === 'user';
                    const isLastUserMsg = isUser && msg.id === userMessages[userMessages.length - 1]?.id;

                    return (
                        <div key={msg.id} className="flex gap-2 items-start">
                            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] text-white font-bold ${isUser ? 'bg-blue-400' : 'bg-pink-400'
                                }`}>
                                {isUser ? 'You' : '♡'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold ${isUser ? 'text-mai-secondary' : 'text-mai-primary'}`}>
                                        {isUser ? 'You' : 'Mai'}
                                    </span>
                                    <span className="text-[10px] text-mai-subtext opacity-60">
                                        {formatTimestamp(messageTimestamps.get(msg.id))}
                                    </span>
                                    {status === 'submitted' && isLastUserMsg && (
                                        <RotateCw size={12} className="text-mai-subtext animate-spin" />
                                    )}
                                </div>
                                <span className={`text-sm break-words leading-relaxed ${isLoading && isLastUserMsg ? 'text-mai-subtext' : 'text-mai-text'}`}>
                                    {getMessageContent(msg)}
                                </span>
                            </div>
                        </div>
                    );
                })}

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
                            <TurnstileVerification
                                onSuccess={setToken}
                                onError={() => setToken(null)}
                                compact={false}
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
    // Get all chat state from context (persisted globally)
    const {
        messages,
        sendMessage,
        status,
        isLoading,
        input,
        setInput,
        token,
        setToken,
        messageTimestamps,
        showAiReplies,
        setShowAiReplies,
    } = useChatContext();

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
                    allMessages={messages}
                    userMessages={userMessages}
                    // aiMessages={aiMessages} // Unused as we filter in ChatSidebar
                    messageTimestamps={messageTimestamps}
                    status={status}
                    isLoading={isLoading}
                    token={token}
                    setToken={setToken}
                    input={input}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    isCompact={isCompact}
                    showAiReplies={showAiReplies}
                    setShowAiReplies={setShowAiReplies}
                />
            </div>
        </div>
    );
};

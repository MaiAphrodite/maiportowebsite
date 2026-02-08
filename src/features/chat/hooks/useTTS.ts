import { useState, useRef, useEffect, useCallback } from 'react';

interface TTSOptions {
    enabled: boolean;
    onStartSpeaking?: () => void;
    onStopSpeaking?: () => void;
}

export function useTTS({ enabled, onStartSpeaking, onStopSpeaking }: TTSOptions) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioQueueRef = useRef<Promise<string | null>[]>([]);
    const isPlayingRef = useRef(false);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);

    // Text processing refs
    const processedTextRef = useRef('');
    const sentenceQueueRef = useRef<string[]>([]);
    const displayBufferRef = useRef('');

    const playNext = useCallback(async () => {
        if (!enabled) {
            return;
        }

        // If already playing, do nothing. The current playback end will trigger next.
        if (isPlayingRef.current) return;

        if (audioQueueRef.current.length === 0) {
            setIsSpeaking(false);
            onStopSpeaking?.();
            return;
        }

        isPlayingRef.current = true;
        setIsSpeaking(true);
        onStartSpeaking?.();

        // Get the promise at the head of the queue
        const nextAudioPromise = audioQueueRef.current[0];

        try {
            // Wait for it to resolve (download)
            const url = await nextAudioPromise;

            // Once resolved, remove it from the queue
            audioQueueRef.current.shift();

            if (!url) {
                // Failed download or empty
                isPlayingRef.current = false;
                playNext();
                return;
            }

            const audio = new Audio(url);
            currentAudioRef.current = audio;

            audio.onended = () => {
                // Cleanup URL to avoid memory leaks
                URL.revokeObjectURL(url);
                isPlayingRef.current = false;
                playNext(); // Play next in line
            };

            audio.onerror = (e) => {
                console.error("TTS Audio Error:", e);
                URL.revokeObjectURL(url);
                isPlayingRef.current = false;
                playNext();
            };

            try {
                await audio.play();
            } catch (err) {
                console.error("TTS Play Error:", err);
                isPlayingRef.current = false;
                playNext();
            }
        } catch (error) {
            console.error("Error waiting for audio promise:", error);
            audioQueueRef.current.shift();
            isPlayingRef.current = false;
            playNext();
        }
    }, [enabled, onStartSpeaking, onStopSpeaking]);

    const fetchAudio = useCallback((text: string) => {
        if (!text.trim()) return;

        // Filter out roleplay actions (text between asterisks)
        const cleanText = text.replace(/\*[^*]+\*/g, '').replace(/\s+/g, ' ').trim();
        if (!cleanText) return;

        // Create the promise IMMEDIATELY to preserve order
        const audioPromise = (async () => {
            try {
                const response = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: cleanText }),
                });

                if (!response.ok) throw new Error('TTS fetch failed');

                const blob = await response.blob();
                return URL.createObjectURL(blob);
            } catch (err) {
                console.error("TTS Fetch Error:", err);
                return null;
            }
        })();

        // Push to queue immediately
        audioQueueRef.current.push(audioPromise);

        // Try to play (will only start if not already playing)
        playNext();
    }, [playNext]);

    const processText = useCallback((fullText: string) => {
        if (!enabled) return;

        // If text was cleared (new message), reset
        if (fullText.length < processedTextRef.current.length) {
            processedTextRef.current = '';
            displayBufferRef.current = '';
            // Optional: Stop current audio?
            // For now, let's just reset the processor
        }

        const newContent = fullText.slice(processedTextRef.current.length);
        if (!newContent) return;

        displayBufferRef.current += newContent;
        processedTextRef.current = fullText;

        // Match punctuation followed by whitespace.
        // We DO NOT match end of string ($) here because in a stream, 
        // the end of the buffer is not necessarily the end of the sentence.
        // We will handle the final sentence via a flush() method or when the stream is done.
        let buffer = displayBufferRef.current;
        const sentenceRegex = /([.?!]+)(\s+)/g;

        let match;
        let lastIndex = 0;

        while ((match = sentenceRegex.exec(buffer)) !== null) {
            const sentence = buffer.substring(lastIndex, match.index + match[1].length).trim();
            if (sentence) {
                // simple check to avoid splitting on "Mr.", "Dr.", etc.
                if (sentence.length < 4 && sentence.includes('.')) {
                    // Too short, likely an abbreviation. Skip this match and keep accumulating.
                    // However, with this while loop structure, skipping is tricky. 
                    // Simplest fix for now: just strict whitespace check.
                    // Enhanced abbreviation check could go here.
                }
                fetchAudio(sentence);
                lastIndex = match.index + match[0].length;
            }
        }

        // Keep the remainder in the buffer
        displayBufferRef.current = buffer.substring(lastIndex);

    }, [enabled, fetchAudio]);

    const flush = useCallback(() => {
        if (displayBufferRef.current.trim()) {
            fetchAudio(displayBufferRef.current.trim());
            displayBufferRef.current = '';
        }
    }, [fetchAudio]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current = null;
            }
            // We can't synchronously revoke URLs from promises that haven't resolved yet in cleanup
            // best effort: revoke what we can if we tracked them, but for now just clear queue
            audioQueueRef.current.forEach(async (p) => {
                const url = await p;
                if (url) URL.revokeObjectURL(url);
            });
            audioQueueRef.current = [];
        };
    }, []);

    // Also stop if disabled externally
    useEffect(() => {
        if (!enabled) {
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                isPlayingRef.current = false;
            }
            audioQueueRef.current = [];
            setIsSpeaking(false);
        }
    }, [enabled]);

    return {
        processText,
        flush,
        isSpeaking,
        stop: () => {
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
            }
            audioQueueRef.current = [];
            isPlayingRef.current = false;
            setIsSpeaking(false);
        }
    };
}

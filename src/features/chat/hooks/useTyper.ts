
import { useState, useRef, useEffect, useCallback } from 'react';
import { useDialogueSound } from './useDialogueSound';

interface UseTyperOptions {
    fullText: string;
    isVoiceEnabled: boolean;
    spokenText?: string;
    onTypeComplete?: () => void;
}

export function useTyper({ fullText, isVoiceEnabled, spokenText, onTypeComplete }: UseTyperOptions) {
    const [displayedText, setDisplayedTextState] = useState('');
    const displayedTextRef = useRef('');
    const isTypingRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sound hook
    const { playDialogueSound } = useDialogueSound();

    // Helper to update ref and state
    const setDisplayedText = (text: string) => {
        displayedTextRef.current = text;
        setDisplayedTextState(text);
    };

    // Reset when fullText changes (new message)
    // But we need to be careful not to reset if we are just appending streaming chunks?
    // In ChatStreamApp, the `fullText` comes from `getMessageContent(latestAssistantMessage)`.
    // If message ID changes, we should reset. 
    // We'll let the parent handle the ID change reset, or trigger it via useEffect here if fullText changes drastically?
    // Actually simplicity: Pass a reset key or let parent drive reset.
    // Let's stick to the logic: if fullText is completely new/different start, reset.

    // Core Typing Logic
    const advanceTyping = useCallback(() => {
        // 1. Voice Mode: Smooth Sync
        if (isVoiceEnabled && spokenText !== undefined) {
            const current = displayedTextRef.current;
            const target = spokenText;

            if (current === target) return;

            // Snap if target reset or diverged
            if (!target.startsWith(current) && current !== '') {
                setTimeout(() => setDisplayedText(target), 0);
                return;
            }

            // Smooth catch-up
            if (target.length > current.length) {
                if (isTypingRef.current) return;
                isTypingRef.current = true;

                // Constant organic speed ~40 chars/sec
                const delay = 25;

                timeoutRef.current = setTimeout(() => {
                    const nextCharCount = current.length + 1;
                    setDisplayedText(target.substring(0, nextCharCount));
                    isTypingRef.current = false;
                    // Trigger next step immediately via effect
                }, delay);
            }
            return;
        }

        // 2. Retro Mode: Bleeps & Jitter
        if (isTypingRef.current) return;

        const currentFullText = fullText;
        const currentDisplayed = displayedTextRef.current;

        if (!currentFullText || currentFullText.trim() === '') return;

        const fullWords = currentFullText.split(' ').filter(w => w.length > 0);
        const displayedWords = currentDisplayed ? currentDisplayed.split(' ').filter(w => w.length > 0) : [];

        // Done?
        if (displayedWords.length >= fullWords.length) {
            isTypingRef.current = false;
            onTypeComplete?.();
            return;
        }

        isTypingRef.current = true;
        const nextWordIndex = displayedWords.length;
        const nextWord = fullWords[nextWordIndex] || '';

        // Base Delay
        let delay = 70 + (nextWord.length * 25);

        // Sentence Cadence
        let sentenceStart = 0;
        // ... (Scanning logic for sentence boundaries)
        // Simplified scanning for modularity or keep logic? 
        // We'll keep the logic but optimize scanning if possible.
        // For now, simple backward scan is fine.
        for (let i = nextWordIndex - 1; i >= 0; i--) {
            if (/[.!?]$/.test(fullWords[i])) { sentenceStart = i + 1; break; }
        }
        let sentenceEnd = fullWords.length - 1;
        for (let i = nextWordIndex; i < fullWords.length; i++) {
            if (/[.!?]$/.test(fullWords[i])) { sentenceEnd = i; break; }
        }

        const sentenceLength = sentenceEnd - sentenceStart + 1;
        const posInSentence = nextWordIndex - sentenceStart;
        const sentenceProgress = sentenceLength > 1 ? posInSentence / (sentenceLength - 1) : 0.5;

        // Parabola modulation
        const cadenceMod = 0.8 + 0.4 * Math.abs(sentenceProgress - 0.5) * 2;
        delay = delay * cadenceMod;

        // Jitter
        const jitter = 1 + ((Math.random() * 0.3) - 0.15);
        delay = delay * jitter;

        // Punctuation Pauses
        const prevWord = fullWords[nextWordIndex - 1] || '';
        if (/[,;:]$/.test(prevWord)) delay += 150;
        if (/[.!?]$/.test(prevWord)) delay += 300;

        timeoutRef.current = setTimeout(() => {
            const newText = fullWords.slice(0, nextWordIndex + 1).join(' ');
            setDisplayedText(newText);

            if (!isVoiceEnabled) {
                playDialogueSound(nextWord);
            }

            isTypingRef.current = false;
        }, delay);

    }, [fullText, isVoiceEnabled, spokenText, playDialogueSound, onTypeComplete]);

    // Loop Effect
    useEffect(() => {
        advanceTyping();
    }, [displayedText, fullText, advanceTyping]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return {
        displayedText,
        setDisplayedText, // Expose reset capability
        isTyping: () => isTypingRef.current
    };
}

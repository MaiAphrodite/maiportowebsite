import { useEffect, useRef, useState, useCallback } from 'react';
import { RingBuffer, SLOT_READY } from '../lib/tts/RingBuffer';

interface TTSResponse {
    audioBlob?: Blob;
    text?: string;
    error?: string;
    isReady?: boolean;
    downloadProgress?: number;
    id?: number;
    slotIndex?: number;
}

interface UseTTSOptions {
    onReady?: () => void;
    onError?: (error: string) => void;
    onProgress?: (percent: number) => void;
    onSpeakStart?: (text: string) => void;
}

// Configuration
const WORKER_COUNT = 4; // More workers = faster parallel synthesis
const SLOT_COUNT = 12;  // Ring buffer slots (should be >= WORKER_COUNT * 2)

export function useTTS({ onReady, onError, onProgress, onSpeakStart }: UseTTSOptions = {}) {
    const workersRef = useRef<Worker[]>([]);
    const ringBufferRef = useRef<RingBuffer | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [spokenText, setSpokenText] = useState<string>('');

    // Store callbacks in refs
    const callbacksRef = useRef({ onReady, onError, onProgress, onSpeakStart });
    useEffect(() => {
        callbacksRef.current = { onReady, onError, onProgress, onSpeakStart };
    }, [onReady, onError, onProgress, onSpeakStart]);

    // Ordering and dispatch
    const nextRequestIdRef = useRef(0);
    const nextExpectedIdRef = useRef(0);
    const workerIndexRef = useRef(0); // Round-robin
    const sentenceTextMapRef = useRef<Map<number, string>>(new Map());

    // Playback state
    const isPlayingRef = useRef(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const readyWorkersRef = useRef(0);
    const playbackLoopActiveRef = useRef(false);

    // Check for SharedArrayBuffer support
    const sabSupportedRef = useRef(typeof SharedArrayBuffer !== 'undefined');

    // Initialize workers and ring buffer
    useEffect(() => {
        if (!sabSupportedRef.current) {
            console.warn('[TTS] SharedArrayBuffer not supported, falling back to single worker mode');
            // Fall back to single worker without SAB
            initFallbackMode();
            return;
        }

        // Create ring buffer
        const ringBuffer = new RingBuffer({ slotCount: SLOT_COUNT });
        ringBufferRef.current = ringBuffer;
        const config = ringBuffer.getConfig();

        // Create workers
        const workers: Worker[] = [];
        for (let i = 0; i < WORKER_COUNT; i++) {
            const worker = new Worker(new URL('../workers/tts.worker.ts', import.meta.url));

            worker.onmessage = (event: MessageEvent<TTSResponse>) => {
                const { isReady: ready, error, downloadProgress, id, slotIndex, text } = event.data;

                if (ready) {
                    readyWorkersRef.current++;
                    if (readyWorkersRef.current === WORKER_COUNT) {
                        console.log('[TTS] All workers ready, pre-warming...');
                        setIsReady(true);
                        callbacksRef.current.onReady?.();
                        // Pre-warm: synthesize a dummy phrase to warm up WASM
                        // This eliminates cold-start latency on first real message
                        workers.forEach((w, idx) => {
                            w.postMessage({ text: '.', id: -1000 - idx, slotIndex: idx });
                        });
                    }
                }

                if (downloadProgress !== undefined) {
                    callbacksRef.current.onProgress?.(downloadProgress);
                }

                if (error) {
                    console.error('[TTS] Worker Error:', error);
                    callbacksRef.current.onError?.(error);
                }

                // Worker completed a synthesis, slot is now READY
                if (id !== undefined && slotIndex !== undefined) {
                    console.log(`[TTS] Worker finished ID ${id} -> Slot ${slotIndex}`);
                    // Store the text for this ID for callback
                    if (text) {
                        sentenceTextMapRef.current.set(id, text);
                    }
                    // Start playback loop if not already running
                    if (!playbackLoopActiveRef.current) {
                        startPlaybackLoop();
                    }
                }
            };

            // Initialize worker with SAB
            worker.postMessage({
                initSAB: {
                    buffer: ringBuffer.getBuffer(),
                    slotSize: config.slotSize,
                    maxAudioSize: config.maxAudioSize
                }
            });

            // Start downloading TTS model
            worker.postMessage({ download: true });

            workers.push(worker);
        }

        workersRef.current = workers;

        return () => {
            workers.forEach(w => w.terminate());
            workersRef.current = [];
            ringBufferRef.current = null;
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Fallback for browsers without SAB
    const initFallbackMode = useCallback(() => {
        const worker = new Worker(new URL('../workers/tts.worker.ts', import.meta.url));

        worker.onmessage = (event: MessageEvent<TTSResponse>) => {
            const { isReady: ready, error, downloadProgress } = event.data;

            if (ready) {
                setIsReady(true);
                callbacksRef.current.onReady?.();
            }

            if (downloadProgress !== undefined) {
                callbacksRef.current.onProgress?.(downloadProgress);
            }

            if (error) {
                callbacksRef.current.onError?.(error);
            }
        };

        worker.postMessage({ download: true });
        workersRef.current = [worker];
    }, []);

    // Playback loop: waits for slots in order and plays them
    const startPlaybackLoop = useCallback(async () => {
        if (playbackLoopActiveRef.current) return;
        playbackLoopActiveRef.current = true;
        setIsSpeaking(true);

        console.log('[TTS] Playback loop started');

        const ringBuffer = ringBufferRef.current;
        if (!ringBuffer) {
            playbackLoopActiveRef.current = false;
            setIsSpeaking(false);
            return;
        }

        while (true) {
            const expectedId = nextExpectedIdRef.current;
            const slotIndex = expectedId % SLOT_COUNT;

            // Check if there's anything to play
            const status = ringBuffer.getStatus(slotIndex);
            if (status !== SLOT_READY) {
                // No more audio ready, exit loop
                console.log(`[TTS] Playback loop: Slot ${slotIndex} not ready (status ${status}), pausing`);
                break;
            }

            // Read audio from slot
            const audioData = ringBuffer.readSlot(slotIndex);
            const text = sentenceTextMapRef.current.get(expectedId) || '';

            console.log(`[TTS] Playing ID ${expectedId} from Slot ${slotIndex} (${audioData.length} bytes)`);

            // Trigger callback
            if (text) {
                setSpokenText(text);
                callbacksRef.current.onSpeakStart?.(text);
            }

            // Play audio if we have data
            if (audioData.length > 0) {
                isPlayingRef.current = true;
                try {
                    await playAudioFromUint8Array(audioData);
                } catch (e) {
                    console.error('[TTS] Playback error:', e);
                }
                isPlayingRef.current = false;
            } else {
                // Empty audio (filtered text) - minimal pause
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Free slot and advance
            ringBuffer.freeSlot(slotIndex);
            sentenceTextMapRef.current.delete(expectedId);
            nextExpectedIdRef.current++;
        }

        playbackLoopActiveRef.current = false;
        setIsSpeaking(false);
        console.log('[TTS] Playback loop ended');
    }, []);

    // Play audio from Uint8Array (WAV data)
    const playAudioFromUint8Array = useCallback((data: Uint8Array): Promise<void> => {
        return new Promise((resolve, reject) => {
            try {
                // Copy data to a regular ArrayBuffer (SAB-backed arrays can't be used directly as BlobPart)
                const buffer = new ArrayBuffer(data.length);
                const view = new Uint8Array(buffer);
                view.set(data);

                const blob = new Blob([buffer], { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audioRef.current = audio;

                audio.onended = () => {
                    URL.revokeObjectURL(url);
                    resolve();
                };

                audio.onerror = (e) => {
                    URL.revokeObjectURL(url);
                    reject(e);
                };

                audio.play().catch(reject);
            } catch (e) {
                reject(e);
            }
        });
    }, []);

    // Speak a sentence (dispatch to worker)
    const speak = useCallback((text: string) => {
        if (workersRef.current.length === 0 || !text.trim()) return;

        const id = nextRequestIdRef.current++;
        const slotIndex = id % SLOT_COUNT;

        // Round-robin worker selection
        const workerIdx = workerIndexRef.current % workersRef.current.length;
        workerIndexRef.current++;

        const worker = workersRef.current[workerIdx];

        console.log(`[TTS] Dispatching ID ${id} to Worker ${workerIdx} -> Slot ${slotIndex}: "${text.slice(0, 30)}..."`);

        // Store text for callback later
        sentenceTextMapRef.current.set(id, text);

        worker.postMessage({ text, id, slotIndex });
    }, []);

    // Speak a full message (splits into sentences and dispatches all)
    const speakMessage = useCallback((fullText: string) => {
        if (!fullText.trim()) return;

        // Split into sentences
        const sentences = fullText.match(/[^.!?]+[.!?]+\s*/g) || [fullText];

        console.log(`[TTS] Speaking ${sentences.length} sentence(s)`);

        // Dispatch all sentences
        sentences.forEach(s => speak(s.trim()));
    }, [speak]);

    // Reset state
    const reset = useCallback(() => {
        console.log('[TTS] Resetting...');

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // Reset ring buffer
        ringBufferRef.current?.reset();

        // Reset counters
        nextRequestIdRef.current = 0;
        nextExpectedIdRef.current = 0;
        workerIndexRef.current = 0;
        sentenceTextMapRef.current.clear();

        isPlayingRef.current = false;
        playbackLoopActiveRef.current = false;
        setIsSpeaking(false);
        setSpokenText('');
    }, []);

    return { isReady, isSpeaking, speak, speakMessage, spokenText, reset };
}

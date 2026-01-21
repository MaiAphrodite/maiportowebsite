/// <reference lib="webworker" />

// WebGPU Monkey-Patch: Must be done BEFORE importing piper-tts-web
// This intercepts ONNX InferenceSession.create to add WebGPU execution provider
import * as ort from 'onnxruntime-web';

let webgpuAvailable = false;

// Check WebGPU availability and patch ONNX
async function setupWebGPU() {
    try {
        // Check if WebGPU is available
        if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
            const adapter = await (navigator as unknown as { gpu: { requestAdapter: () => Promise<unknown> } }).gpu.requestAdapter();
            if (adapter) {
                webgpuAvailable = true;
                console.log('[TTS Worker] WebGPU available - will use GPU acceleration');

                // Monkey-patch InferenceSession.create to add WebGPU provider
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const originalCreate = ort.InferenceSession.create.bind(ort.InferenceSession) as any;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (ort.InferenceSession as any).create = async function (...args: unknown[]) {
                    // Inject WebGPU execution provider into options
                    const lastArg = args[args.length - 1];
                    if (typeof lastArg === 'object' && lastArg !== null) {
                        (lastArg as Record<string, unknown>).executionProviders = ['webgpu', 'wasm'];
                    } else {
                        args.push({ executionProviders: ['webgpu', 'wasm'] });
                    }
                    console.log('[TTS Worker] Using WebGPU execution provider');
                    return originalCreate(...args);
                };
            }
        }
    } catch (e) {
        console.log('[TTS Worker] WebGPU not available, using WASM:', e);
    }
}

// Initialize WebGPU patch immediately
const webgpuReady = setupWebGPU();

import { TtsSession } from '@mintplex-labs/piper-tts-web';
import { RingBufferView, SLOT_FILLING } from '../lib/tts/RingBuffer';

// Message types
interface TTSRequest {
    text?: string;
    download?: boolean;
    id?: number;
    slotIndex?: number;
    // SAB initialization
    initSAB?: {
        buffer: SharedArrayBuffer;
        slotSize: number;
        maxAudioSize: number;
    };
}

interface TTSResponse {
    audioBlob?: Blob;
    text?: string;
    error?: string;
    isReady?: boolean;
    downloadProgress?: number;
    id?: number;
    slotIndex?: number;
    // For legacy mode (non-SAB)
    audioData?: Uint8Array;
}

// Voice ID - Female English voice (good quality, medium size)
const VOICE_ID = 'en_US-hfc_female-medium';

// Custom WASM paths using local files served by Next.js from public/static/chunks
const WASM_PATHS = {
    onnxWasm: '/static/chunks/',
    piperData: '/static/chunks/piper_phonemize.data',
    piperWasm: '/static/chunks/piper_phonemize.wasm'
};

let session: InstanceType<typeof TtsSession> | null = null;
let isInitializing = false;

// SharedArrayBuffer mode
let ringBufferView: RingBufferView | null = null;
let useSABMode = false;

// Initialize the TTS session
async function initSession(): Promise<boolean> {
    if (session?.ready) return true;
    if (isInitializing) return false;

    isInitializing = true;

    try {
        // Wait for WebGPU patch to be applied (if available)
        await webgpuReady;

        console.log('[TTS Worker] Initializing Piper TTS session...');

        session = new TtsSession({
            voiceId: VOICE_ID,
            wasmPaths: WASM_PATHS,
            progress: (progress) => {
                const percent = Math.round((progress.loaded * 100) / progress.total);
                console.log(`[TTS Worker] Download: ${percent}%`);
                postMessage({ downloadProgress: percent } as TTSResponse);
            }
        });

        // Wait for session to be ready
        await session.waitReady;

        console.log('[TTS Worker] Session ready!');
        postMessage({ isReady: true } as TTSResponse);
        return true;
    } catch (err) {
        console.error('[TTS Worker] Initialization failed:', err);
        postMessage({ error: `Failed to initialize TTS: ${err}` } as TTSResponse);
        return false;
    } finally {
        isInitializing = false;
    }
}

// Helper: Filter text (remove actions like *wink*)
function cleanText(text: string): string {
    // Remove content between asterisks (e.g., *wink*, *laughs*)
    return text.replace(/\*[^*]+\*/g, '').trim();
}

// Convert Blob to Uint8Array
async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}

// Handle messages
self.onmessage = async (e: MessageEvent<TTSRequest>) => {
    const { text, download, id, slotIndex, initSAB } = e.data;

    // Initialize SharedArrayBuffer mode
    if (initSAB) {
        ringBufferView = new RingBufferView(
            initSAB.buffer,
            initSAB.slotSize,
            initSAB.maxAudioSize
        );
        useSABMode = true;
        console.log('[TTS Worker] SharedArrayBuffer mode initialized');
        return;
    }

    // Just initialize the session
    if (download) {
        await initSession();
        return;
    }

    if (!text || text.trim() === '') {
        await initSession();
        if (id !== undefined) {
            if (useSABMode && slotIndex !== undefined && ringBufferView) {
                // Write empty data to slot
                ringBufferView.writeToSlot(slotIndex, new Uint8Array(0));
                postMessage({ id, slotIndex } as TTSResponse);
            } else {
                postMessage({ text: text || '', id } as TTSResponse);
            }
        }
        return;
    }

    // Ensure session is ready
    if (!session?.ready) {
        const ready = await initSession();
        if (!ready) {
            if (useSABMode && slotIndex !== undefined && ringBufferView) {
                // Signal error by writing empty data
                ringBufferView.writeToSlot(slotIndex, new Uint8Array(0));
            }
            return;
        }
    }

    try {
        // Filter text for actions
        const speakerText = cleanText(text);

        console.log(`[TTS Worker] ID ${id} Slot ${slotIndex} Raw: "${text.slice(0, 30)}" -> Speak: "${speakerText.slice(0, 30)}"`);

        // Mark slot as filling (if in SAB mode)
        if (useSABMode && slotIndex !== undefined && ringBufferView) {
            ringBufferView.markFilling(slotIndex);
        }

        if (!speakerText) {
            // Text was only actions, or empty after cleaning
            console.log(`[TTS Worker] ID ${id} skipped (empty after cleanup)`);
            if (useSABMode && slotIndex !== undefined && ringBufferView) {
                // Write empty data to signal "skip"
                ringBufferView.writeToSlot(slotIndex, new Uint8Array(0));
                postMessage({ id, slotIndex } as TTSResponse);
            } else {
                postMessage({ text, id } as TTSResponse);
            }
            return;
        }

        const startTime = performance.now();

        // Generate WAV blob
        const wavBlob = await session!.predict(speakerText);
        const duration = Math.round(performance.now() - startTime);

        console.log(`[TTS Worker] Generated ID ${id} in ${duration}ms`);

        if (useSABMode && slotIndex !== undefined && ringBufferView) {
            // Convert blob to Uint8Array and write to SAB
            const audioData = await blobToUint8Array(wavBlob);
            ringBufferView.writeToSlot(slotIndex, audioData);
            // Notify coordinator that this slot is ready
            postMessage({ id, slotIndex, text } as TTSResponse);
        } else {
            // Legacy mode: send blob via postMessage
            postMessage({ audioBlob: wavBlob, text, id } as TTSResponse);
        }

    } catch (err) {
        console.error('[TTS Worker] Speech generation failed:', err);
        if (useSABMode && slotIndex !== undefined && ringBufferView) {
            // Write empty data to unblock coordinator
            ringBufferView.writeToSlot(slotIndex, new Uint8Array(0));
        }
        postMessage({ error: `Speech generation failed: ${err}`, id, slotIndex } as TTSResponse);
    }
};

// Start initializing immediately
initSession();

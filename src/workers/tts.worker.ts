/// <reference lib="webworker" />

import { PiperSession } from '../lib/tts/piper/PiperSession';
import { RingBufferView } from '../lib/tts/RingBuffer';

// Message types
interface TTSRequest {
    text?: string;
    download?: boolean;
    initSAB?: {
        buffer: SharedArrayBuffer;
        slotSize: number;
        maxAudioSize: number;
    };
    id?: number;
    slotIndex?: number;
}

// Configuration
const VOICE_ID = 'en_US-hfc_female-medium';

// CDN Paths for bandwidth savings independent of Vercel
const MODEL_BASE = 'https://huggingface.co/diffusionstudio/piper-voices/resolve/main/en/en_US/hfc_female/medium';
const PIPER_BASE = 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm';
// ONNX Runtime Web files from CDN
const ONNX_WASM_PATH = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/';

// State
let session: PiperSession | null = null;
let ringBuffer: RingBufferView | null = null;
let isReady = false;

// Initialize Session
async function initSession() {
    try {
        console.log('[TTS Worker] Initializing Self-Hosted Piper Session...');

        session = new PiperSession({
            voiceId: VOICE_ID,
            modelPath: `${MODEL_BASE}/${VOICE_ID}.onnx`,
            modelConfigPath: `${MODEL_BASE}/${VOICE_ID}.onnx.json`,
            wasmPath: PIPER_BASE, // Folder containing piper_phonemize.wasm
            onnxWasmPath: ONNX_WASM_PATH,
            logger: (msg) => console.log(`[PiperWorker] ${msg}`)
        });

        await session.init();

        isReady = true;
        console.log('[TTS Worker] Session Ready');
        self.postMessage({ isReady: true });

    } catch (e) {
        console.error('[TTS Worker] Initialization Error:', e);
        self.postMessage({ error: (e as Error).toString() });
    }
}

// Handle Messages
self.onmessage = async (event: MessageEvent<TTSRequest>) => {
    const { text, download, initSAB, id, slotIndex } = event.data;

    if (initSAB) {
        ringBuffer = new RingBufferView(initSAB.buffer, initSAB.slotSize, initSAB.maxAudioSize);
        console.log('[TTS Worker] Ring Buffer Initialized');
        return;
    }

    if (download) {
        if (!session) await initSession();
        return;
    }

    if (text) {
        try {
            if (!session || !isReady) {
                if (!session) await initSession();
            }

            if (!session) throw new Error('Session failed to initialize');

            // Synthesize
            const audio = await session.synthesize(text);

            // Write to Ring Buffer
            if (ringBuffer && id !== undefined && slotIndex !== undefined) {
                // Convert Int16Array back to bytes (Uint8Array) for the SharedArrayBuffer
                const uint8Audio = new Uint8Array(audio.buffer);
                ringBuffer.writeToSlot(slotIndex, uint8Audio);
                // Notify main thread
                self.postMessage({ id, slotIndex, text });
            } else {
                // Fallback: send as blob/buffer (not implemented for ring buffer mode, but useful for debug)
                // self.postMessage({ audioBlob: ... });
            }

        } catch (e) {
            console.error('[TTS Worker] Synthesis Error:', e);
            self.postMessage({ error: (e as Error).toString(), id });
        }
    }
};

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

// HuggingFace Hub for patched INT32 model (CORS-friendly, saves Vercel bandwidth, works with WebGPU)
const MODEL_URL = 'https://huggingface.co/MaiAphrodite/piper-tts-webgpu/resolve/main/en_US-hfc_female-medium-int32.onnx';
// Config from original Piper voices repo
const CONFIG_URL = 'https://huggingface.co/diffusionstudio/piper-voices/resolve/main/en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx.json';
const PIPER_BASE = 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm';
// ONNX Runtime Web files from CDN
const ONNX_WASM_PATH = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/';

// State
let session: PiperSession | null = null;
let ringBuffer: RingBufferView | null = null;
let isReady = false;

// Convert Int16 PCM to WAV ArrayBuffer
function int16ToWav(int16Array: Int16Array, sampleRate: number = 22050, numChannels: number = 1): ArrayBuffer {
    const bytesPerSample = 2;
    const dataLength = int16Array.length * bytesPerSample;
    const headerLength = 44;
    const totalLength = headerLength + dataLength;

    const buffer = new ArrayBuffer(totalLength);
    const view = new DataView(buffer);

    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, totalLength - 8, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"

    // fmt chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true);  // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // byte rate
    view.setUint16(32, numChannels * bytesPerSample, true); // block align
    view.setUint16(34, 16, true); // bits per sample

    // data chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataLength, true);

    // Write PCM data
    let offset = 44;
    for (let i = 0; i < int16Array.length; i++) {
        view.setInt16(offset, int16Array[i], true);
        offset += 2;
    }

    return buffer;
}

// Initialize Session
async function initSession() {
    try {
        console.log('[TTS Worker] Initializing Self-Hosted Piper Session...');

        session = new PiperSession({
            voiceId: VOICE_ID,
            modelPath: MODEL_URL,
            modelConfigPath: CONFIG_URL,
            wasmPath: PIPER_BASE,
            onnxWasmPath: ONNX_WASM_PATH,
            logger: (msg) => console.log(`[PiperWorker] ${msg}`),
            onProgress: (percent) => self.postMessage({ downloadProgress: percent })
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

            // Synthesize (returns Int16Array PCM)
            const pcmAudio = await session.synthesize(text);

            // Convert to WAV format
            const wavBuffer = int16ToWav(pcmAudio);

            // Write to Ring Buffer
            if (ringBuffer && id !== undefined && slotIndex !== undefined) {
                const wavData = new Uint8Array(wavBuffer);
                ringBuffer.writeToSlot(slotIndex, wavData);
                // Notify main thread
                self.postMessage({ id, slotIndex, text });
            }

        } catch (e) {
            console.error('[TTS Worker] Synthesis Error:', e);
            self.postMessage({ error: (e as Error).toString(), id });
        }
    }
};

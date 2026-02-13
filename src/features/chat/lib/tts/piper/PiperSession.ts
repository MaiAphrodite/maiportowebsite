import * as ort from 'onnxruntime-web';
import { createPiperPhonemize } from './piperPhonemize.js';

export interface PiperSessionConfig {
    voiceId: string;
    modelPath: string;      // Path to .onnx
    modelConfigPath: string;// Path to .onnx.json (optional if inferred)
    wasmPath: string;       // Path to piper_phonemize.wasm location (directory or file)
    onnxWasmPath: string;   // Path to onnxruntime-web WASM files
    logger?: (msg: string) => void;
    onProgress?: (percent: number) => void;
}

export class PiperSession {
    private session: ort.InferenceSession | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private createPiperPhonemize: any = null;
    private config: PiperSessionConfig;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private modelConfig: any = null;
    private usingWebGPU: boolean = false;

    constructor(config: PiperSessionConfig) {
        this.config = config;
    }

    /**
     * Fetch with progress reporting for large files
     */
    private async fetchWithProgress(url: string): Promise<ArrayBuffer> {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

        const contentLength = response.headers.get('content-length');
        if (!contentLength || !response.body) {
            // Fallback: no progress, just download
            return response.arrayBuffer();
        }

        const total = parseInt(contentLength, 10);
        let received = 0;
        const chunks: Uint8Array[] = [];
        const reader = response.body.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            received += value.length;

            const percent = Math.round((received / total) * 100);
            this.config.onProgress?.(percent);
        }

        // Combine chunks into single ArrayBuffer
        const result = new Uint8Array(received);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        return result.buffer;
    }

    async init() {
        this.log('Initializing PiperSession...');

        // 1. Setup ONNX Runtime
        ort.env.wasm.numThreads = navigator.hardwareConcurrency;
        ort.env.wasm.wasmPaths = this.config.onnxWasmPath;
        ort.env.allowLocalModels = false; // We fetch manually

        // 2. Load Phonemizer Factory
        this.log('Loading Phonemizer...');
        this.createPiperPhonemize = createPiperPhonemize;
        this.log('Phonemizer Factory loaded.');

        // 3. Load Model Config
        this.log(`Loading Model Config: ${this.config.modelConfigPath}`);
        const configResp = await fetch(this.config.modelConfigPath);
        if (!configResp.ok) throw new Error(`Failed to fetch config: ${configResp.statusText}`);
        this.modelConfig = await configResp.json();

        // 4. Load ONNX Model with progress
        this.log(`Loading ONNX Model: ${this.config.modelPath}`);
        const modelArrayBuffer = await this.fetchWithProgress(this.config.modelPath);
        this.log('Model downloaded, creating session...');

        // 5. Create ONNX Session with WebGPU -> WASM fallback
        try {
            this.session = await ort.InferenceSession.create(modelArrayBuffer, {
                executionProviders: ['webgpu', 'wasm'],
                graphOptimizationLevel: 'all'
            });

            // Test run to verify WebGPU works
            await this.testSession();
            this.usingWebGPU = true;
            this.log('PiperSession Initialized (WebGPU)');
        } catch (e) {
            this.log(`WebGPU failed: ${e}, falling back to WASM`);

            // Retry with WASM only
            this.session = await ort.InferenceSession.create(modelArrayBuffer, {
                executionProviders: ['wasm'],
                graphOptimizationLevel: 'all'
            });
            this.usingWebGPU = false;
            this.log('PiperSession Initialized (WASM fallback)');
        }
    }

    /**
     * Test session with a minimal input to catch WebGPU errors early
     */
    private async testSession(): Promise<void> {
        if (!this.session) return;

        const feeds: Record<string, ort.Tensor> = {};

        // Minimal test: single phoneme
        const testPhonemes = [0]; // Silence phoneme
        feeds['input'] = new ort.Tensor('int64', BigInt64Array.from(testPhonemes.map(BigInt)), [1, 1]);
        feeds['input_lengths'] = new ort.Tensor('int64', BigInt64Array.from([BigInt(1)]), [1]);

        if (this.session.inputNames.includes('scales')) {
            feeds['scales'] = new ort.Tensor('float32', Float32Array.from([0.667, 1.0, 0.8]), [3]);
        }

        // This will throw if WebGPU doesn't support the model
        await this.session.run(feeds);
    }

    async synthesize(text: string): Promise<Int16Array> {
        if (!this.session || !this.createPiperPhonemize || !this.modelConfig) {
            throw new Error('PiperSession not initialized');
        }

        // 1. Phonemize
        const phonemeIds = await this.getPhonemeIds(text);

        // 2. Inference
        const audio = await this.runInference(phonemeIds);

        return audio;
    }

    private async getPhonemeIds(text: string): Promise<number[]> {
        return new Promise(async (resolve) => {
            const wasmPath = this.config.wasmPath.endsWith('.wasm')
                ? this.config.wasmPath
                : `${this.config.wasmPath}/piper_phonemize.wasm`;

            const piperModule = await this.createPiperPhonemize({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                print: (data: any) => {
                    try {
                        const json = JSON.parse(data);
                        if (json.phoneme_ids) {
                            resolve(json.phoneme_ids);
                        }
                    } catch {
                        // Ignore non-JSON output
                    }
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
                printErr: (_msg: any) => {
                    // console.warn('Piper Phonemize Stderr:', msg);
                },
                locateFile: (url: string) => {
                    if (url.endsWith('.wasm')) return wasmPath;
                    if (url.endsWith('.data')) return wasmPath.replace('.wasm', '.data');
                    return url;
                }
            });

            const config = this.modelConfig;
            const input = JSON.stringify([{ text: text.trim() }]);

            piperModule.callMain([
                '-l',
                config.espeak.voice,
                '--input',
                input,
                '--espeak_data',
                '/espeak-ng-data'
            ]);
        });
    }

    private async runInference(phonemeIds: number[]): Promise<Int16Array> {
        if (!this.session) throw new Error('Session null');

        const feeds: Record<string, ort.Tensor> = {};

        // Prepare inputs (INT64 for compatibility with both original and patched models)
        const phonemeTensor = new ort.Tensor('int64', BigInt64Array.from(phonemeIds.map(BigInt)), [1, phonemeIds.length]);
        const lengthTensor = new ort.Tensor('int64', BigInt64Array.from([BigInt(phonemeIds.length)]), [1]);

        const inputNames = this.session.inputNames;

        feeds['input'] = phonemeTensor;
        feeds['input_lengths'] = lengthTensor;

        if (inputNames.includes('scales')) {
            // noise, length, noise_w
            feeds['scales'] = new ort.Tensor('float32', Float32Array.from([0.667, 1.0, 0.8]), [3]);
        }

        if (inputNames.includes('sid') && this.modelConfig.num_speakers > 1) {
            feeds['sid'] = new ort.Tensor('int64', BigInt64Array.from([BigInt(0)]), [1]);
        }

        const results = await this.session.run(feeds);
        const output = results[this.session.outputNames[0]]; // usually 'output'

        // Output is float32 [-1, 1], convert to Int16
        const floatData = output.data as Float32Array;
        const int16Data = new Int16Array(floatData.length);
        for (let i = 0; i < floatData.length; i++) {
            const s = Math.max(-1, Math.min(1, floatData[i]));
            int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        return int16Data;
    }

    private log(msg: string) {
        if (this.config.logger) {
            this.config.logger(msg);
        } else {
            console.log(`[PiperSession] ${msg}`);
        }
    }
}

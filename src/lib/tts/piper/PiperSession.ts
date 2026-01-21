import * as ort from 'onnxruntime-web';
import { createPiperPhonemize } from './piperPhonemize.js';
import type { PiperPhonemizer } from './piperPhonemize.js';

export interface PiperSessionConfig {
    voiceId: string;
    modelPath: string;      // Path to .onnx
    modelConfigPath: string;// Path to .onnx.json (optional if inferred)
    wasmPath: string;       // Path to piper_phonemize.wasm location (directory or file)
    onnxWasmPath: string;   // Path to onnxruntime-web WASM files
    logger?: (msg: string) => void;
}

export class PiperSession {
    private session: ort.InferenceSession | null = null;
    private phonemizer: PiperPhonemizer | null = null;
    private config: PiperSessionConfig;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private modelConfig: any = null;

    constructor(config: PiperSessionConfig) {
        this.config = config;
    }

    async init() {
        this.log('Initializing PiperSession...');

        // 1. Setup ONNX Runtime
        ort.env.wasm.numThreads = navigator.hardwareConcurrency;
        ort.env.wasm.wasmPaths = this.config.onnxWasmPath;
        ort.env.allowLocalModels = false; // We fetch manually

        // 2. Initialize Phonemizer
        this.log('Loading Phonemizer...');
        const wasmPath = this.config.wasmPath.endsWith('.wasm')
            ? this.config.wasmPath
            : `${this.config.wasmPath}/piper_phonemize.wasm`;

        this.phonemizer = await createPiperPhonemize({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            print: (data: any) => this.log(`[Phonemize] ${data}`),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            printErr: (data: any) => console.error(`[Phonemize] ${data}`),
            locateFile: (url: string) => {
                if (url.endsWith('.wasm')) return wasmPath;
                if (url.endsWith('.data')) return wasmPath.replace('.wasm', '.data');
                return url;
            }
        });

        // 3. Load Model Config
        this.log(`Loading Model Config: ${this.config.modelConfigPath}`);
        const configResp = await fetch(this.config.modelConfigPath);
        if (!configResp.ok) throw new Error(`Failed to fetch config: ${configResp.statusText}`);
        this.modelConfig = await configResp.json();

        // 4. Load & Create ONNX Session
        this.log(`Loading ONNX Model (WebGPU): ${this.config.modelPath}`);
        const modelResp = await fetch(this.config.modelPath);
        if (!modelResp.ok) throw new Error(`Failed to fetch model: ${modelResp.statusText}`);
        const modelArrayBuffer = await modelResp.arrayBuffer();

        this.session = await ort.InferenceSession.create(modelArrayBuffer, {
            // Priority: WebGPU -> WASM
            executionProviders: ['webgpu', 'wasm'],
            graphOptimizationLevel: 'all'
        });

        this.log('PiperSession Initialized (WebGPU + Local Assets)');
    }

    async synthesize(text: string): Promise<Int16Array> {
        if (!this.session || !this.phonemizer || !this.modelConfig) {
            throw new Error('PiperSession not initialized');
        }

        // 1. Phonemize
        const phonemeIds = await this.phonemize(text);

        // 2. Inference
        const audio = await this.runInference(phonemeIds);

        return audio;
    }

    private async phonemize(text: string): Promise<number[]> {
        if (!this.phonemizer) throw new Error('Phonemizer null');
        const result = this.phonemizer.phonemize(text, this.modelConfig.es_speak_phonemes);
        return result.phoneme_ids;
    }

    private async runInference(phonemeIds: number[]): Promise<Int16Array> {
        if (!this.session) throw new Error('Session null');

        const feeds: Record<string, ort.Tensor> = {};

        // Prepare inputs
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

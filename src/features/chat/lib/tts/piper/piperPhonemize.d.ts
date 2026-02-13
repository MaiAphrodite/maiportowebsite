export interface PiperPhonemizeConfig {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    print?: (data: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    printErr?: (data: any) => void;
    locateFile?: (url: string) => string;
}

export interface PiperPhonemizer {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    phonemize: (text: string, phonemes: any) => { phoneme_ids: number[] };
}

export function createPiperPhonemize(config?: PiperPhonemizeConfig): Promise<PiperPhonemizer>;

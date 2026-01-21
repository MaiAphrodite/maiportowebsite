export interface PiperPhonemizeConfig {
    print?: (data: any) => void;
    printErr?: (data: any) => void;
    locateFile?: (url: string) => string;
}

export interface PiperPhonemizer {
    phonemize: (text: string, phonemes: any) => { phoneme_ids: number[] };
}

export function createPiperPhonemize(config?: PiperPhonemizeConfig): Promise<PiperPhonemizer>;

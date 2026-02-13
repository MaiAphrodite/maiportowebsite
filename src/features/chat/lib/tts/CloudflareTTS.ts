export class CloudflareTTS {
    private accountId: string;
    private apiToken: string;

    constructor() {
        this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
        this.apiToken = process.env.CLOUDFLARE_API_TOKEN || '';

        if (!this.accountId || !this.apiToken) {
            console.warn("Cloudflare TTS: Missing initialization credentials (CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN)");
        }
    }

    /**
     * Generates speech from text using Cloudflare Workers AI (Aura-2)
     */
    async generateSpeech(text: string, options: {
        speaker?: string;
        encoding?: string;
        model?: string;
    } = {}): Promise<ArrayBuffer> {
        if (!this.accountId || !this.apiToken) {
            throw new Error("Cloudflare TTS not configured: Missing Account ID or API Token");
        }

        const model = options.model || process.env.CLOUDFLARE_TTS_MODEL || '@cf/deepgram/aura-2-en';
        const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${model}`;

        const input = {
            text,
            speaker: options.speaker || process.env.CLOUDFLARE_TTS_SPEAKER || 'luna',
            encoding: options.encoding || 'mp3'
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(input)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cloudflare TTS Error (${response.status}): ${errorText}`);
        }

        return await response.arrayBuffer();
    }
}

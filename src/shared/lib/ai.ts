import { createOpenAI } from '@ai-sdk/openai';

// Interface for our identifying our supported providers
type AIProvider = 'grok' | 'openai' | 'deepseek' | 'cloudflare' | 'custom';

interface AIConfig {
    provider: AIProvider;
    modelName: string;
    apiKey?: string;
    baseURL?: string;
}

// Default configuration (Fallbacks to Grok/xAI)
const defaultConfig: AIConfig = {
    provider: (process.env.AI_PROVIDER as AIProvider) || 'grok',
    modelName: process.env.AI_MODEL_NAME || 'grok-4-1-fast-non-reasoning',
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL,
};

/**
 * Creates and returns the configured LanguageModel based on environment variables.
 * This function allows hot-swapping models via .env without changing code.
 */
export function getChatModel() {
    const provider = defaultConfig.provider;

    switch (provider) {
        case 'openai':
            const openai = createOpenAI({
                apiKey: process.env.OPENAI_API_KEY || defaultConfig.apiKey,
                baseURL: defaultConfig.baseURL, // Optional custom base URL
            });
            return openai.chat(defaultConfig.modelName);

        case 'deepseek':
            // DeepSeek often uses OpenAI-compatible endpoints
            const deepseek = createOpenAI({
                apiKey: process.env.DEEPSEEK_API_KEY || defaultConfig.apiKey,
                // Official DeepSeek docs say use https://api.deepseek.com
                // We use .chat() so SDK handles path
                baseURL: 'https://api.deepseek.com',
            });
            return deepseek.chat(defaultConfig.modelName || 'deepseek-chat');

        case 'custom':
            // Generic OpenAI compatible provider
            const custom = createOpenAI({
                apiKey: defaultConfig.apiKey,
                baseURL: defaultConfig.baseURL,
            });
            return custom.chat(defaultConfig.modelName);

        case 'cloudflare':
            // Cloudflare Workers AI (OpenAI compatible)
            const cloudflare = createOpenAI({
                apiKey: process.env.CLOUDFLARE_API_TOKEN || defaultConfig.apiKey,
                baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`,
            });
            return cloudflare.chat(defaultConfig.modelName || '@cf/meta/llama-3.1-8b-instruct');

        case 'grok':
        default:
            // Default to xAI (Grok)
            const grok = createOpenAI({
                baseURL: 'https://api.x.ai/v1',
                apiKey: process.env.GROK_API_KEY || defaultConfig.apiKey,
            });
            // Handle legacy model names or default
            const modelName = defaultConfig.modelName.includes('grok')
                ? defaultConfig.modelName
                : 'grok-4-1-fast-non-reasoning';

            return grok.chat(modelName);
    }
}

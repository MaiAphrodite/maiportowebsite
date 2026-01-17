import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { maiCharacter } from '@/data/characters';
import { knowledgeBase } from '@/data/knowledge';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Initialize the generic OpenAI client for Grok (xAI)
const grok = createOpenAI({
    baseURL: 'https://api.x.ai/v1',
    apiKey: process.env.GROK_API_KEY,
});

type MessagePart = { type: string; text?: string };

export async function POST(req: Request) {
    const body = await req.json();
    const { messages } = body;

    // 1. Get the last user message to perform "RAG"
    const lastMessage = messages[messages.length - 1];

    // Safely extract text content
    let lastUserText = '';
    if (lastMessage.role === 'user') {
        const content = lastMessage.content;
        if (typeof content === 'string') {
            lastUserText = content;
        } else if (Array.isArray(content)) {
            lastUserText = content
                .filter((part: MessagePart) => part.type === 'text')
                .map((part: MessagePart) => part.text)
                .join(' ');
        }
    }
    lastUserText = lastUserText.toLowerCase();

    // 2. Simple RAG: Find relevant chunks based on keywords
    const relevantChunks = knowledgeBase.filter(chunk =>
        chunk.tags.some(tag => lastUserText.includes(tag))
    );

    // 3. Construct Context String
    let contextInfo = '';
    if (relevantChunks.length > 0) {
        contextInfo = `\n\nRELEVANT KNOWLEDGE:\n${relevantChunks.map(c => `- ${c.content}`).join('\n')}`;
    }

    // 4. Construct the Full System Prompt
    const fullSystemPrompt = `${maiCharacter.systemPrompt}${contextInfo}`;

    // 5. Stream the response
    const result = streamText({
        model: grok('grok-4-1-fast-non-reasoning'),
        system: fullSystemPrompt,
        messages,
    });

    return result.toTextStreamResponse();
}

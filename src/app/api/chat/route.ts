import { streamText } from 'ai';
import { maiCharacter } from '@/data/characters';
import { knowledgeBase } from '@/data/knowledge';
import { getChatModel } from '@/lib/ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

type MessagePart = { type: string; text?: string };

export async function POST(req: Request) {
    const body = await req.json();
    const { messages, token } = body;

    // 0. Verify Turnstile Token
    if (!token && process.env.NODE_ENV === 'production' && process.env.TURNSTILE_SECRET_KEY) {
        // Strict check in prod, can be loose in dev if key missing
        return new Response('Missing Turnstile token', { status: 401 });
    }

    if (token) {
        // Skip verification for dev bypass
        if (token === 'dev-bypass') {
            // Valid in dev
        } else {
            const secretKey = process.env.TURNSTILE_SECRET_KEY;
            if (secretKey) {
                const formData = new FormData();
                formData.append('secret', secretKey);
                formData.append('response', token);
                formData.append('remoteip', req.headers.get('x-forwarded-for') || '');

                const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                    method: 'POST',
                    body: formData,
                });

                const outcome = await result.json();
                if (!outcome.success) {
                    return new Response('Invalid Turnstile token', { status: 401 });
                }
            }
        }
    }

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
    try {
        const result = streamText({
            model: getChatModel(), // Modular model selection
            system: fullSystemPrompt,
            messages,
        });

        return result.toTextStreamResponse();
    } catch (error: any) {
        console.error("AI Generation Error:", error);
        return new Response(`AI Error: ${error.message || 'Unknown error'}`, { status: 500 });
    }
}

import { streamText } from 'ai';
import { maiCharacter } from '@/features/chat/characters';
import { knowledgeBase } from '@/shared/data/knowledge';
import { getChatModel } from '@/shared/lib/ai';
import { cookies } from 'next/headers';
import { signSession, verifySession } from '@/shared/lib/session';
import { randomUUID } from 'crypto';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

type MessagePart = { type: string; text?: string };

export async function POST(req: Request) {
    const body = await req.json();
    const { messages, token } = body;

    // 0. Verify Session or Turnstile Token
    console.log("[API] Processing chat request");

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('chat-session')?.value;
    let isVerified = false;

    // Check for existing valid session
    if (sessionToken) {
        const sessionId = verifySession(sessionToken);
        if (sessionId) {
            console.log(`[API] Valid session found: ${sessionId.slice(0, 8)}...`);
            isVerified = true;
        } else {
            console.warn("[API] Invalid or expired session cookie");
        }
    }

    // If not verified by session, check Turnstile
    if (!isVerified) {
        if (!token && process.env.NODE_ENV === 'production' && process.env.TURNSTILE_SECRET_KEY) {
            console.error("[API] Missing Turnstile token in production");
            return new Response('Missing Turnstile token', { status: 401 });
        }

        if (token === 'dev-bypass') {
            console.log("[API] Dev bypass used");
            isVerified = true;
        } else if (token) {
            const secretKey = process.env.TURNSTILE_SECRET_KEY;
            if (secretKey) {
                console.log("[API] Verifying Turnstile token...");
                const formData = new FormData();
                formData.append('secret', secretKey);
                formData.append('response', token);
                formData.append('remoteip', req.headers.get('x-forwarded-for') || '');

                const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                    method: 'POST',
                    body: formData,
                });

                const outcome = await result.json();
                console.log("[API] Turnstile outcome:", outcome.success);

                if (!outcome.success) {
                    console.error("[API] Turnstile verification failed:", JSON.stringify(outcome));
                    return new Response('Invalid Turnstile token', { status: 401 });
                }

                isVerified = true;

                // Create and set new session
                const newSessionId = randomUUID();
                const newSessionToken = signSession(newSessionId);

                // Set cookie for 7 days
                cookieStore.set('chat-session', newSessionToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    path: '/',
                    maxAge: 60 * 60 * 24 * 7
                });
                console.log(`[API] New session created: ${newSessionId.slice(0, 8)}...`);
            } else {
                console.warn("[API] Token provided but TURNSTILE_SECRET_KEY is missing");
                // Allow if secret key is missing (dev/misconfig) but warn
                isVerified = true;
            }
        }
    }

    if (!isVerified) {
        return new Response('Unauthorized', { status: 401 });
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
    } catch (error: unknown) {
        console.error("AI Generation Error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(`AI Error: ${errorMessage}`, { status: 500 });
    }
}

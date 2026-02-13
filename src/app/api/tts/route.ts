
import { NextRequest, NextResponse } from 'next/server';
import { CloudflareTTS } from '@/features/chat/lib/tts/CloudflareTTS';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, speaker } = body;

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const tts = new CloudflareTTS();
        const audioBuffer = await tts.generateSpeech(text, { speaker });

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.byteLength.toString(),
            },
        });
    } catch (error: unknown) {
        console.error('TTS Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

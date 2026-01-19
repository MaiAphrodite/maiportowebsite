
import { createHmac } from 'crypto';

const SECRET = process.env.TURNSTILE_SECRET_KEY || 'default-secret-do-not-use-in-prod';

export function signSession(sessionId: string): string {
    const hmac = createHmac('sha256', SECRET);
    hmac.update(sessionId);
    const signature = hmac.digest('hex');
    return `${sessionId}.${signature}`;
}

export function verifySession(token: string): string | null {
    const [sessionId, signature] = token.split('.');
    if (!sessionId || !signature) return null;

    const data = signSession(sessionId);
    const expectedSignature = data.split('.')[1];

    if (signature === expectedSignature) {
        return sessionId;
    }
    return null;
}

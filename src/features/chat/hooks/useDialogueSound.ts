
import { useRef, useCallback, useEffect } from 'react';

// Create reverb impulse utility (moved from component)
function createReverbImpulse(ctx: AudioContext): AudioBuffer {
    const rate = ctx.sampleRate;
    const length = rate * 2.0; // 2 seconds
    const decay = 2.0;
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = length - i;
        const decayVal = Math.pow(1 - i / length, decay);
        // White noise
        left[i] = (Math.random() * 2 - 1) * decayVal;
        right[i] = (Math.random() * 2 - 1) * decayVal;
    }
    return impulse;
}

export function useDialogueSound() {
    const audioContextRef = useRef<AudioContext | null>(null);
    const reverbBufferRef = useRef<AudioBuffer | null>(null);

    // Initialize context lazily on first interaction attempt if possible, 
    // but usually browsers need a user gesture. We assume called inside a click/effect that is safe?
    // Actually, generic activation is handled by Play.

    const playDialogueSound = useCallback((word: string) => {
        try {
            if (!audioContextRef.current) {
                // @ts-expect-error - webkitAudioContext for Safari compatibility
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            // Lazy generate reverb buffer
            if (!reverbBufferRef.current) {
                reverbBufferRef.current = createReverbImpulse(ctx);
            }

            let min = 1;
            let max = 10;
            if (/[?!]/.test(word)) { min = 21; max = 30; }
            else if (/[.]/.test(word) || word.length > 8) { min = 11; max = 20; }
            else { min = 1; max = 10; }

            const fileIndex = Math.floor(Math.random() * (max - min + 1)) + min;
            const fileName = `bleep${String(fileIndex).padStart(3, '0')}.opus`;

            fetch(`/sounds/dialogue/${fileName}`)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    // Node Graph Construction (Source -> Gain -> Panner -> Filter -> Dry/Wet)
                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;

                    const gainNode = ctx.createGain();
                    const pannerNode = ctx.createStereoPanner();
                    const filterNode = ctx.createBiquadFilter();
                    const convolverNode = ctx.createConvolver();
                    const reverbGainNode = ctx.createGain();

                    // 1. Configure Nodes
                    filterNode.type = 'lowpass';
                    filterNode.frequency.value = 8000;
                    filterNode.Q.value = 0.7;

                    convolverNode.buffer = reverbBufferRef.current;
                    reverbGainNode.gain.value = 0.15;

                    // 2. Connect Graph
                    source.connect(gainNode);
                    gainNode.connect(pannerNode);
                    pannerNode.connect(filterNode);

                    // Dry Path
                    filterNode.connect(ctx.destination);

                    // Wet Path
                    filterNode.connect(convolverNode);
                    convolverNode.connect(reverbGainNode);
                    reverbGainNode.connect(ctx.destination);

                    // 3. Settings (Pitch, Pan, Volume)
                    const lengthFactor = word.length < 4 ? 0.1 : 0;
                    const randomJitter = (Math.random() * 0.3) - 0.1;

                    // Intonation
                    let pitchMod = 0;
                    if (/[.!]$/.test(word)) pitchMod = -0.3;
                    if (/[?]$/.test(word)) pitchMod = 0.35;
                    if (/[,;:]$/.test(word)) pitchMod = 0.1;

                    let basePitch = 1.2 + lengthFactor + randomJitter + pitchMod;
                    basePitch = Math.max(0.85, Math.min(basePitch, 1.55));
                    source.playbackRate.value = basePitch;

                    // Stereo Drift
                    const driftSpeed = 0.5;
                    const driftAmount = 0.35;
                    const timeSec = Date.now() / 1000;
                    const panValue = Math.sin(timeSec * driftSpeed * Math.PI * 2) * driftAmount;
                    pannerNode.pan.value = panValue;

                    // 4. Envelopes
                    const now = ctx.currentTime;
                    gainNode.gain.setValueAtTime(0, now);

                    const fillerWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'and', 'in', 'it', 'for', 'on', 'with'];
                    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
                    let emphasisVol = 0.5;
                    if (fillerWords.includes(cleanWord)) emphasisVol = 0.35;
                    else if (word.length > 6) emphasisVol = 0.6;
                    emphasisVol += (Math.random() * 0.1);

                    gainNode.gain.linearRampToValueAtTime(emphasisVol, now + 0.002);

                    // 5. Duration
                    const minDuration = 0.08;
                    const maxDuration = 0.35;
                    const msPerChar = 0.025;
                    let targetDuration = minDuration + (cleanWord.length * msPerChar);
                    targetDuration = Math.max(minDuration, Math.min(targetDuration, maxDuration));

                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + targetDuration);
                    source.start(now);
                    source.stop(now + targetDuration + 0.02);
                })
                .catch(() => { });

        } catch (_) {
            // Silent fail
        }
    }, []);

    // Cleanup context on unmount? 
    // Usually bad practice to close context if re-mounting elsewhere, but for single app it's fine.
    // We'll leave it open for lazy reuse.

    return { playDialogueSound };
}

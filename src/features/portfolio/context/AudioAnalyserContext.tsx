"use client";

import React, { createContext, useContext, useRef, useCallback } from 'react';

interface AudioAnalyserContextType {
    connectAudio: (audioElement: HTMLAudioElement) => void;
    getFrequencyData: () => Uint8Array | null;
    analyserRef: React.MutableRefObject<AnalyserNode | null>;
}

const AudioAnalyserContext = createContext<AudioAnalyserContextType | null>(null);

export const AudioAnalyserProvider = ({ children }: { children: React.ReactNode }) => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const connectedElementRef = useRef<HTMLAudioElement | null>(null);
    const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

    const connectAudio = useCallback((audioElement: HTMLAudioElement) => {
        // Don't reconnect the same element
        if (connectedElementRef.current === audioElement && sourceRef.current) {
            // Just ensure context is running
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
            return;
        }

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
                console.log('[AudioAnalyser] Created AudioContext, state:', audioContextRef.current.state);
            }

            const ctx = audioContextRef.current;

            if (!analyserRef.current) {
                analyserRef.current = ctx.createAnalyser();
                analyserRef.current.fftSize = 64;
                analyserRef.current.smoothingTimeConstant = 0.7;
                analyserRef.current.connect(ctx.destination);
                dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
                console.log('[AudioAnalyser] Created AnalyserNode, bins:', analyserRef.current.frequencyBinCount);
            }

            // Disconnect previous source if any
            if (sourceRef.current) {
                try { sourceRef.current.disconnect(); } catch { /* ignore */ }
                sourceRef.current = null;
            }

            // Only create new source if element hasn't been connected before
            if (connectedElementRef.current !== audioElement) {
                sourceRef.current = ctx.createMediaElementSource(audioElement);
                sourceRef.current.connect(analyserRef.current);
                connectedElementRef.current = audioElement;
                console.log('[AudioAnalyser] Connected audio element');
            }

            // Resume context if suspended (autoplay policy)
            if (ctx.state === 'suspended') {
                ctx.resume().then(() => {
                    console.log('[AudioAnalyser] AudioContext resumed');
                });
            }
        } catch (error) {
            console.error('[AudioAnalyser] Failed to connect:', error);
        }
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getFrequencyData = useCallback((): Uint8Array<any> | null => {
        if (!analyserRef.current || !dataArrayRef.current) return null;
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        return dataArrayRef.current;
    }, []);

    return (
        <AudioAnalyserContext.Provider value={{ connectAudio, getFrequencyData, analyserRef }}>
            {children}
        </AudioAnalyserContext.Provider>
    );
};

export const useAudioAnalyser = () => {
    const context = useContext(AudioAnalyserContext);
    if (!context) throw new Error('useAudioAnalyser must be used within AudioAnalyserProvider');
    return context;
};

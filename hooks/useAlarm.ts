'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// GLOBAL REFS to ensure all instances of the hook control the SAME audio context and oscillator
let globalAudioCtx: AudioContext | null = null;
let globalOscillator: OscillatorNode | null = null;
let globalGainNode: GainNode | null = null;
let globalIsPlaying = false;
let globalMutedUntil = 0; // Timestamp to suppress restarts after manual deactivation

export const useAlarm = () => {
    const [, setUpdate] = useState(0);

    const stopAlarm = useCallback((suppressForMs = 0) => {
        globalIsPlaying = false;

        if (suppressForMs > 0) {
            globalMutedUntil = Date.now() + suppressForMs;
        }

        if (globalOscillator) {
            try {
                globalOscillator.frequency.cancelScheduledValues(0);
                globalOscillator.stop();
                globalOscillator.disconnect();
            } catch (e) { }
            globalOscillator = null;
        }

        if (globalGainNode) {
            try {
                globalGainNode.disconnect();
            } catch (e) { }
            globalGainNode = null;
        }

        if (globalAudioCtx && globalAudioCtx.state === 'running') {
            globalAudioCtx.suspend();
        }

        setUpdate(prev => prev + 1);
    }, []);

    const startAlarm = useCallback(() => {
        if (globalIsPlaying) return;

        // Suppress restart if we recently manually deactivated (prevents polling race conditions)
        if (Date.now() < globalMutedUntil) {
            console.log('Alarm restart suppressed due to recent deactivation');
            return;
        }

        globalIsPlaying = true;

        try {
            if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
                globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            if (globalAudioCtx.state === 'suspended') {
                globalAudioCtx.resume();
            }

            const osc = globalAudioCtx.createOscillator();
            const gain = globalAudioCtx.createGain();

            osc.type = 'sawtooth';
            const now = globalAudioCtx.currentTime;
            osc.frequency.setValueAtTime(440, now);

            let t = 0;
            const cycleTime = 0.3;
            for (let i = 0; i < 2000; i++) {
                osc.frequency.exponentialRampToValueAtTime(880, now + t + cycleTime / 2);
                osc.frequency.exponentialRampToValueAtTime(440, now + t + cycleTime);
                t += cycleTime;
            }

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.4, now + 0.1);

            osc.connect(gain);
            gain.connect(globalAudioCtx.destination);

            osc.start();

            globalOscillator = osc;
            globalGainNode = gain;

            setUpdate(prev => prev + 1);
        } catch (error) {
            globalIsPlaying = false;
            console.error('Audio initialization failed', error);
        }
    }, []);

    return {
        startAlarm,
        stopAlarm,
        isPlaying: globalIsPlaying
    };
};

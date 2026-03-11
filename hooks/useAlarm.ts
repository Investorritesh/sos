'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// GLOBAL REFS to ensure all instances of the hook control the SAME audio context and oscillator
let globalAudioCtx: AudioContext | null = null;
let globalOscillator1: OscillatorNode | null = null;
let globalOscillator2: OscillatorNode | null = null;
let globalGainNode: GainNode | null = null;
let globalIsPlaying = false;

export const useAlarm = () => {
    const [, setUpdate] = useState(0);

    const stopAlarm = useCallback(() => {
        globalIsPlaying = false;

        const stopOsc = (osc: OscillatorNode | null) => {
            if (osc) {
                try {
                    osc.frequency.cancelScheduledValues(0);
                    osc.stop();
                    osc.disconnect();
                } catch (e) { }
            }
        };

        stopOsc(globalOscillator1);
        stopOsc(globalOscillator2);
        globalOscillator1 = null;
        globalOscillator2 = null;

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
        globalIsPlaying = true;

        try {
            // iOS Compatibility: Ensure AudioContext is created/resumed in a user gesture
            if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
                const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
                globalAudioCtx = new AudioContextClass();
            }

            const ctx = globalAudioCtx;

            // Unlock AudioContext for iOS
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const now = ctx.currentTime;

            // Create Master Gain
            const masterGain = ctx.createGain();
            masterGain.gain.setValueAtTime(0, now);
            masterGain.gain.linearRampToValueAtTime(0.8, now + 0.05);

            // Dual Oscillators
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            
            osc1.type = 'sawtooth';
            osc2.type = 'square';

            // Siren Modulation
            const cycleTime = 0.25;
            let t = 0;
            for (let i = 0; i < 1000; i++) {
                osc1.frequency.exponentialRampToValueAtTime(900, now + t + cycleTime / 2);
                osc1.frequency.exponentialRampToValueAtTime(500, now + t + cycleTime);
                osc2.frequency.exponentialRampToValueAtTime(910, now + t + cycleTime / 2);
                osc2.frequency.exponentialRampToValueAtTime(510, now + t + cycleTime);
                t += cycleTime;
            }

            osc1.connect(masterGain);
            osc2.connect(masterGain);
            masterGain.connect(ctx.destination);

            osc1.start();
            osc2.start();

            globalOscillator1 = osc1;
            globalOscillator2 = osc2;
            globalGainNode = masterGain;

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

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// GLOBAL REFS to ensure all instances of the hook control the SAME audio context and oscillator
let globalAudioCtx: AudioContext | null = null;
let globalOscillator1: OscillatorNode | null = null;
let globalOscillator2: OscillatorNode | null = null;
let globalGainNode: GainNode | null = null;
let globalIsPlaying = false;
let globalAlarmTimeout: ReturnType<typeof setTimeout> | null = null;

export const useAlarm = () => {
    const [, setUpdate] = useState(0);

    const stopAlarm = useCallback(() => {
        if (!globalIsPlaying) return;
        globalIsPlaying = false;

        // Clear existing loop timeout
        if (globalAlarmTimeout) {
            clearTimeout(globalAlarmTimeout);
            globalAlarmTimeout = null;
        }

        const stopOsc = (osc: OscillatorNode | null) => {
            if (osc) {
                try {
                    const now = globalAudioCtx?.currentTime || 0;
                    osc.frequency.cancelScheduledValues(now);
                    osc.stop(now);
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
                const now = globalAudioCtx?.currentTime || 0;
                globalGainNode.gain.cancelScheduledValues(now);
                globalGainNode.gain.setValueAtTime(globalGainNode.gain.value, now);
                globalGainNode.gain.linearRampToValueAtTime(0, now + 0.1);
                setTimeout(() => {
                  globalGainNode?.disconnect();
                  globalGainNode = null;
                }, 150);
            } catch (e) { 
                globalGainNode = null;
            }
        }

        // Specifically for iOS/Android: suspending can help stop stuck audio
        if (globalAudioCtx && globalAudioCtx.state === 'running') {
            globalAudioCtx.suspend().catch(() => {});
        }

        setUpdate(prev => prev + 1);
    }, []);

    const startAlarm = useCallback(() => {
        if (globalIsPlaying) return;
        globalIsPlaying = true;

        try {
            if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
                const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
                globalAudioCtx = new AudioContextClass();
            }

            const ctx = globalAudioCtx;
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }

            const now = ctx.currentTime;
            const masterGain = ctx.createGain();
            masterGain.gain.setValueAtTime(0, now);
            masterGain.gain.linearRampToValueAtTime(0.8, now + 0.1);

            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            
            osc1.type = 'sawtooth';
            osc2.type = 'square';

            const cycleTime = 0.5;
            const numCycles = 20; 
            
            for (let i = 0; i < numCycles; i++) {
                const startTime = now + (i * cycleTime);
                osc1.frequency.exponentialRampToValueAtTime(900, startTime + cycleTime / 2);
                osc1.frequency.exponentialRampToValueAtTime(500, startTime + cycleTime);
                osc2.frequency.exponentialRampToValueAtTime(910, startTime + cycleTime / 2);
                osc2.frequency.exponentialRampToValueAtTime(510, startTime + cycleTime);
            }

            osc1.connect(masterGain);
            osc2.connect(masterGain);
            masterGain.connect(ctx.destination);

            osc1.start(now);
            osc2.start(now);

            globalOscillator1 = osc1;
            globalOscillator2 = osc2;
            globalGainNode = masterGain;

            const totalDuration = cycleTime * numCycles;
            globalAlarmTimeout = setTimeout(() => {
                if (globalIsPlaying) {
                    globalIsPlaying = false; 
                    startAlarm();
                }
            }, totalDuration * 1000);

            setUpdate(prev => prev + 1);
        } catch (error) {
            globalIsPlaying = false;
            console.error('Audio initialization failed', error);
        }
    }, []); // Removed wrap in startAlarm to avoid cyclic dependency if any, it's safe now with global timeout

    return {
        startAlarm,
        stopAlarm,
        isPlaying: globalIsPlaying
    };
};

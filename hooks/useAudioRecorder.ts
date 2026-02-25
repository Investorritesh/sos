'use client';

import { useState, useRef, useCallback } from 'react';

export const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.current.push(event.data);
                }
            };

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
                // In a real app, upload this blob to S3/Cloudinary
                console.log('Recording stopped, blob created:', audioBlob);

                // Convert to base64 for simulation if needed, or just log
                // uploadAudio(audioBlob);
            };

            mediaRecorder.current.start();
            setIsRecording(true);
            console.log('Audio Recording Started');
        } catch (error) {
            console.error('Error starting audio recording:', error);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
            mediaRecorder.current.stop();
            mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            console.log('Audio Recording Stopped');
        }
    }, []);

    return { startRecording, stopRecording, isRecording };
};

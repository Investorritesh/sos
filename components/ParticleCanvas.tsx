'use client';

import { useEffect, useRef } from 'react';

export function ParticleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();

        type Particle = { x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: string };
        const colors = ['rgba(99,102,241,', 'rgba(139,92,246,', 'rgba(96,165,250,'];
        const particles: Particle[] = Array.from({ length: 70 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            size: Math.random() * 1.8 + 0.3,
            opacity: Math.random() * 0.35 + 0.05,
            color: colors[Math.floor(Math.random() * colors.length)],
        }));

        let raf: number;
        const animate = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color + p.opacity + ')';
                ctx.fill();
            });
            raf = requestAnimationFrame(animate);
        };
        animate();
        window.addEventListener('resize', resize);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
    }, []);

    return <canvas ref={canvasRef} className="particle-canvas" />;
}

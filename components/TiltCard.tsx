'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    intensity?: number;
}

export function TiltCard({ children, className = '', intensity = 1 }: TiltCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const factor = 8 * intensity;

    const rX = useSpring(useTransform(y, [-0.5, 0.5], [factor, -factor]), { stiffness: 300, damping: 30 });
    const rY = useSpring(useTransform(x, [-0.5, 0.5], [-factor, factor]), { stiffness: 300, damping: 30 });
    const brightness = useSpring(useTransform(x, [-0.5, 0.5], [0.95, 1.05]));

    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    const handleLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            style={{
                rotateX: rX,
                rotateY: rY,
                filter: `brightness(${brightness})`,
                transformStyle: 'preserve-3d',
                perspective: 1000,
            }}
            className={`glass-card ${className}`}
        >
            {children}
        </motion.div>
    );
}

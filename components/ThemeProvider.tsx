'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeContextType {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'dark',
    toggleTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        const saved = localStorage.getItem('hersecure-theme') as 'light' | 'dark' | null;
        const preferred = saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark');
        setTheme(preferred);
        document.documentElement.setAttribute('data-theme', preferred);
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('hersecure-theme', next);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                zingo: {
                    bg: '#0f172a',
                    card: '#1e293b',
                    text: '#f8fafc',
                    muted: '#94a3b8',
                    accent: '#38bdf8',
                    bingo: '#22c55e',
                },
            },
        },
    },
    plugins: [],
};

export default config;
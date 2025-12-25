/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0a0a0a",
                surface: "#1a1a1a",
                primary: "#8b5cf6", // Neon Purple
                "primary-hover": "#7c3aed",
                secondary: "#ec4899", // Neon Pink accent
                accent: "#06b6d4", // Cyan
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                'neon': '0 0 10px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3)',
            }
        },
    },
    plugins: [],
}

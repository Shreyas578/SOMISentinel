/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
        "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                sentinel: {
                    bg: "#050d1a",
                    panel: "#0a1628",
                    border: "#1a2d4a",
                    accent: "#00aaff",
                    purple: "#7c3aed",
                    glow: "#00d4ff",
                    safe: "#00e676",
                    warn: "#ffab40",
                    danger: "#ff1744",
                },
            },
            fontFamily: {
                mono: ["JetBrains Mono", "Fira Code", "monospace"],
                sans: ["Inter", "system-ui", "sans-serif"],
            },
            animation: {
                pulse_fast: "pulse 1s cubic-bezier(0.4,0,0.6,1) infinite",
                glow: "glow 2s ease-in-out infinite alternate",
                slide_in: "slideIn 0.4s ease-out",
                fade_in: "fadeIn 0.3s ease-out",
            },
            keyframes: {
                glow: {
                    from: { boxShadow: "0 0 10px #00aaff44" },
                    to: { boxShadow: "0 0 25px #00aaffaa, 0 0 50px #00aaff44" },
                },
                slideIn: {
                    from: { transform: "translateY(-10px)", opacity: "0" },
                    to: { transform: "translateY(0)", opacity: "1" },
                },
                fadeIn: {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
            },
            backgroundImage: {
                "sentinel-grid":
                    "radial-gradient(circle at 50% 0%, #00aaff11 0%, transparent 70%), linear-gradient(180deg, #050d1a 0%, #050d1a 100%)",
            },
        },
    },
    plugins: [],
};

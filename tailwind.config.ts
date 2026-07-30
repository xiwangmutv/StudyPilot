import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"], theme: { extend: { colors: { ink: "#20201E", paper: "#F7F7F4", moss: "#DCE8B8", lavender: "#E7E2FA" }, boxShadow: { card: "0 2px 3px rgba(26,26,24,.02),0 16px 40px rgba(26,26,24,.055)", button: "0 8px 20px rgba(32,32,30,.16)" }, fontFamily: { sans: ["var(--font-inter)", "Arial", "sans-serif"], display: ["var(--font-newsreader)", "Georgia", "serif"] } } }, plugins: [] };
export default config;

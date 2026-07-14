import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* ── Brand Palette ── */
        forest: {
          DEFAULT: "#0B3D2E",
          50: "#E8F5F0",
          100: "#D9FBE8",
          200: "#A8EFC8",
          300: "#6DD9A2",
          400: "#3DBF7E",
          500: "#0F6B4F",
          600: "#0B3D2E",
          700: "#082D22",
          800: "#061E17",
          900: "#030F0B",
        },
        emerald: {
          brand: "#0F6B4F",
          light: "#D9FBE8",
          glow: "rgba(15,107,79,0.35)",
        },
        jet: {
          DEFAULT: "#0A0A0A",
          50: "#1A1A1A",
          100: "#111111",
          dark: "#050505",
        },
        "off-white": "#F8FAF9",
        "gray-muted": "#6B7280",
      },
      fontFamily: {
        jakarta: ["Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(15,107,79,0.3), 0 0 40px rgba(15,107,79,0.1)" },
          "50%": { boxShadow: "0 0 40px rgba(15,107,79,0.6), 0 0 80px rgba(15,107,79,0.2)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 6s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        marquee: "marquee 30s linear infinite",
        "fade-up": "fade-up 0.6s ease-out forwards",
        "scale-in": "scale-in 0.5s ease-out forwards",
        "spin-slow": "spin-slow 20s linear infinite",
      },
      backgroundImage: {
        "green-gradient": "linear-gradient(135deg, #0B3D2E 0%, #0F6B4F 100%)",
        "dark-gradient": "linear-gradient(180deg, #0A0A0A 0%, #0B3D2E 100%)",
        "hero-mesh": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(15,107,79,0.25) 0%, transparent 60%)",
        "cta-glow": "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(15,107,79,0.4) 0%, transparent 70%)",
        "card-shine": "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 60%)",
      },
      boxShadow: {
        "green-glow": "0 0 30px rgba(15,107,79,0.4), 0 0 60px rgba(15,107,79,0.15)",
        "green-glow-sm": "0 0 12px rgba(15,107,79,0.35)",
        "card-lift": "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        "card-hover": "0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        "dark-card": "0 4px 24px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

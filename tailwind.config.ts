import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
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

        /* ────────────────────────────────────────────────
           Brand palette — light professional system.
           Green is an ACCENT only (badges, indicators,
           focus, data-ink). Never a button fill.
           Buttons use `ink` (black) exclusively.
        ──────────────────────────────────────────────── */

        /* Ink — the only button colour family */
        ink: {
          DEFAULT: "#0A0A0A",
          hover: "#1C1C1C",
          soft: "#2E2E2E",
          muted: "#5A5F5C",
          faint: "#8B928E",
        },

        /* Paper — page and card surfaces */
        paper: {
          DEFAULT: "#FFFFFF",
          soft: "#FAFBFA",
          tint: "#F5F8F6",
          sunken: "#EFF3F1",
        },

        /* Line — borders and rules */
        line: {
          DEFAULT: "#E7EBE9",
          soft: "#F0F3F1",
          strong: "#D5DCD8",
        },

        /* Forest — the green accent scale */
        forest: {
          DEFAULT: "#0B3D2E",
          50: "#F1F8F4",
          100: "#DEF0E6",
          200: "#B9E2CC",
          300: "#87CCA9",
          400: "#4FAE81",
          500: "#0F6B4F",
          600: "#0B3D2E",
          700: "#082D22",
          800: "#061E17",
          900: "#030F0B",
        },

        emerald: {
          brand: "#0F6B4F",
          light: "#DEF0E6",
          glow: "rgba(15,107,79,0.18)",
        },

        jet: {
          DEFAULT: "#0A0A0A",
          50: "#1A1A1A",
          100: "#111111",
          dark: "#050505",
        },

        "off-white": "#FAFBFA",
        "gray-muted": "#5A6560",

        /* ────────────────────────────────────────────────
           Two-tone brand palette — Electric Blue (#0145F2)
           as the single accent/CTA colour, Canvas Cloud
           (#EDF1F5) as the light surface. Every shade below
           is a tint or shade of Electric Blue so the whole
           landing page reads as one hue. Every landing
           component reads these tokens rather than literal
           hex, so swapping the palette is this one edit.
        ──────────────────────────────────────────────── */
        scale: {
          DEFAULT: "#0145F2",
          50: "#EDF1F5",
          100: "#DCE4F2",
          300: "#93AEF2",
          400: "#3D66F5",
          500: "#0145F2",
          600: "#0138C4",
          900: "#071A4D",
          950: "#040F30",
        },
        "scale-ink": {
          DEFAULT: "#0B1220",
          muted: "#4B5567",
          faint: "#8791A8",
        },
        "scale-surface": {
          DEFAULT: "#FFFFFF",
          soft: "#F5F8FB",
        },
        "scale-line": "#DCE3EC",

        /* ── Dark-redesign text/border tokens (on the scale-950/900 bg) ── */
        "nova-text": {
          DEFAULT: "#EDF1F5",
          muted: "#B7C4E8",
          faint: "#7C89B8",
        },
        "nova-line": "rgba(255,255,255,0.1)",
        "nova-line-strong": "rgba(255,255,255,0.18)",
      },
      fontFamily: {
        jakarta: ["Plus Jakarta Sans", "sans-serif"],
        grotesk: ["var(--font-grotesk)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.02em" }],
      },
      letterSpacing: {
        tightest: "-0.035em",
        looser: "0.08em",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "4xl": "2rem",
      },
      transitionTimingFunction: {
        /* One easing language across the whole product */
        expo: "cubic-bezier(0.16, 1, 0.3, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        entrance: "cubic-bezier(0.22, 1, 0.36, 1)",
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
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(15,107,79,0.28)" },
          "70%": { boxShadow: "0 0 0 10px rgba(15,107,79,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(15,107,79,0)" },
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
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "draw-line": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        aurora: {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "33%": { transform: "translate(4%, -6%) scale(1.08)" },
          "66%": { transform: "translate(-3%, 4%) scale(0.96)" },
        },
        "twinkle": {
          "0%, 100%": { opacity: "0.15" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "accordion-up": "accordion-up 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        float: "float 7s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        shimmer: "shimmer 3s linear infinite",
        marquee: "marquee 38s linear infinite",
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scale-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "spin-slow": "spin-slow 26s linear infinite",
        "draw-line": "draw-line 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        aurora: "aurora 18s ease-in-out infinite",
        "aurora-slow": "aurora 26s ease-in-out infinite reverse",
        twinkle: "twinkle 4s ease-in-out infinite",
      },
      backgroundImage: {
        /* Kept for green *accent* surfaces — never used on buttons */
        "green-gradient": "linear-gradient(135deg, #0B3D2E 0%, #0F6B4F 100%)",
        "ink-gradient": "linear-gradient(135deg, #0A0A0A 0%, #242424 100%)",
        "hero-mesh":
          "radial-gradient(ellipse 70% 55% at 50% -10%, rgba(15,107,79,0.10) 0%, transparent 65%)",
        "cta-glow":
          "radial-gradient(ellipse 65% 60% at 50% 50%, rgba(15,107,79,0.12) 0%, transparent 72%)",
        "card-shine":
          "linear-gradient(135deg, rgba(15,107,79,0.04) 0%, rgba(255,255,255,0) 58%)",
        "grid-faint":
          "linear-gradient(rgba(11,61,46,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(11,61,46,0.045) 1px, transparent 1px)",
        /* UpScaler AI rebrand gradients */
        "scale-gradient": "linear-gradient(135deg, #071A4D 0%, #0145F2 100%)",
        "scale-glow":
          "radial-gradient(ellipse 65% 60% at 50% 50%, rgba(1,69,242,0.18) 0%, transparent 72%)",

        /* ── Dark redesign — hero/card/button gradients ── */
        "nova-hero-gradient": "linear-gradient(135deg, #0145F2 0%, #3D66F5 55%, #93AEF2 100%)",
        "nova-card-gradient": "linear-gradient(180deg, #0B1F70 0%, #050F3D 100%)",
        "nova-btn-gradient": "linear-gradient(90deg, #0145F2 0%, #3D66F5 100%)",
        "nova-aurora-1":
          "radial-gradient(circle, rgba(1,69,242,0.38) 0%, transparent 70%)",
        "nova-aurora-2":
          "radial-gradient(circle, rgba(1,69,242,0.26) 0%, transparent 70%)",
        "nova-aurora-3":
          "radial-gradient(circle, rgba(61,102,245,0.22) 0%, transparent 70%)",
        "nova-grid":
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      boxShadow: {
        /* Layered, low-opacity elevation — the professional look */
        hair: "0 0 0 1px rgba(11,61,46,0.06)",
        "card-lift":
          "0 1px 2px rgba(16,24,20,0.04), 0 4px 12px rgba(16,24,20,0.05)",
        "card-hover":
          "0 2px 6px rgba(16,24,20,0.06), 0 14px 32px rgba(16,24,20,0.09)",
        "card-float":
          "0 4px 10px rgba(16,24,20,0.05), 0 24px 56px rgba(16,24,20,0.11)",
        ink: "0 1px 2px rgba(10,10,10,0.16), 0 6px 18px rgba(10,10,10,0.18)",
        "ink-hover":
          "0 2px 4px rgba(10,10,10,0.20), 0 12px 28px rgba(10,10,10,0.26)",
        "green-ring": "0 0 0 3px rgba(15,107,79,0.14)",
        "green-glow": "0 6px 22px rgba(15,107,79,0.16)",
        "green-glow-sm": "0 3px 12px rgba(15,107,79,0.14)",
        "dark-card": "0 1px 2px rgba(16,24,20,0.04), 0 8px 24px rgba(16,24,20,0.07)",
        /* UpScaler AI rebrand shadows */
        "scale-card": "0 8px 24px rgba(0,0,0,0.05)",
        "scale-illustration": "0 30px 60px rgba(1,69,242,0.16)",
        "scale-btn": "0 8px 20px rgba(1,69,242,0.24)",
        /* Nova dark-glass shadows/glows */
        "nova-glass": "0 20px 60px rgba(0,0,0,0.4)",
        "nova-glass-hover": "0 24px 70px rgba(0,0,0,0.5), 0 0 40px rgba(1,69,242,0.15)",
        "nova-btn-glow": "0 8px 24px rgba(1,69,242,0.35)",
        "nova-btn-glow-lg": "0 12px 32px rgba(1,69,242,0.5)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Poppins", "Roboto", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        wlh: {
          brand: "#22B573",
          navy: "#071028",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
      },
      boxShadow: {
        "glow-button": "0 0 20px rgba(34, 181, 115, 0.8)",
        "glow-green": "0 0 30px rgba(34, 181, 115, 0.6)",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-8px)" },
          "50%": { transform: "translateX(8px)" },
          "75%": { transform: "translateX(-6px)" },
          "90%": { transform: "translateX(4px)" },
        },
        float1: {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "25%": { transform: "translate(10px, -15px) rotate(5deg)" },
          "50%": { transform: "translate(-5px, -25px) rotate(-3deg)" },
          "75%": { transform: "translate(-15px, -10px) rotate(4deg)" },
        },
        float2: {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "33%": { transform: "translate(-12px, 18px) rotate(-6deg)" },
          "66%": { transform: "translate(8px, 10px) rotate(4deg)" },
        },
        float3: {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "30%": { transform: "translate(15px, -12px) rotate(7deg)" },
          "60%": { transform: "translate(-10px, -20px) rotate(-5deg)" },
        },
        float4: {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "25%": { transform: "translate(10px, -15px) rotate(5deg)" },
          "50%": { transform: "translate(-5px, -25px) rotate(-3deg)" },
          "75%": { transform: "translate(-15px, -10px) rotate(4deg)" },
        },
        float5: {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "25%": { transform: "translate(10px, -15px) rotate(5deg)" },
          "50%": { transform: "translate(-5px, -25px) rotate(-3deg)" },
          "75%": { transform: "translate(-15px, -10px) rotate(4deg)" },
        },
        float6: {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "25%": { transform: "translate(10px, -15px) rotate(5deg)" },
          "50%": { transform: "translate(-5px, -25px) rotate(-3deg)" },
          "75%": { transform: "translate(-15px, -10px) rotate(4deg)" },
        },
        "pulse-slow": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.2" },
          "50%": { transform: "scale(1.1)", opacity: "0.25" },
        },
        "pulse-slower": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.15" },
          "50%": { transform: "scale(1.15)", opacity: "0.2" },
        },
        "pulse-slowest": {
          "0%, 100%": { transform: "scale(1) rotate(0deg)", opacity: "0.1" },
          "50%": { transform: "scale(1.2) rotate(180deg)", opacity: "0.15" },
        },
        "login-fade": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shake: "shake 300ms ease-in-out",
        float1: "float1 8s ease-in-out infinite",
        float2: "float2 10s ease-in-out infinite",
        float3: "float3 9s ease-in-out infinite",
        float4: "float1 7s ease-in-out infinite",
        float5: "float2 11s ease-in-out infinite",
        float6: "float3 8.5s ease-in-out infinite",
        "pulse-slow": "pulse-slow 8s ease-in-out infinite",
        "pulse-slower": "pulse-slower 10s ease-in-out infinite",
        "pulse-slowest": "pulse-slowest 12s ease-in-out infinite",
        "login-fade": "login-fade 0.8s ease-out",
      },
    },
  },
};

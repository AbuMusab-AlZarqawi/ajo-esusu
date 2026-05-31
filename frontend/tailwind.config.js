/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#050B1F",
          800: "#091430",
          700: "#0D1E47",
          600: "#112860",
        },
        gold: {
          300: "#FFE08A",
          400: "#FFD54F",
          500: "#FFC107",
          600: "#E6A800",
          700: "#CC9600",
        },
        ember: "#FF6B35",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      backgroundImage: {
        "adire-pattern": "url('/adire.svg')",
      },
    },
  },
  plugins: [],
};

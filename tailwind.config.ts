import type { Config } from "tailwindcss";

// Paleta de marca Ranch Texas (PROVISIONAL — pendiente logo definitivo, ver decisiones.md P4).
// Cambiar aquí y se propaga a toda la app.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ranch: {
          marron: "#3B2416",
          "marron-oscuro": "#2A1810",
          crema: "#F4EAD7",
          dorado: "#C79A3C",
          verde: "#57A23C",
        },
      },
      fontFamily: {
        sans: ["system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

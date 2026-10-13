import type { Config } from "tailwindcss";

// Valores de ejecución del sistema canónico: .agents/brand/sistema-visual.md.
const config: Config = {
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#FFF8ED", surface: "#FFFFFF", ink: "#241C17", muted: "#6B5C50",
          action: "#9B2C20", "action-hover": "#7D2018", fire: "#D65A1E",
          gold: "#C89538", "gold-ink": "#8A5A16", border: "#DED0BE",
          "control-border": "#8A7869", success: "#247044", danger: "#B42318", info: "#275F83",
        },
      },
      fontFamily: {
        brand: ["var(--font-fraunces)", "Georgia", "serif"],
        ui: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "brand-mobile": ["2rem", "2.375rem"], "brand-desktop": ["3rem", "3.5rem"],
        "section-mobile": ["1.5rem", "1.875rem"], "section-desktop": ["2rem", "2.5rem"],
        product: ["1.125rem", "1.625rem"],
      },
      borderRadius: { button: "10px", card: "12px", field: "8px" },
      maxWidth: { content: "1200px" },
      transitionDuration: { feedback: "150ms", panel: "220ms" },
    },
  },
};
export default config;

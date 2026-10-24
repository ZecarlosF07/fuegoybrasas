import type { Config } from "tailwindcss";

// Valores de ejecución del sistema canónico: .agents/brand/sistema-visual.md.
const config: Config = {
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#FFFFFF", surface: "#FFFFFF", ink: "#171717", muted: "#5C5C5C",
          action: "#98251F", "action-hover": "#7D201A", fire: "#E56A16",
          primary: "#FFC400", "primary-hover": "#E6AD00", "on-primary": "#171717", "primary-border": "#966000",
          gold: "#FFC400", "gold-ink": "#98251F", border: "#E5E5E5", subtle: "#F5F5F5",
          "control-border": "#808080", success: "#247044", danger: "#B42318", info: "#275F83",
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

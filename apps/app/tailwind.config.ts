import baseConfig from "@v1/ui/tailwind.config";
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [baseConfig],
  theme: {
    extend: {
      colors: {
        // Theme-based backgrounds
        "theme-bg-page": "var(--bg-page)",
        "theme-bg-card": "var(--bg-card)",
        "theme-bg-hover": "var(--bg-hover)",
        "theme-bg-input": "var(--bg-input)",
        
        // Theme-based borders
        "theme-border-subtle": "var(--border-subtle)",
        "theme-border-strong": "var(--border-strong)",
        
        // Theme-based text
        "theme-text-primary": "var(--text-primary)",
        "theme-text-secondary": "var(--text-secondary)",
        "theme-text-tertiary": "var(--text-tertiary)",
        
        // Theme-based status
        "theme-status-confirmed-bg": "var(--status-confirmed-bg)",
        "theme-status-confirmed-text": "var(--status-confirmed-text)",
        "theme-status-draft-bg": "var(--status-draft-bg)",
        "theme-status-draft-text": "var(--status-draft-text)",
        "theme-status-cancelled-bg": "var(--status-cancelled-bg)",
        "theme-status-cancelled-text": "var(--status-cancelled-text)",
        "theme-status-pending-bg": "var(--status-pending-bg)",
        "theme-status-pending-text": "var(--status-pending-text)",
        "theme-status-in-progress-bg": "var(--status-in-progress-bg)",
        "theme-status-in-progress-text": "var(--status-in-progress-text)",
        
        // Theme-based budget status
        "theme-status-over-budget-bg": "var(--status-over-budget-bg)",
        "theme-status-over-budget-text": "var(--status-over-budget-text)",
        "theme-status-under-budget-bg": "var(--status-under-budget-bg)",
        "theme-status-under-budget-text": "var(--status-under-budget-text)",
        "theme-status-near-limit-bg": "var(--status-near-limit-bg)",
        "theme-status-near-limit-text": "var(--status-near-limit-text)",
        
        // Theme-based primary actions
        "theme-primary": "var(--primary-default)",
        "theme-primary-hover": "var(--primary-hover)",
        "theme-primary-active": "var(--primary-active)",
      },
    },
  },
} satisfies Config;

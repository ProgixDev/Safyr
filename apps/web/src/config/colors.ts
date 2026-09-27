/**
 * Safyr Design System — Color Tokens
 * All UI colors must reference these semantic tokens.
 * Never use raw hex values directly in components.
 */

export const colors = {
  // ── Surfaces ──────────────────────────────────────────
  surface: {
    base: "#1e293b", // Primary canvas (dark slate)
    raised: "#243447", // Elevated containers (+1 level)
    overlay: "#0f172a", // Transient layers / popovers
    card: "#1a2d45", // Card backgrounds
    border: "#2d4160", // Subtle card borders
  },

  // ── Text ──────────────────────────────────────────────
  text: {
    primary: "#f1f5f9", // Main content
    secondary: "#94a3b8", // Supporting text
    tertiary: "#64748b", // De-emphasized metadata
    inverse: "#0f172a", // Text on light surfaces
  },

  // ── Brand / Primary ───────────────────────────────────
  primary: {
    DEFAULT: "#357AB7", // Bleu acier (main brand accent)
    dim: "#295F8E", // Bleu acier fonce (hover / pressed)
    glow: "rgba(53,122,183,0.15)", // Glow / soft highlight
    muted: "rgba(53,122,183,0.08)", // Subtle fills
  },

  // ── Border & Divider ──────────────────────────────────
  border: {
    default: "#2d4160",
    subtle: "#1e3352",
    strong: "#3d5a7a",
    accent: "rgba(53,122,183,0.3)",
  },

  divider: {
    default: "#1e3352",
  },

  // ── State / Status ────────────────────────────────────
  status: {
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#357AB7",
  },

  // ── Elevation shadows ─────────────────────────────────
  elevation: {
    0: "none",
    1: "0 1px 3px rgba(0,0,0,0.3)",
    2: "0 4px 12px rgba(0,0,0,0.4)",
    3: "0 8px 24px rgba(0,0,0,0.5)",
    4: "0 16px 48px rgba(0,0,0,0.6)",
  },
} as const;

export type ColorToken = typeof colors;

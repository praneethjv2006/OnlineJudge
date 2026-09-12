import {
  EyeOff,
  Bug,
  Flame,
  Crosshair,
  Zap,
  Cpu,
  Puzzle,
  Terminal,
  GitFork,
  Gamepad2,
  HelpCircle,
} from "lucide-react";
import PropTypes from "prop-types";

export const CATEGORY_META = {
  "Blind Judge": {
    icon: EyeOff,
    color: "#8b5cf6", // Deep Violet
    glow: "rgba(139, 92, 246, 0.4)",
    bg: "rgba(139, 92, 246, 0.15)",
    short: "BLIND",
  },
  "Debug the Code": {
    icon: Bug,
    color: "#ef476f", // Neon Coral Red
    glow: "rgba(239, 71, 111, 0.4)",
    bg: "rgba(239, 71, 111, 0.15)",
    short: "DEBUG",
  },
  "Overflow Trap": {
    icon: Flame,
    color: "#ff7849", // Blazing Flame Orange
    glow: "rgba(255, 120, 73, 0.4)",
    bg: "rgba(255, 120, 73, 0.15)",
    short: "OVERFLOW",
  },
  "Precision Trap": {
    icon: Crosshair,
    color: "#00b4d8", // Precision Cyan
    glow: "rgba(0, 180, 216, 0.4)",
    bg: "rgba(0, 180, 216, 0.15)",
    short: "PRECISION",
  },
  "Fix the Performance": {
    icon: Zap,
    color: "#ffd166", // Cyber Gold Amber
    glow: "rgba(255, 209, 102, 0.4)",
    bg: "rgba(255, 209, 102, 0.15)",
    short: "TLE FIX",
  },
  "Memory Overflow": {
    icon: Cpu,
    color: "#06d6a0", // Memory Emerald Mint
    glow: "rgba(6, 214, 160, 0.4)",
    bg: "rgba(6, 214, 160, 0.15)",
    short: "MEMORY",
  },
  "Fill the Missing Part": {
    icon: Puzzle,
    color: "#38bdf8", // Electric Sky Blue
    glow: "rgba(56, 189, 248, 0.4)",
    bg: "rgba(56, 189, 248, 0.15)",
    short: "FILL IN",
  },
  "Predict the Output": {
    icon: Terminal,
    color: "#10b981", // Matrix Green Terminal
    glow: "rgba(16, 185, 129, 0.4)",
    bg: "rgba(16, 185, 129, 0.15)",
    short: "PREDICT",
  },
  "Choose the Approach": {
    icon: GitFork,
    color: "#a855f7", // Strategic Magenta Purple
    glow: "rgba(168, 85, 247, 0.4)",
    bg: "rgba(168, 85, 247, 0.15)",
    short: "STRATEGY",
  },
  "Interactive Logic": {
    icon: Gamepad2,
    color: "#f43f5e", // Rose Arcade Gamepad
    glow: "rgba(244, 63, 94, 0.4)",
    bg: "rgba(244, 63, 94, 0.15)",
    short: "INTERACTIVE",
  },
};

export default function CategoryIcon({ category, size = 18, className = "", style = {} }) {
  const meta = CATEGORY_META[category];
  const IconComponent = meta?.icon || HelpCircle;
  return (
    <IconComponent
      size={size}
      className={className}
      style={{
        color: meta?.color || "var(--accent)",
        flexShrink: 0,
        filter: meta?.glow ? `drop-shadow(0 0 6px ${meta.glow})` : undefined,
        ...style,
      }}
    />
  );
}

CategoryIcon.propTypes = {
  category: PropTypes.string,
  size: PropTypes.number,
  className: PropTypes.string,
  style: PropTypes.object,
};

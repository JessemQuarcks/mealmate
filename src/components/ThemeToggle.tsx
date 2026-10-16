"use client";
import React from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "@/app/ThemeProvider";

/** Sun/moon toggle for light/dark mode. */
const ThemeToggle: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={`grid h-10 w-10 place-items-center rounded-full border border-line bg-surface/60 text-fg backdrop-blur transition-colors hover:text-brand ${className}`}
    >
      {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
    </button>
  );
};

export default ThemeToggle;

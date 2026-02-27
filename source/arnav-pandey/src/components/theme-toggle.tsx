import React, { useEffect, useState } from "react";

export default function ThemeToggle(): JSX.Element {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return document.documentElement.classList.contains('dark');
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch (e) {
      // ignore
    }
  }, [isDark]);

  return (
    <button
      aria-label="Toggle color theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setIsDark((s) => !s)}
      className="rounded border px-2 py-1 text-sm"
    >
      {isDark ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}

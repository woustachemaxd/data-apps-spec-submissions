import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolved: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "system",
    setTheme: () => { },
    resolved: "light",
});

function getSystemTheme(): "light" | "dark" {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        const stored = localStorage.getItem("snowcone-theme");
        return (stored as Theme) ?? "system";
    });

    const resolved = theme === "system" ? getSystemTheme() : theme;

    const setTheme = (t: Theme) => {
        setThemeState(t);
        localStorage.setItem("snowcone-theme", t);
    };

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle("dark", resolved === "dark");
    }, [resolved]);

    useEffect(() => {
        if (theme !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => setThemeState("system");
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

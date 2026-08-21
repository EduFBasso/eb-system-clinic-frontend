// frontend/src/contexts/ThemeContext.tsx
//
// Persistência de tema por profissional via backend:
//   - No login, o objeto `loggedProfessional` já vem com `ui_theme` do servidor.
//   - setTheme() aplica imediatamente no DOM, atualiza loggedProfessional no
//     localStorage e envia PATCH /register/professionals/me/ de forma assíncrona.
//   - Todos os dispositivos do mesmo profissional ficam sincronizados no próximo login.

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { apiFetch } from '../utils/apiFetch';
import { getAccessToken } from '../utils/auth/session';

export type AppTheme = 'blue' | 'green' | 'pink';

const VALID_THEMES: AppTheme[] = ['blue', 'green', 'pink'];
const DEFAULT_THEME: AppTheme = 'blue';
const PROFESSIONAL_THEMES_KEY = 'professionalThemes';

const THEME_META_COLOR: Record<AppTheme, string> = {
    blue: '#004aad',
    green: '#15803d',
    pink: '#be185d',
};

function applyThemeMetaColor(theme: AppTheme) {
    if (typeof document === 'undefined') return;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute('content', THEME_META_COLOR[theme]);
        return;
    }
    const created = document.createElement('meta');
    created.setAttribute('name', 'theme-color');
    created.setAttribute('content', THEME_META_COLOR[theme]);
    document.head.appendChild(created);
}

function applyThemeToDom(theme: AppTheme) {
    document.documentElement.setAttribute('data-theme', theme);
    applyThemeMetaColor(theme);
}

function readThemeFromStorage(): AppTheme {
    try {
        const raw = localStorage.getItem('loggedProfessional');
        if (!raw) return DEFAULT_THEME;
        const prof = JSON.parse(raw) as { id?: number; ui_theme?: string };
        const savedThemes = JSON.parse(
            localStorage.getItem(PROFESSIONAL_THEMES_KEY) || '{}',
        ) as Record<string, string>;
        const savedTheme = prof.id ? savedThemes[String(prof.id)] : undefined;
        if (savedTheme && (VALID_THEMES as string[]).includes(savedTheme)) {
            return savedTheme as AppTheme;
        }
        if (
            prof.ui_theme &&
            (VALID_THEMES as string[]).includes(prof.ui_theme)
        ) {
            return prof.ui_theme as AppTheme;
        }
    } catch {
        /* noop */
    }
    return DEFAULT_THEME;
}

/** Salva ui_theme no objeto loggedProfessional em cache (sem network). */
function patchStoredTheme(theme: AppTheme) {
    try {
        const raw = localStorage.getItem('loggedProfessional');
        if (!raw) return;
        const prof = JSON.parse(raw) as Record<string, unknown>;
        const savedThemes = JSON.parse(
            localStorage.getItem(PROFESSIONAL_THEMES_KEY) || '{}',
        ) as Record<string, string>;
        prof.ui_theme = theme;
        if (prof.id != null) savedThemes[String(prof.id)] = theme;
        localStorage.setItem('loggedProfessional', JSON.stringify(prof));
        localStorage.setItem(
            PROFESSIONAL_THEMES_KEY,
            JSON.stringify(savedThemes),
        );
    } catch {
        /* noop */
    }
}

/** Envia PATCH /register/professionals/me/ { ui_theme } de forma silenciosa. */
async function persistThemeToBackend(theme: AppTheme) {
    const token = getAccessToken();
    if (!token) return;
    try {
        const updated = await apiFetch('/register/professionals/me/', {
            method: 'PATCH',
            body: { ui_theme: theme },
        });
        if (updated && typeof updated === 'object') {
            localStorage.setItem('loggedProfessional', JSON.stringify(updated));
        }
    } catch {
        // Silencioso: falha de rede não deve bloquear a UI
    }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface ThemeContextValue {
    theme: AppTheme;
    setTheme: (theme: AppTheme) => void;
}

const ThemeContextStrict = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<AppTheme>(() => {
        const loaded = readThemeFromStorage();
        applyThemeToDom(loaded);
        return loaded;
    });

    // Sincroniza quando login/logout ou outra aba atualiza o localStorage
    useEffect(() => {
        const sync = () => {
            const loaded = readThemeFromStorage();
            setThemeState(loaded);
            applyThemeToDom(loaded);
        };

        window.addEventListener('auth:login', sync);
        window.addEventListener('auth:logout', sync);
        window.addEventListener('storage', sync);

        return () => {
            window.removeEventListener('auth:login', sync);
            window.removeEventListener('auth:logout', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    const setTheme = useCallback((newTheme: AppTheme) => {
        setThemeState(newTheme);
        applyThemeToDom(newTheme);
        patchStoredTheme(newTheme);
        void persistThemeToBackend(newTheme);
    }, []);

    return (
        <ThemeContextStrict.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContextStrict.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContextStrict);
    if (!ctx) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return ctx;
}

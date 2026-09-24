const CLINIC_ROOT_DOMAINS = ['clinic.eb.com', 'clinic.eb.localhost'];

// Diretriz 1: a query string `?tenant=` é um fallback provisório enquanto o
// projeto não possui domínio/subdomínio próprio contratado. O deploy atual
// na Vercel usa uma única URL para todos os tenants Clinic
// (ex.: eb-system-clinic-frontend.vercel.app/?tenant=consultorio-podologia).
const TENANT_QUERY_PARAM = 'tenant';
const TENANT_SESSION_STORAGE_KEY = 'clinic_tenant_slug';
const TENANT_LOCAL_STORAGE_KEY = 'clinic_tenant_slug';
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,138}[a-z0-9])?$/;

function isValidSlug(
    candidate: string | null | undefined,
): candidate is string {
    return !!candidate && SLUG_PATTERN.test(candidate);
}

function readSlugFromQueryString(): string | null {
    const raw = new URLSearchParams(window.location.search).get(
        TENANT_QUERY_PARAM,
    );
    const candidate = raw?.trim().toLowerCase() ?? null;
    return isValidSlug(candidate) ? candidate : null;
}

function readSlugFromSessionStorage(): string | null {
    try {
        const stored = window.sessionStorage.getItem(
            TENANT_SESSION_STORAGE_KEY,
        );
        return isValidSlug(stored) ? stored : null;
    } catch {
        // sessionStorage pode estar indisponível (ex.: modo privado restrito).
        return null;
    }
}

function readSlugFromLocalStorage(): string | null {
    try {
        const stored = window.localStorage.getItem(TENANT_LOCAL_STORAGE_KEY);
        return isValidSlug(stored) ? stored : null;
    } catch {
        return null;
    }
}

function persistSlugInSessionStorage(slug: string): void {
    try {
        window.sessionStorage.setItem(TENANT_SESSION_STORAGE_KEY, slug);
    } catch {
        // Falha silenciosa: pior caso é reler o slug da URL na próxima navegação.
    }
}

function persistSlug(slug: string): void {
    persistSlugInSessionStorage(slug);
    try {
        window.localStorage.setItem(TENANT_LOCAL_STORAGE_KEY, slug);
    } catch {
        // O sessionStorage continua disponível como fallback de sessão.
    }
}

/**
 * O hostname seleciona a empresa; as capabilities retornadas pelo backend
 * selecionam a especialidade dentro do frontend Clinic compartilhado.
 *
 * Diretriz 1: hostname/subdomínio é a fonte principal do tenant_slug. Só se
 * nenhum subdomínio reconhecido for encontrado é que caímos no fallback de
 * `?tenant=` (persistido nos storages do navegador para sobreviver a
 * navegações internas do SPA, logout e reabertura do PWA).
 * Diretriz 4: hostname desconhecido sem nenhum fallback disponível bloqueia
 * o acesso — nunca assumir um tenant silenciosamente em produção.
 */
export function resolveClinicTenantSlug(): string | null {
    const hostname = window.location.hostname.toLowerCase();
    const configuredSlug = import.meta.env.VITE_CLINIC_TENANT_SLUG;

    // The free Vercel domain cannot create tenant subdomains, so support stable
    // tenant links such as /?tenant=consultorio-podologia.
    if (hostname.endsWith('.vercel.app')) {
        const querySlug = new URLSearchParams(window.location.search)
            .get('tenant')
            ?.trim();
        return querySlug || configuredSlug?.trim() || null;
    }

    const rootDomain = CLINIC_ROOT_DOMAINS.find(
        root => hostname === root || hostname.endsWith(`.${root}`),
    );

    if (rootDomain && hostname !== rootDomain) {
        const slug = hostname.slice(0, -(rootDomain.length + 1));
        if (slug && !slug.includes('.')) {
            persistSlug(slug);
            return slug;
        }
        return null;
    }

    // Permite desenvolvimento em http://localhost:5173 sem criar um tenant
    // silencioso em produção; a variável deve ser definida explicitamente.
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        if (configuredSlug && isValidSlug(configuredSlug.trim())) {
            const slug = configuredSlug.trim();
            persistSlug(slug);
            return slug;
        }
    }

    // Fallback provisório (diretriz 1): sem domínio próprio, lê `?tenant=`
    // da URL e persiste para as próximas navegações do SPA.
    const slugFromQuery = readSlugFromQueryString();
    if (slugFromQuery) {
        persistSlug(slugFromQuery);
        return slugFromQuery;
    }

    const slugFromSession = readSlugFromSessionStorage();
    if (slugFromSession) {
        return slugFromSession;
    }

    const slugFromLocal = readSlugFromLocalStorage();
    if (slugFromLocal) {
        persistSlugInSessionStorage(slugFromLocal);
        return slugFromLocal;
    }

    // Diretriz 4: hostname desconhecido e sem fallback disponível — bloqueia.
    return null;
}

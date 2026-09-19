const CLINIC_ROOT_DOMAINS = ['clinic.eb.com', 'clinic.eb.localhost'];

/**
 * O hostname seleciona a empresa; as capabilities retornadas pelo backend
 * selecionam a especialidade dentro do frontend Clinic compartilhado.
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
        return slug && !slug.includes('.') ? slug : null;
    }

    // Permite desenvolvimento em http://localhost:5173 sem criar um tenant
    // silencioso em produção; a variável deve ser definida explicitamente.
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return configuredSlug?.trim() || null;
    }

    return null;
}

const CLINIC_ROOT_DOMAINS = ['clinic.eb.com', 'clinic.eb.localhost'];

/**
 * O hostname seleciona a empresa; as capabilities retornadas pelo backend
 * selecionam a especialidade dentro do frontend Clinic compartilhado.
 */
export function resolveClinicTenantSlug(): string | null {
    const hostname = window.location.hostname.toLowerCase();
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
        const configuredSlug = import.meta.env.VITE_CLINIC_TENANT_SLUG;
        return configuredSlug?.trim() || null;
    }

    return null;
}
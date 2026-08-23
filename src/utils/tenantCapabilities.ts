export type TenantCapabilities = Record<string, unknown>;

export function hasOdontoCapability(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    const capabilities = value as TenantCapabilities;
    if (capabilities.odonto === true) return true;
    const modules = capabilities.modules;
    return (
        !!modules &&
        typeof modules === 'object' &&
        (modules as TenantCapabilities).odonto === true
    );
}

export function hasPodologiaCapability(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    const capabilities = value as TenantCapabilities;
    if (capabilities.podologia === true) return true;
    const modules = capabilities.modules;
    return (
        !!modules &&
        typeof modules === 'object' &&
        (modules as TenantCapabilities).podologia === true
    );
}

export function readLoggedProfessionalCapabilities(): TenantCapabilities {
    try {
        const stored = localStorage.getItem('loggedProfessional');
        if (!stored) return {};
        const professional = JSON.parse(stored) as {
            capabilities?: unknown;
        };
        return professional.capabilities &&
            typeof professional.capabilities === 'object'
            ? (professional.capabilities as TenantCapabilities)
            : {};
    } catch {
        return {};
    }
}

// src/types/models.ts
// Dados comerciais (endereço, CNPJ) e políticas Odonto pertencem ao tenant,
// não ao profissional — ver docs/plano-migracao-identidade-profissional-para-tenant.md
export interface ClinicTenantProfile {
    id?: number;
    name?: string;
    trade_name?: string;
    slug?: string;
    zip_code?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    complement?: string;
    cnpj?: string;
    lock_odonto_plan_after_print?: boolean;
    odonto_quote_validity_days?: number;
}

export interface Professional {
    id: number;
    first_name: string;
    last_name: string;
    display_name?: string;
    email: string;
    phone?: string;
    cpf?: string;
    specialty?: string;
    register_number?: string;
    is_active?: boolean;
    is_superuser?: boolean;
    is_staff?: boolean;
    can_manage_professionals?: boolean;
    created_at?: string;
    deactivated_at?: string | null;
    deactivation_reason?: string | null;
    ui_theme?: 'blue' | 'green' | 'pink';
    tenant_id?: number;
    tenant_slug?: string;
    ecosystem?: 'clinic' | 'bakery';
    role?: string;
    capabilities?: Record<string, unknown>;
    tenant?: ClinicTenantProfile;
}

export interface Client {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    // outros campos...
}

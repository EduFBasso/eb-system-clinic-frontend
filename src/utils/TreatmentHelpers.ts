// Global clinical treatment types and pure utilities.
// Shared by TreatmentWorkspacePage and all specialized clinical workspaces.

import { parseAmount, formatBRLCurrency, toInputAmount } from './currency';
import { getNow } from './now';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DentalContext = {
    scope: 'tooth' | 'arch' | 'full';
    tooth_number: number | null;
    tooth_surface: string;
    arcade_arch: 'superior' | 'inferior' | null;
    observations?: string;
};

export type PodologyScope =
    | 'pe_esquerdo'
    | 'pe_direito'
    | 'mao_esquerda'
    | 'mao_direita'
    | 'geral';

export type PodologyContext = {
    scope: PodologyScope;
    location_number: number | null;
};

export type PlanListItem = {
    id: number;
    name?: string;
    status: 'pending' | 'completed' | 'archived' | 'cancelled';
    notes?: string;
    is_printed?: boolean;
    printed_at?: string;
    created_at?: string;
    updated_at?: string;
    completed_items?: number;
    payment_condition?: PaymentCondition;
    installments_count?: number;
    first_due_date?: string | null;
    plan_total?: number | string | null;
};

export type PaymentCondition = 'avista' | 'aprazo';

export type TreatmentItem = {
    id: number;
    plan: number;
    kind: 'service' | 'product';
    service: number | null;
    service_name?: string | null;
    product: number | null;
    custom_name: string;
    status: 'pending' | 'completed' | 'canceled';
    patient_price: number | string | null;
    started_at: string | null;
    completed_at: string | null;
    notes: string;
    is_active: boolean;
    external_item_id: number | null;
    parent_item: number | null;
    dental_context?: DentalContext | null;
    podology_context?: PodologyContext | null;
    created_at?: string;
};

/** Item from the core Service catalog used for autocomplete and auto-fill. */
export type CatalogServiceItem = {
    id: number;
    name: string;
    base_price: number | string | null;
    description?: string;
    default_notes?: string;
    treatment_scopes: string[];
};

export type ProductRow = {
    name: string;
    value: string;
    notes: string;
};

/** Item from the core Product catalog. */
export type CatalogProductItem = {
    id?: number;
    name: string;
    price: number | string | null;
    description?: string;
};

export type ItemGroup = {
    key: string;
    label: string;
    items: TreatmentItem[];
};

// ─── Pure utilities ───────────────────────────────────────────────────────────

export function asList<T>(payload: unknown): T[] {
    if (Array.isArray(payload)) return payload as T[];
    if (
        payload &&
        typeof payload === 'object' &&
        Array.isArray((payload as { results?: unknown[] }).results)
    ) {
        return (payload as { results: T[] }).results;
    }
    return [];
}

export function parseDateLocal(dateIso: string): Date | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateIso);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(dateIso?: string | null): string {
    if (!dateIso) return '-';
    const d = parseDateLocal(dateIso);
    if (!d) return '-';
    return d.toLocaleDateString('pt-BR');
}

export function formatDateShort(dateIso?: string | null): string {
    if (!dateIso) return '-';
    const d = parseDateLocal(dateIso);
    if (!d) return '-';
    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
    });
}

export function formatMoney(value?: number | string | null): string {
    if (value == null) return '-';
    const numeric = typeof value === 'string' ? parseAmount(value) : value;
    return formatBRLCurrency(numeric);
}

export function eventDateISO(item: TreatmentItem): string | null {
    return item.completed_at ?? item.started_at ?? null;
}

export function isItemCompleted(item: TreatmentItem): boolean {
    return item.status === 'completed' || !!item.completed_at;
}

/** Sums patient_price of leaf items (services without children + all products) — used for plan total. */
export function computePlanTotal(items: TreatmentItem[]): number {
    const containerIds = new Set(
        items.map(i => i.parent_item).filter((id): id is number => id != null),
    );
    return items
        .filter(i => i.is_active && !containerIds.has(i.id))
        .reduce((acc, i) => acc + Number(i.patient_price ?? 0), 0);
}

/** Returns today in YYYY-MM-DD using local timezone (avoids UTC-shift at night). */
export function todayISODate(): string {
    const d = getNow();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Fallback label for a plan when name is empty. */
export function planDisplayName(plan: PlanListItem): string {
    if (plan.name?.trim()) return plan.name.trim();
    if (plan.created_at)
        return `Plano de Tratamento — ${formatDate(plan.created_at.slice(0, 10))}`;
    return `Plano #${plan.id}`;
}

/** Default name suggestion for the creation modal. */
export function defaultPlanName(): string {
    return `Plano de Tratamento — ${formatDate(todayISODate())}`;
}

export function normalizeMoneyInput(value: string): string {
    const parsed = parseAmount(value);
    if (parsed == null) return value;
    return toInputAmount(parsed.toFixed(2));
}

export function normalizeSearchText(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

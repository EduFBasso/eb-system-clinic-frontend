// Types and pure helpers shared by OdontoArcadePage and its sub-components.
// Keep this file free of React imports and side-effects.

import {
    parseAmount,
    formatBRLCurrency,
    toInputAmount,
} from '../utils/currency';
import { getNow } from '../utils/now';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanListItem = {
    id: number;
    name?: string;
    status: 'pending' | 'completed' | 'archived' | 'cancelled';
    notes?: string;
    is_printed?: boolean;
    printed_at?: string;
    created_at?: string;
    updated_at?: string;
    pending_items?: number;
    completed_items?: number;
    payment_condition?: PaymentCondition;
    installments_count?: number;
    first_due_date?: string | null;
    plan_total?: number | string | null;
};

export type PaymentCondition = 'avista' | 'aprazo';

/** Represents a tooth slot in the visual grid using FDI notation. */
export type ToothItem = {
    /** FDI international number — used as unique identifier throughout the UI. */
    international_number: number;
    sequence: number;
};

export type DentalContext = {
    scope: 'tooth' | 'arch' | 'full';
    tooth_number: number | null;
    tooth_surface: string;
    arcade_arch: 'superior' | 'inferior' | null;
    observations?: string;
};

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
    dental_context: DentalContext | null;
    created_at?: string;
};

export type ServiceFlowType = 'tooth' | 'arch' | 'other';

/** Item from the core Service catalog used for autocomplete and auto-fill. */
export type CatalogServiceItem = {
    id: number;
    name: string;
    base_price: number | string | null;
    description?: string;
    default_notes?: string;
};

export type ServiceRow = {
    toothNumber: number | null;
    toothSurface: string;
    scope: ServiceFlowType;
    arcadeArch: 'superior' | 'inferior' | 'AMBAS' | null;
    treatment: string;
    /** ID of the linked Service from the core catalog, or null for custom entry. */
    serviceId: number | null;
    value: string;
    notes: string;
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

// ─── Constants ────────────────────────────────────────────────────────────────

export const INTERNATIONAL_NUMBERS = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46,
    45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
];

/** Static ordered teeth grid (FDI notation) — shared by the workspace and service modal. */
export const ORDERED_TEETH: ToothItem[] = INTERNATIONAL_NUMBERS.map(
    (fdi, index) => ({
        international_number: fdi,
        sequence: index + 1,
    }),
);

/** FDI face codes aligned with backend DentalProcedureContext.ToothSurface. */
export const SURFACE_OPTIONS: Array<{ value: string; label: string }> = [
    { value: '', label: 'Opcional' },
    { value: 'O', label: 'Oclusal' },
    { value: 'V', label: 'Vestibular' },
    { value: 'L', label: 'Lingual / Palatino' },
    { value: 'M', label: 'Mesial' },
    { value: 'D', label: 'Distal' },
    { value: 'I', label: 'Incisal' },
    { value: 'M,O', label: 'Mesio-oclusal' },
    { value: 'D,O', label: 'Disto-oclusal' },
    { value: 'V,O', label: 'Vestibulo-oclusal' },
    { value: 'L,O', label: 'Palatino-oclusal' },
    { value: 'M,D,O', label: 'Mesio-disto-oclusal' },
];

/** Maps to arcade_arch field values. 'AMBAS' creates two items in the service flow. */
export const ARCH_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'superior', label: 'Superior' },
    { value: 'inferior', label: 'Inferior' },
    { value: 'AMBAS', label: 'Superior e Inferior' },
];

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

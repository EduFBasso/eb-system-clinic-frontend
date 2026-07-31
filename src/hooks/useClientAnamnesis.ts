import { useEffect, useState } from 'react';
import { API_BASE } from '../config/api';
import { useAnamnesisFields } from './useAnamnesisFields';
import type { AnamnesisResponse } from '../types/AnamnesisTypes';
import { getAccessToken } from '../utils/auth/session';

type AnamnesisFieldLite = ReturnType<
    typeof useAnamnesisFields
>['fields'][number];

function buildFieldGraph(fields: AnamnesisFieldLite[]) {
    const fieldById = new Map(fields.map(field => [field.id, field]));
    const childrenByParent = new Map<number, number[]>();

    fields.forEach(field => {
        if (!field.depends_on) return;
        const children = childrenByParent.get(field.depends_on) ?? [];
        children.push(field.id);
        childrenByParent.set(field.depends_on, children);
    });

    return { fieldById, childrenByParent };
}

function isInlineOtherDetailField(
    field: AnamnesisFieldLite,
    fieldById: Map<number, AnamnesisFieldLite>,
) {
    if (!field.depends_on || field.field_type !== 'text') return false;
    const parent = fieldById.get(field.depends_on);
    return (
        !!parent &&
        parent.selection_mode === 'multiple' &&
        field.show_when_value === 'Outros'
    );
}

function mergeOtherDetailValue(parentValue: string, detailValue: string) {
    const parts = (parentValue || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
        .filter(item => item !== 'Outros' && !item.startsWith('Outros:'));

    const detail = (detailValue || '').trim();
    if (detail) {
        parts.push(`Outros: ${detail}`);
    }

    return parts.join(', ');
}

function normalizeOtherDetailValues(
    values: Record<number, string>,
    fields: AnamnesisFieldLite[],
) {
    if (!fields.length) return values;

    const fieldById = new Map(fields.map(field => [field.id, field]));
    const next = { ...values };

    fields.forEach(field => {
        if (!isInlineOtherDetailField(field, fieldById)) return;
        const parent = fieldById.get(field.depends_on!);
        if (!parent) return;

        const detailValue = next[field.id];
        if (!detailValue) {
            delete next[field.id];
            return;
        }

        next[parent.id] = mergeOtherDetailValue(
            next[parent.id] ?? '',
            detailValue,
        );
        delete next[field.id];
    });

    return next;
}

function isFieldVisible(
    fieldId: number,
    values: Record<number, string>,
    fieldById: Map<number, AnamnesisFieldLite>,
): boolean {
    const field = fieldById.get(fieldId);
    if (!field) return false;
    if (!field.depends_on) return true;

    const parent = fieldById.get(field.depends_on);
    if (!parent || !isFieldVisible(parent.id, values, fieldById)) return false;

    const parentValue = values[parent.id] ?? '';
    return field.show_when_value
        ? parentValue === field.show_when_value
        : parentValue !== '';
}

function pruneHiddenValues(
    values: Record<number, string>,
    fields: AnamnesisFieldLite[],
): Record<number, string> {
    const { fieldById, childrenByParent } = buildFieldGraph(fields);
    const next = { ...values };

    function clearDescendants(parentId: number) {
        const childIds = childrenByParent.get(parentId) ?? [];
        childIds.forEach(childId => {
            if (!isFieldVisible(childId, next, fieldById)) {
                delete next[childId];
            }
            clearDescendants(childId);
        });
    }

    fields.forEach(field => {
        if (!isFieldVisible(field.id, next, fieldById)) {
            delete next[field.id];
        }
    });

    fields.forEach(field => {
        if (!field.depends_on) {
            clearDescendants(field.id);
        }
    });

    return next;
}

export interface ClientAnamnesisHook {
    anamnesisFields: ReturnType<typeof useAnamnesisFields>['fields'];
    anamnesisLoading: boolean;
    anamnesisValues: Record<number, string>;
    setAnamnesisValues: React.Dispatch<
        React.SetStateAction<Record<number, string>>
    >;
    handleAnamnesisChange: (fieldId: number, value: string) => void;
    saveAnamnesis: (clientId: number, token: string) => Promise<void>;
}

export function useClientAnamnesis(clientId?: number): ClientAnamnesisHook {
    const { fields: anamnesisFields, loading: anamnesisLoading } =
        useAnamnesisFields();
    const [anamnesisValues, setAnamnesisValues] = useState<
        Record<number, string>
    >({});

    // Load existing responses when editing a client
    useEffect(() => {
        if (!clientId) {
            setAnamnesisValues({});
            return;
        }
        const token = getAccessToken();
        if (!token) return;
        fetch(`${API_BASE}/anamnesis/responses/?client=${clientId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => (r.ok ? r.json() : Promise.resolve([])))
            .then((data: AnamnesisResponse[]) => {
                const map: Record<number, string> = {};
                data.forEach(r => {
                    if (r.field !== null) map[r.field] = r.value;
                });
                setAnamnesisValues(map);
            })
            .catch(() => {
                /* silent */
            });
    }, [clientId]);

    useEffect(() => {
        if (!anamnesisFields.length) return;
        setAnamnesisValues(prev =>
            normalizeOtherDetailValues(prev, anamnesisFields),
        );
    }, [anamnesisFields]);

    function handleAnamnesisChange(fieldId: number, value: string) {
        setAnamnesisValues(prev => {
            const next = { ...prev, [fieldId]: value };

            return pruneHiddenValues(next, anamnesisFields);
        });
    }

    async function saveAnamnesis(
        clientId: number,
        token: string,
    ): Promise<void> {
        if (!anamnesisFields.length) return;

        const normalizedValues = normalizeOtherDetailValues(
            pruneHiddenValues(anamnesisValues, anamnesisFields),
            anamnesisFields,
        );
        setAnamnesisValues(normalizedValues);

        const fieldById = new Map(
            anamnesisFields.map(field => [field.id, field]),
        );

        const entries = anamnesisFields
            .filter(
                field =>
                    normalizedValues[field.id] !== undefined &&
                    !isInlineOtherDetailField(field, fieldById),
            )
            .map(field => ({
                field: field.id,
                value: normalizedValues[field.id] ?? '',
            }));

        await fetch(`${API_BASE}/anamnesis/responses/bulk_save/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ client: clientId, responses: entries }),
        });
    }

    return {
        anamnesisFields,
        anamnesisLoading,
        anamnesisValues,
        setAnamnesisValues,
        handleAnamnesisChange,
        saveAnamnesis,
    };
}

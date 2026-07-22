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
    anamnesisValues: Record<number, string>;
    setAnamnesisValues: React.Dispatch<
        React.SetStateAction<Record<number, string>>
    >;
    handleAnamnesisChange: (fieldId: number, value: string) => void;
    saveAnamnesis: (clientId: number, token: string) => Promise<void>;
}

export function useClientAnamnesis(clientId?: number): ClientAnamnesisHook {
    const { fields: anamnesisFields } = useAnamnesisFields();
    const [anamnesisValues, setAnamnesisValues] = useState<
        Record<number, string>
    >({});

    // Load existing responses when editing a client
    useEffect(() => {
        if (!clientId) return;
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
        const normalizedValues = pruneHiddenValues(
            anamnesisValues,
            anamnesisFields,
        );
        setAnamnesisValues(normalizedValues);

        const entries = anamnesisFields
            .filter(field => normalizedValues[field.id] !== undefined)
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
        anamnesisValues,
        setAnamnesisValues,
        handleAnamnesisChange,
        saveAnamnesis,
    };
}

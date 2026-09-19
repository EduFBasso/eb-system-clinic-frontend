import { useState } from 'react';
import { API_BASE } from '../../config/api';
import type { AnamnesePodologiaData, ClientData } from '../../types/ClientData';
import {
    resolveClinicSpecialty,
    type TenantCapabilities,
} from '../../utils/tenantCapabilities';
import {
    buildDefaultDentalAnamnesis,
    type DentalAnamnesisValues,
} from '../Odonto/DentalAnamnesisForm/dentalAnamnesisModel';
import { buildDefaultPodologia } from '../Podologia/ClientPodologiaSection/podologiaAnamnesisModel';

type SpecialtyState =
    | { kind: 'none' }
    | { kind: 'odonto'; values: DentalAnamnesisValues }
    | { kind: 'podologia'; values: AnamnesePodologiaData };

export type SpecialtyAnamnesisModel =
    | { kind: 'none' }
    | {
          kind: 'odonto';
          values: DentalAnamnesisValues;
          onChange: <K extends keyof DentalAnamnesisValues>(
              key: K,
              value: DentalAnamnesisValues[K],
          ) => void;
      }
    | {
          kind: 'podologia';
          values: AnamnesePodologiaData;
          onChange: <K extends keyof AnamnesePodologiaData>(
              key: K,
              value: AnamnesePodologiaData[K],
          ) => void;
      };

interface UseSpecialtyAnamnesisOptions {
    capabilities: TenantCapabilities;
    cliente?: Partial<ClientData>;
    enabled: boolean;
}

function buildSpecialtyState(
    capabilities: TenantCapabilities,
    cliente: Partial<ClientData> | undefined,
    enabled: boolean,
): SpecialtyState {
    if (!enabled) return { kind: 'none' };

    const specialty = resolveClinicSpecialty(capabilities);
    if (specialty === 'odonto') {
        return {
            kind: 'odonto',
            values: buildDefaultDentalAnamnesis(cliente),
        };
    }
    if (specialty === 'podologia') {
        return {
            kind: 'podologia',
            values: buildDefaultPodologia(cliente),
        };
    }
    return { kind: 'none' };
}

export function useSpecialtyAnamnesis({
    capabilities,
    cliente,
    enabled,
}: UseSpecialtyAnamnesisOptions) {
    const [state, setState] = useState<SpecialtyState>(() =>
        buildSpecialtyState(capabilities, cliente, enabled),
    );

    function handleDentalChange<K extends keyof DentalAnamnesisValues>(
        key: K,
        value: DentalAnamnesisValues[K],
    ) {
        setState(previous =>
            previous.kind === 'odonto'
                ? {
                      ...previous,
                      values: { ...previous.values, [key]: value },
                  }
                : previous,
        );
    }

    function handlePodologiaChange<K extends keyof AnamnesePodologiaData>(
        key: K,
        value: AnamnesePodologiaData[K],
    ) {
        setState(previous =>
            previous.kind === 'podologia'
                ? {
                      ...previous,
                      values: { ...previous.values, [key]: value },
                  }
                : previous,
        );
    }

    const model: SpecialtyAnamnesisModel =
        state.kind === 'odonto'
            ? {
                  kind: 'odonto',
                  values: state.values,
                  onChange: handleDentalChange,
              }
            : state.kind === 'podologia'
              ? {
                    kind: 'podologia',
                    values: state.values,
                    onChange: handlePodologiaChange,
                }
              : { kind: 'none' };

    function reset(nextCliente?: Partial<ClientData>): SpecialtyState {
        const nextState = buildSpecialtyState(
            capabilities,
            nextCliente,
            enabled,
        );
        setState(nextState);
        return nextState;
    }

    function getNestedPayload(): Record<string, unknown> {
        return state.kind === 'podologia'
            ? { anamnese_podologia: state.values }
            : {};
    }

    async function saveAfterClient(
        clientId: number,
        authToken: string,
    ): Promise<void> {
        if (state.kind !== 'odonto') return;

        const response = await fetch(
            `${API_BASE}/clinic/treatment/anamnesis/`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    client_id: clientId,
                    ...state.values,
                }),
            },
        );
        if (response.ok) return;

        let detail = 'Falha ao salvar anamnese odontológica.';
        try {
            const data = (await response.json()) as { detail?: unknown };
            if (typeof data.detail === 'string') detail = data.detail;
        } catch {
            // Keep the domain-specific fallback when the response is not JSON.
        }
        throw new Error(detail);
    }

    return {
        model,
        snapshot: state,
        reset,
        getNestedPayload,
        saveAfterClient,
    };
}

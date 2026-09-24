// Minimal telemetry utility with progressive enhancement.
// Default: log in dev; no network. Can be enabled via window.__telemetryEndpoint or env flag.
// Usage example: track({ type: 'appointment_cancel_clicked', payload: { id } })

export type TelemetryEvent =
    | {
          type: 'performance_span';
          payload: {
              name: string;
              ms: number;
              ok: boolean;
              status?: number;
              error?: string;
          };
      }
    // UI lifecycle
    | { type: 'modal_opened'; payload: { name: string } }
    | { type: 'modal_closed'; payload: { name: string } }
    // Weekly interactions
    | { type: 'weekly_day_selected'; payload: { iso: string } }
    // Appointments lifecycle
    | { type: 'appointment_cancel_clicked'; payload: { id: number } }
    | {
          type: 'appointment_cancel_succeeded';
          payload: { id: number; ms?: number };
      }
    | {
          type: 'appointment_cancel_failed';
          payload: { id: number; error?: string };
      }
    | {
          type: 'appointment_card_clicked';
          payload: {
              id: number;
              status: 'scheduled' | 'done' | 'canceled' | 'past';
          };
      }
    | {
          type: 'appointment_created';
          payload: { id?: number | null; client_id: number; start_at: string };
      }
    | {
          type: 'appointment_updated';
          payload: { id: number; start_at: string };
      };

type TelemetryConfig = {
    endpoint?: string; // if provided, events are sent via sendBeacon/fetch
    enabled?: boolean; // allow forcing enable even in prod
};

declare global {
    interface Window {
        __telemetryConfig?: TelemetryConfig;
        __clinicPerformanceDiagnostics?: boolean;
    }
}

function shouldSendNetwork(): string | undefined {
    try {
        const cfg = window.__telemetryConfig;
        if (cfg?.enabled && cfg.endpoint) return cfg.endpoint;
        const envEndpoint = import.meta.env.VITE_TELEMETRY_ENDPOINT;
        if (envEndpoint) return envEndpoint;
    } catch {
        /* noop */
    }
    return undefined;
}

function sendNetwork(endpoint: string, e: TelemetryEvent) {
    try {
        const payload = JSON.stringify({
            t: Date.now(),
            e,
            url: typeof location !== 'undefined' ? location.pathname : '',
            ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        });
        if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(endpoint, blob);
        } else {
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
                body: payload,
            }).catch(() => {});
        }
    } catch {
        /* noop */
    }
}

export function track(e: TelemetryEvent): void {
    const endpoint = shouldSendNetwork();
    if (endpoint) sendNetwork(endpoint, e);
    else if (import.meta.env.DEV) {
        try {
            console.debug('[telemetry]', e);
        } catch {
            /* noop */
        }
    }
}

function performanceDiagnosticsEnabled(): boolean {
    try {
        return Boolean(
            (typeof window !== 'undefined' &&
                window.__clinicPerformanceDiagnostics) ||
            (typeof import.meta !== 'undefined' && import.meta.env?.DEV),
        );
    } catch {
        return false;
    }
}

export function startPerformanceSpan(
    name: string,
): (result?: { ok?: boolean; status?: number; error?: string }) => void {
    const startedAt = performance.now();
    let finished = false;

    return (result = {}) => {
        if (finished) return;
        finished = true;
        const payload = {
            name,
            ms: Math.round(performance.now() - startedAt),
            ok: result.ok ?? true,
            ...(result.status === undefined ? {} : { status: result.status }),
            ...(result.error ? { error: result.error.slice(0, 120) } : {}),
        };
        track({ type: 'performance_span', payload });
        if (performanceDiagnosticsEnabled()) {
            console.debug('[clinic-performance]', payload);
        }
    };
}

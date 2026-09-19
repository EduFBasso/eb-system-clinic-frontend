// frontend\src\App.tsx

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import React, { useEffect, Suspense, lazy } from 'react';
import Home from '../src/pages/Home';
import { on } from './events/bus';
import { SystemMessageModal } from './components/SystemMessageModal/SystemMessageModal';
import ensureDeviceSession from './services/sessions';
import {
    hydrateAgendaSettings,
    resetAgendaSettings,
} from './utils/agendaSettings';
import { ThemeProvider } from './contexts/ThemeContext';
import { getAccessToken } from './utils/auth/session';

// Rotas secundárias com Lazy Loading para reduzir o bundle inicial
const LazyDesktopAgenda: React.ComponentType = lazy(async () => {
    try {
        return (await import('./pages/DesktopAgendaPage')) as unknown as {
            default: React.ComponentType;
        };
    } catch {
        return { default: () => null } as { default: React.ComponentType };
    }
});
const ClientFormPage = lazy(() => import('./pages/Clients/ClientFormPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ProductFormPage = lazy(() => import('./pages/Catalog/ProductFormPage'));
const TreatmentFormPage = lazy(
    () => import('./pages/Catalog/TreatmentFormPage'),
);
const ProductListPage = lazy(() => import('./pages/Catalog/ProductListPage'));
const TreatmentListPage = lazy(
    () => import('./pages/Catalog/TreatmentListPage'),
);
const ConsultaPage = lazy(() => import('./pages/ConsultaPage'));
const TreatmentWorkspacePage = lazy(
    () =>
        import('./components/Shared/TreatmentWorkspacePage/TreatmentWorkspacePage'),
);
const AnamnesisPublicPage = lazy(() => import('./pages/AnamnesisPublicPage'));

function App() {
    const [sysMsg, setSysMsg] = React.useState<{
        text: string;
        type: 'success' | 'error' | 'info' | 'warning';
        autoCloseMs?: number;
    } | null>(null);

    useEffect(() => {
        // Pre-warm device session once app loads if token exists
        try {
            const token = getAccessToken();
            if (token) {
                ensureDeviceSession().catch(() => {});
                hydrateAgendaSettings().catch(() => {});
            } else {
                resetAgendaSettings();
            }
        } catch {
            /* noop */
        }

        const handleLogin = () => {
            hydrateAgendaSettings(true).catch(() => {});
        };
        const handleLogout = () => {
            resetAgendaSettings();
        };

        const disposeLogin = on('auth:login', handleLogin);
        const disposeLogout = on('auth:logout', handleLogout);

        return () => {
            disposeLogin();
            disposeLogout();
        };
    }, []);

    useEffect(() => {
        const disposeSystemMessage = on('systemMessage', detail => {
            if (!detail?.text) return;
            setSysMsg({
                text: String(detail.text),
                type: detail.type || 'info',
                autoCloseMs: detail.autoCloseMs,
            });
        });

        return () => {
            disposeSystemMessage();
        };
    }, []);

    return (
        <ThemeProvider>
            <Router>
                <Suspense fallback={<div />}>
                    <Routes>
                        <Route path='/' element={<Home />} />
                        <Route
                            path='/clients/new'
                            element={<ClientFormPage />}
                        />
                        <Route
                            path='/clients/edit/:id'
                            element={<ClientFormPage />}
                        />
                        {/* AgendaPage removida: consolidamos em modais no Home */}
                        <Route path='/agenda' element={<Home />} />
                        <Route
                            path='/catalog/products/new'
                            element={<ProductFormPage />}
                        />
                        <Route
                            path='/catalog/products/:id'
                            element={<ProductFormPage />}
                        />
                        <Route
                            path='/catalog/services/new'
                            element={<TreatmentFormPage />}
                        />
                        <Route
                            path='/catalog/services/:id'
                            element={<TreatmentFormPage />}
                        />
                        <Route
                            path='/catalog/products'
                            element={<ProductListPage />}
                        />
                        <Route
                            path='/catalog/services'
                            element={<TreatmentListPage />}
                        />
                        <Route path='/admin' element={<AdminPage />} />
                        <Route path='/consulta' element={<ConsultaPage />} />
                        <Route
                            path='/anamnesis/public'
                            element={<AnamnesisPublicPage />}
                        />
                        <Route
                            path='/odonto/arcada/:clientId'
                            element={<TreatmentWorkspacePage />}
                        />
                        <Route
                            path='/treatment/plans/:clientId'
                            element={<TreatmentWorkspacePage />}
                        />
                        {/* Full-page scheduler for mobile */}
                        {/** Rota /schedule removida para unificar experiência via modais */}
                        {/* Rota /agenda/settings removida */}
                        {/* Desktop unified agenda page */}
                        <Route
                            path='/desktop'
                            element={<LazyDesktopAgenda />}
                        />
                    </Routes>
                </Suspense>
                <SystemMessageModal
                    open={!!sysMsg}
                    message={sysMsg?.text || null}
                    type={sysMsg?.type || 'info'}
                    onClose={() => setSysMsg(null)}
                    autoCloseMs={sysMsg?.autoCloseMs ?? 10000}
                />
            </Router>
        </ThemeProvider>
    );
}

export default App;

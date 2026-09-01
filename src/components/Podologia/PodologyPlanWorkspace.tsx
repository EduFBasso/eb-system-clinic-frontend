import React from 'react';
import { PodologyMemberGrid } from './PodologyMemberGrid';
import styles from './PodologyPlanWorkspace.module.css'; // Crie esse CSS se necessário

export default function PodologyPlanWorkspace({
    plan,
    client,
}: {
    plan: any;
    client: any;
}) {
    return (
        <div className={styles.planWorkspaceContainer}>
            <header className={styles.header}>
                <h1>Plano de Tratamento — Podologia</h1>
                <h2>
                    Paciente: {client?.first_name} {client?.last_name}
                </h2>
                <p>Plano #{plan?.id}</p>
            </header>

            {/* Seção Exclusiva da Anatomia dos Pés e Mãos */}
            <section className={styles.sectionCard}>
                <h2>Mapa dos Membros (Mãos e Pés)</h2>
                {/* Aqui entra o seu componente SVG interativo que responde ao toque */}
                <PodologyMemberGrid />
            </section>

            <section className={styles.sectionCard}>
                <h2>Procedimentos e Evolução Clínica</h2>
                <p>Lista de tratamentos específicos de podologia...</p>
            </section>
        </div>
    );
}

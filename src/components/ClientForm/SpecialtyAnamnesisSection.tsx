import { SmartSection } from '../SmartSection/SmartSection';
import { DentalAnamnesisForm } from '../Odonto/DentalAnamnesisForm/DentalAnamnesisForm';
import { ClientPodologiaSection } from '../Podologia/ClientPodologiaSection/ClientPodologiaSection';
import type { SpecialtyAnamnesisModel } from './useSpecialtyAnamnesis';

interface SpecialtyAnamnesisSectionProps {
    openSection: string | null;
    toggleSection: (id: string) => void;
    specialty: SpecialtyAnamnesisModel;
}

export function SpecialtyAnamnesisSection({
    openSection,
    toggleSection,
    specialty,
}: SpecialtyAnamnesisSectionProps) {
    return (
        <>
            {specialty.kind === 'odonto' && (
                <SmartSection
                    title='Anamnese Odontologia'
                    stickyWhenOpen
                    isOpen={openSection === 'odontologia'}
                    onToggle={() => toggleSection('odontologia')}
                >
                    <DentalAnamnesisForm
                        values={specialty.values}
                        onChange={specialty.onChange}
                    />
                </SmartSection>
            )}

            {specialty.kind === 'podologia' && (
                <SmartSection
                    title='Anamnese Podologia'
                    stickyWhenOpen
                    isOpen={openSection === 'podologia'}
                    onToggle={() => toggleSection('podologia')}
                >
                    <ClientPodologiaSection
                        values={specialty.values}
                        onChange={specialty.onChange}
                    />
                </SmartSection>
            )}
        </>
    );
}

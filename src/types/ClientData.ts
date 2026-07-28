export interface AnamneseBaseData {
    takes_medication: string;
    had_surgery: string;
    is_pregnant: boolean | null;
    pain_sensitivity: string;
    clinical_history: string;
    sport_activity: string;
}

export interface AnamnesePodologiaData {
    footwear_used: string;
    sock_used: string;
    plantar_view_left: string;
    plantar_view_right: string;
    dermatological_pathologies_left: string;
    dermatological_pathologies_right: string;
    nail_changes_left: string;
    nail_changes_right: string;
    deformities_left: string;
    deformities_right: string;
    sensitivity_test: string;
    other_procedures: string;
}

export interface ClientData {
    id?: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    profession: string;
    address: string;
    address_number?: string;
    address_complement?: string | null;
    date_of_birth?: string;
    neighborhood: string;
    city: string;
    state: string;
    postal_code: string;
    document_type?: 'cpf' | 'cnpj' | '';
    document_number?: string;
    rg?: string;
    sex?: string;
    marital_status?: string;
    nationality?: string;
    anamnese_base?: Partial<AnamneseBaseData> | null;
    anamnese_podologia?: Partial<AnamnesePodologiaData> | null;
}

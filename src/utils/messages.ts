// Helper to format BRL currency consistently
export function formatBRL(value: number): string {
    try {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
        }).format(value);
    } catch {
        // Fallback simple formatting
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }
}

export type ChargeItem = {
    id?: string;
    label: string;
    price: number; // unit price in BRL
    qty?: number; // defaults to 1
};

export interface BuildChargeMessageArgs {
    clientName?: string;
    professionalName?: string;
    professionalTitle?: string;
    addressLine?: string;
    appointmentWhenLine?: string; // e.g., "Hoje 14:00" ou data formatada
    items: ChargeItem[];
    notes?: string;
}

export function buildChargeMessage(args: BuildChargeMessageArgs): {
    text: string;
    total: number;
} {
    const {
        clientName,
        professionalName,
        professionalTitle,
        addressLine,
        appointmentWhenLine,
        items,
        notes,
    } = args;
    const safeItems = (items || []).filter(i => i && i.label);
    const lines: string[] = [];
    if (clientName) {
        lines.push(`Olá, ${clientName}!`);
    } else {
        lines.push('Olá!');
    }
    lines.push('Segue o resumo do atendimento:');
    if (appointmentWhenLine) {
        lines.push(`• Quando: ${appointmentWhenLine}`);
    }
    if (addressLine) {
        lines.push(`• Local: ${addressLine}`);
    }
    if (safeItems.length > 0) {
        lines.push('');
        lines.push('Itens:');
        for (const it of safeItems) {
            const qty = typeof it.qty === 'number' && it.qty > 0 ? it.qty : 1;
            const lineTotal = it.price * qty;
            const suffix = qty > 1 ? ` x${qty}` : '';
            lines.push(`- ${it.label}${suffix}: ${formatBRL(lineTotal)}`);
        }
    }
    const total = safeItems.reduce(
        (acc, it) => acc + (it.price || 0) * (it.qty || 1),
        0,
    );
    lines.push('');
    lines.push(`Total: ${formatBRL(total)}`);
    if (notes && notes.trim()) {
        lines.push('');
        lines.push(`Obs.: ${notes.trim()}`);
    }
    if (professionalName || professionalTitle) {
        lines.push('');
        const profLine = [professionalName, professionalTitle]
            .filter(Boolean)
            .join(' — ');
        if (profLine) lines.push(profLine);
    }
    const text = lines.join('\n');
    return { text, total };
}

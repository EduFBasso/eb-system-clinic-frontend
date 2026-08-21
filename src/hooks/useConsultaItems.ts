import type { SelectedItem, Service, Product } from '../types/consulta';

interface UseConsultaItemsParams {
    selectedItems: SelectedItem[];
    setSelectedItems: React.Dispatch<React.SetStateAction<SelectedItem[]>>;
}

interface UseConsultaItemsResult {
    addItem: (kind: 'service' | 'product', item: Service | Product) => void;
    removeItem: (key: string) => void;
    togglePaid: (key: string) => void;
    updatePaidAt: (key: string, date: string) => void;
    total: number;
}

export function useConsultaItems({
    selectedItems,
    setSelectedItems,
}: UseConsultaItemsParams): UseConsultaItemsResult {
    const todayISO = new Date().toISOString().slice(0, 10);

    function addItem(kind: 'service' | 'product', item: Service | Product) {
        const unit_price =
            kind === 'service'
                ? (item as Service).base_price
                : (item as Product).price;
        setSelectedItems(prev => {
            const key = `${kind}-${item.id}-${Date.now()}-${prev.length}`;
            return [
                ...prev,
                {
                    key,
                    kind,
                    id: item.id,
                    name: item.name,
                    unit_price,
                    quantity: 1,
                    paid: false,
                },
            ];
        });
    }

    function removeItem(key: string) {
        setSelectedItems(prev => prev.filter(i => i.key !== key));
    }

    function togglePaid(key: string) {
        const targetItem = selectedItems.find(i => i.key === key);
        if (targetItem?.paid) {
            const shouldUnmark = window.confirm(
                'Remover a marcacao de pago deste item?',
            );
            if (!shouldUnmark) return;
        }
        setSelectedItems(prev =>
            prev.map(i =>
                i.key === key
                    ? {
                          ...i,
                          paid: !i.paid,
                          paidAt: !i.paid ? todayISO : undefined,
                      }
                    : i,
            ),
        );
    }

    function updatePaidAt(key: string, date: string) {
        setSelectedItems(prev =>
            prev.map(i => (i.key === key ? { ...i, paidAt: date } : i)),
        );
    }

    const total = selectedItems.reduce((sum, i) => sum + i.unit_price, 0);

    return { addItem, removeItem, togglePaid, updatePaidAt, total };
}

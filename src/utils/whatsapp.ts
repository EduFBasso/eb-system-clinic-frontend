export type OpenWhatsAppResult = 'opened' | 'blocked';

export interface BuildWhatsAppUrlArgs {
    text?: string;
    phoneE164?: string;
}

export interface OpenWhatsAppArgs extends BuildWhatsAppUrlArgs {
    target?: '_blank' | '_self';
}

export function normalizePhoneDigits(
    phone?: string | null,
): string | undefined {
    if (!phone) return undefined;
    const digits = String(phone).replace(/\D+/g, '');
    if (!digits) return undefined;
    // E.164 max length is 15 digits.
    if (digits.length < 10 || digits.length > 15) return undefined;
    return digits;
}

export function buildWhatsAppUrl({
    text,
    phoneE164,
}: BuildWhatsAppUrlArgs): string {
    const normalizedPhone = normalizePhoneDigits(phoneE164);
    const encodedText = text ? encodeURIComponent(text) : undefined;

    if (normalizedPhone && encodedText) {
        return `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedText}`;
    }
    if (normalizedPhone) {
        return `https://api.whatsapp.com/send?phone=${normalizedPhone}`;
    }
    if (encodedText) {
        return `https://api.whatsapp.com/send?text=${encodedText}`;
    }
    return 'https://api.whatsapp.com/send';
}

export function openWhatsAppInNewTab({
    text,
    phoneE164,
    target = '_blank',
}: OpenWhatsAppArgs): OpenWhatsAppResult {
    const url = buildWhatsAppUrl({ text, phoneE164 });
    const opened = window.open(url, target, 'noopener,noreferrer');
    return opened ? 'opened' : 'blocked';
}

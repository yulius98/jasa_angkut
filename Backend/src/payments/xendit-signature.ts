import { timingSafeEqual } from 'node:crypto';

/**
 * Verifikasi webhook Xendit TIDAK pakai HMAC/signature seperti Midtrans --
 * Xendit cukup mengirim token polos di header `x-callback-token`, dan kita
 * membandingkannya dengan Webhook Verification Token yang kita simpan sendiri
 * (diambil dari dashboard Xendit > Settings > Webhooks).
 * https://docs.xendit.co/webhook/getting-started
 *
 * Perbandingannya sengaja pakai timingSafeEqual (bukan `===`), supaya waktu
 * eksekusinya tidak membocorkan informasi lewat timing attack -- `===` pada
 * string berhenti di karakter pertama yang beda, yang secara teori bisa dipakai
 * menebak token karakter demi karakter lewat pengukuran waktu respons berulang.
 */
export function verifyXenditCallbackToken(headerToken: string, configuredToken: string): boolean {
  const a = Buffer.from(headerToken ?? '');
  const b = Buffer.from(configuredToken);
  if (a.length !== b.length) return false; // panjang beda = pasti tidak cocok, aman dibocorkan
  return timingSafeEqual(a, b);
}

export type XenditMappedStatus = 'PAID' | 'FAILED' | null;

// Status Invoice API: PENDING, PAID, SETTLED, EXPIRED
export function mapXenditInvoiceStatus(status: string): XenditMappedStatus {
  switch (status) {
    case 'PAID':
    case 'SETTLED':
      return 'PAID';
    case 'EXPIRED':
      return 'FAILED';
    case 'PENDING':
    default:
      return null;
  }
}

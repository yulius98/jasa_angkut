import { PaymentProvider } from './dto/create-payment.dto.js';

/**
 * Mode metode pembayaran yang bisa dipilih admin. Menyatukan pilihan gateway
 * online + boleh/tidaknya pembayaran tunai (CASH) dalam satu setting:
 *
 * - MIDTRANS       : hanya online via Midtrans
 * - XENDIT         : hanya online via Xendit
 * - MIDTRANS_CASH  : Midtrans + tunai
 * - XENDIT_CASH    : Xendit + tunai
 * - CASH           : hanya tunai
 */
export enum PaymentGatewayMode {
  MIDTRANS = 'MIDTRANS',
  XENDIT = 'XENDIT',
  MIDTRANS_CASH = 'MIDTRANS_CASH',
  XENDIT_CASH = 'XENDIT_CASH',
  CASH = 'CASH',
}

export const PAYMENT_GATEWAY_MODES = Object.values(PaymentGatewayMode);

export function isPaymentGatewayMode(value: unknown): value is PaymentGatewayMode {
  return typeof value === 'string' && (PAYMENT_GATEWAY_MODES as string[]).includes(value);
}

/** Gateway online untuk sebuah mode, atau null kalau mode hanya CASH. */
export function gatewayForMode(mode: PaymentGatewayMode): PaymentProvider | null {
  switch (mode) {
    case PaymentGatewayMode.MIDTRANS:
    case PaymentGatewayMode.MIDTRANS_CASH:
      return PaymentProvider.MIDTRANS;
    case PaymentGatewayMode.XENDIT:
    case PaymentGatewayMode.XENDIT_CASH:
      return PaymentProvider.XENDIT;
    case PaymentGatewayMode.CASH:
    default:
      return null;
  }
}

/** Apakah pembayaran tunai diizinkan pada mode ini. */
export function cashEnabledForMode(mode: PaymentGatewayMode): boolean {
  return mode !== PaymentGatewayMode.MIDTRANS && mode !== PaymentGatewayMode.XENDIT;
}

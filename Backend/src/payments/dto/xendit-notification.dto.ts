// Sama seperti MidtransNotificationBody -- sengaja tidak divalidasi class-validator
// karena field persisnya beda tiap jenis event webhook Xendit (invoice, fva_paid,
// dll), dan kita cuma mengambil yang benar-benar dipakai.
export interface XenditInvoiceNotificationBody {
  id: string;
  external_id: string;
  status: string;
  amount: number;
  paid_amount?: number;
  payment_method?: string;
}

/**
 * Webhook Payment Session (mode COMPONENTS). Xendit mengirim event
 * `payment_session.completed` atau `payment_session.expired`.
 * https://docs.xendit.co/apidocs/webhook-notification-sent-defined-webhook-url-updates-payment-session
 *
 * `data.reference_id` kita isi dengan orderNumber saat membuat sesi, jadi
 * dipakai untuk memetakan kembali ke Payment kita.
 */
export interface XenditSessionNotificationBody {
  /** Xendit mengirim `payment_session.completed` atau `payment_session.expired`. */
  event: string;
  business_id?: string;
  created?: string;
  data: {
    payment_session_id?: string;
    reference_id?: string;
    status?: string;
    amount?: number;
    payment_id?: string;
    payment_request_id?: string;
  };
}

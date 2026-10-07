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

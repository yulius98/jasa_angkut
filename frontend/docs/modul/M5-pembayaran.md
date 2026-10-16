# M5 — Pembayaran

**Tujuan:** admin memantau seluruh pembayaran dan mengonfirmasi pembayaran tunai (CASH)
yang masih PENDING.

**Status:** ✅ Selesai · **Bergantung pada:** M0, M1

---

## Endpoint Backend

| Method | Path | Query/Body | Keterangan |
|---|---|---|---|
| GET | `/payments` | `status?`, `method?`, `dateFrom?`, `dateTo?`, `page?`, `limit?` | `{ data, meta }` |
| PATCH | `/payments/:id/mark-paid` | – | hanya CASH berstatus PENDING |
| GET | `/payments/order/:orderId` | – | pembayaran per order |
| GET | `/payments/methods` | – | `{ mode, gateway, cashEnabled, midtransClientKey, midtransIsProduction, midtransSnapJsUrl }`, **publik** (dipakai app pelanggan) |
| GET | `/payments/settings` | – | `{ mode, gateway, cashEnabled, ... }`, ADMIN/SUPER_ADMIN |
| PATCH | `/payments/settings` | `{ paymentGatewayMode }` | set mode metode pembayaran, ADMIN/SUPER_ADMIN |

`PaymentMethod`: `CASH|VIRTUAL_ACCOUNT|E_WALLET|CREDIT_CARD`.
`PaymentStatus`: `PENDING|PAID|FAILED|REFUNDED`.
`PaymentProvider`: `MIDTRANS|XENDIT`.
`PaymentGatewayMode`: `MIDTRANS|XENDIT|MIDTRANS_CASH|XENDIT_CASH|CASH`.

Saat PAID, backend mengisi `commissionAmount` & `partnerEarning`
(`settlePayment`), rate default `0.15`.

**Mode metode pembayaran** disimpan di tabel `system_settings`
(key `payment_gateway_mode`, kompatibel dengan key lama `payment_gateway`).
Menentukan gateway online + boleh/tidaknya tunai:

| Mode | Gateway online | Tunai |
|---|---|---|
| `MIDTRANS` | Midtrans | ✗ |
| `XENDIT` | Xendit | ✗ |
| `MIDTRANS_CASH` | Midtrans | ✓ |
| `XENDIT_CASH` | Xendit | ✓ |
| `CASH` | – | ✓ |

`POST /payments` menolak method yang tidak diizinkan mode (mis. `CASH` saat
mode Midtrans-only, atau non-cash saat mode `CASH`). Field `provider` opsional
tetap ada untuk kompatibilitas, tapi tidak boleh berbeda dari gateway mode.
**UI pengaturannya dipindah ke menu Konfigurasi (M12)** — lihat
`M12-konfigurasi.md`.

`POST /payments` bersifat **upsert selama belum lunas**: pelanggan boleh
mencoba ulang atau ganti metode (mis. dari online ke tunai) selama pembayaran
belum `PAID`/`REFUNDED`. Backend memperbarui baris `Payment` yang sama
(`Payment.orderId` unik), dan mengosongkan `gatewayProvider`/`gatewayRefId`
saat metode diubah ke `CASH` supaya webhook gateway yang telat tidak keliru
menandai lunas.

Return `POST /payments`:

- Midtrans → `{ ...payment, snapToken, redirectUrl }` (app pelanggan memanggil
  `snap.embed()` untuk checkout **embedded**).
- Xendit → `{ ...payment, componentsSdkKey, paymentSessionId, expiresAt }`
  (app pelanggan menginisialisasi `xendit-components-web` dengan
  `componentsSdkKey`).
- CASH → hanya baris `Payment` (dikonfirmasi mitra lewat `mark-paid`).

### Webhook Xendit

`POST /payments/webhooks/xendit` menerima dua bentuk payload di URL yang sama:

- **Payment Session** (Xendit Components): punya field `event`
  (`payment_session.completed` / `payment_session.expired`) dan
  `data.reference_id` = `orderNumber`. `completed` → PAID, `expired` → FAILED.
- **Invoice** (integrasi lama): tanpa `event` (payload `external_id`).

Keduanya diverifikasi lewat header `x-callback-token` (`XENDIT_WEBHOOK_TOKEN`).

---

## Rancangan

### Halaman `/payments`
- Tabel: `order.orderNumber`, metode, status (`StatusBadge`), amount, komisi,
  partner earning, provider (`gatewayProvider`), `paidAt`, `createdAt`.
- Filter: status, metode, rentang tanggal (`dateFrom`/`dateTo`), pagination.
- Aksi: **Tandai Lunas** (konfirmasi) untuk baris CASH + PENDING.
- Tautan ke detail order terkait.
- **Pengaturan metode pembayaran** tidak lagi di halaman ini — dipindah ke menu
  **Konfigurasi** (`/config`). Lihat M12.

## Komponen
- `DataTable`, `Pagination`, `StatusBadge`, `ConfirmDialog`, `DateRangeFilter`,
  `PageHeader`, sel mata uang terformat.
- Pengaturan metode pembayaran: `PaymentGatewaySettings`
  (`components/config/payment-gateway-settings.tsx`) — radio cards + server action.

---

## App Pelanggan (checkout embedded)

Checkout online terjadi **di dalam app pelanggan** (tidak redirect ke halaman
gateway) di halaman `/orders/[id]/payment`:

- `PaymentPanel` (`components/orders/payment-panel.tsx`) hanya mengarahkan ke
  halaman pembayaran; pembayaran tunai tetap lewat server action.
- `PaymentCheckout` (`components/orders/payment-checkout.tsx`) mengatur alur:
  pilih metode → embedded → sukses/gagal.
- Midtrans: `MidtransEmbed` memuat Snap.js lalu `snap.embed()`.
- Xendit: `XenditEmbed` memuat `xendit-components-web` (channel picker + form
  kartu PCI-compliant di iframe Xendit) dan `resume: true` saat kembali dari
  channel redirect.

Perilaku:

- **Sukses** → kartu "Pembayaran berhasil", lalu pindah ke `/orders/[id]`
  (setelah menunggu webhook menandai PAID, maks ~6 dtk).
- **Gagal / sesi berakhir** → pesan + tombol "Coba lagi", "Bayar tunai", dan
  "Ganti metode pembayaran" (tidak pernah stuck, karena backend meng-upsert).
- **Pending** (mis. VA/QR belum dibayar) → info menunggu + "Cek status".

Env backend yang relevan: `CUSTOMER_APP_URL` (dasar `return_url`; hanya dikirim
ke Xendit bila HTTPS) dan `XENDIT_COMPONENTS_ORIGINS` (fallback ke `CORS_ORIGIN`).


---

## Acceptance Criteria

- [x] Filter status, metode, dan rentang tanggal berfungsi (diteruskan sebagai query).
- [x] Pagination server-side berjalan.
- [x] Tombol "Tandai Lunas" hanya tampil/aktif untuk CASH + PENDING.
- [x] Aksi mark-paid berhasil dan status berubah menjadi PAID dengan komisi terisi.
- [x] Error backend (mis. sudah berstatus lain) ditampilkan sebagai toast.
- [x] Semua nilai uang diformat Rupiah.
- [x] `pnpm lint` & `pnpm build` lolos.
- [x] Setting mode metode pembayaran tersimpan di DB & bertahan setelah restart.
- [x] Pembayaran non-tunai baru memakai gateway dari mode terpilih
      (`gatewayProvider` = `xendit` / `midtrans`).
- [x] Method yang tidak diizinkan mode ditolak 400; `provider` yang beda dari
      mode juga ditolak 400.
- [x] App pelanggan menyembunyikan tombol metode yang tidak aktif
      (via `GET /payments/methods`).

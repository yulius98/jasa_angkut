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
| GET | `/payments/settings` | – | `{ paymentGateway }`, ADMIN/SUPER_ADMIN |
| PATCH | `/payments/settings` | `{ paymentGateway: MIDTRANS \| XENDIT }` | set gateway default, ADMIN/SUPER_ADMIN |

`PaymentMethod`: `CASH|VIRTUAL_ACCOUNT|E_WALLET|CREDIT_CARD`.
`PaymentStatus`: `PENDING|PAID|FAILED|REFUNDED`.
`PaymentProvider`: `MIDTRANS|XENDIT`.

Saat PAID, backend mengisi `commissionAmount` & `partnerEarning`
(`settlePayment`), rate default `0.15`.

**Gateway default:** disimpan di tabel `system_settings` (key `payment_gateway`).
`POST /payments` tanpa field `provider` memakai setting ini; kirim `provider`
eksplisit tetap boleh override per-order. Nilai awal `MIDTRANS` (perilaku lama).

---

## Rancangan

### Halaman `/payments`
- Tabel: `order.orderNumber`, metode, status (`StatusBadge`), amount, komisi,
  partner earning, provider (`gatewayProvider`), `paidAt`, `createdAt`.
- Filter: status, metode, rentang tanggal (`dateFrom`/`dateTo`), pagination.
- Aksi: **Tandai Lunas** (konfirmasi) untuk baris CASH + PENDING.
- Tautan ke detail order terkait.
- **Pengaturan Gateway**: tombol di header membuka dialog pilihan
  Midtrans / Xendit; nilai aktif ditampilkan sebagai "Gateway aktif: …".

## Komponen
- `DataTable`, `Pagination`, `StatusBadge`, `ConfirmDialog`, `DateRangeFilter`,
  `PageHeader`, sel mata uang terformat.
- `GatewaySettingsButton`, `GatewaySettingsDialog` (radio cards + server action).

---

## Acceptance Criteria

- [x] Filter status, metode, dan rentang tanggal berfungsi (diteruskan sebagai query).
- [x] Pagination server-side berjalan.
- [x] Tombol "Tandai Lunas" hanya tampil/aktif untuk CASH + PENDING.
- [x] Aksi mark-paid berhasil dan status berubah menjadi PAID dengan komisi terisi.
- [x] Error backend (mis. sudah berstatus lain) ditampilkan sebagai toast.
- [x] Semua nilai uang diformat Rupiah.
- [x] `pnpm lint` & `pnpm build` lolos.
- [x] Setting gateway tersimpan di DB dan bertahan setelah restart backend.
- [x] Pembayaran non-tunai baru memakai gateway terpilih (terverifikasi
      `gatewayProvider` = `xendit` / `midtrans` sesuai setting).
- [x] Override `provider` per-order tetap berfungsi; nilai tidak valid ditolak 400.

# M5 — Pembayaran

**Tujuan:** admin memantau seluruh pembayaran dan mengonfirmasi pembayaran tunai (CASH)
yang masih PENDING.

**Status:** ⬜ Belum · **Bergantung pada:** M0, M1

---

## Endpoint Backend

| Method | Path | Query/Body | Keterangan |
|---|---|---|---|
| GET | `/payments` | `status?`, `method?`, `dateFrom?`, `dateTo?`, `page?`, `limit?` | `{ data, meta }` |
| PATCH | `/payments/:id/mark-paid` | – | hanya CASH berstatus PENDING |
| GET | `/payments/order/:orderId` | – | pembayaran per order |

`PaymentMethod`: `CASH|VIRTUAL_ACCOUNT|E_WALLET|CREDIT_CARD`.
`PaymentStatus`: `PENDING|PAID|FAILED|REFUNDED`.

Saat PAID, backend mengisi `commissionAmount` & `partnerEarning`
(`settlePayment`), rate default `0.15`.

---

## Rancangan

### Halaman `/payments`
- Tabel: `order.orderNumber`, metode, status (`StatusBadge`), amount, komisi,
  partner earning, provider (`gatewayProvider`), `paidAt`, `createdAt`.
- Filter: status, metode, rentang tanggal (`dateFrom`/`dateTo`), pagination.
- Aksi: **Tandai Lunas** (konfirmasi) untuk baris CASH + PENDING.
- Tautan ke detail order terkait.

## Komponen
- `DataTable`, `Pagination`, `StatusBadge`, `ConfirmDialog`, `DateRangeFilter`,
  `PageHeader`, sel mata uang terformat.

---

## Acceptance Criteria

- [ ] Filter status, metode, dan rentang tanggal berfungsi (diteruskan sebagai query).
- [ ] Pagination server-side berjalan.
- [ ] Tombol "Tandai Lunas" hanya tampil/aktif untuk CASH + PENDING.
- [ ] Aksi mark-paid berhasil dan status berubah menjadi PAID dengan komisi terisi.
- [ ] Error backend (mis. sudah berstatus lain) ditampilkan sebagai toast.
- [ ] Semua nilai uang diformat Rupiah.
- [ ] `pnpm lint` & `pnpm build` lolos.

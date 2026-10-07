# M7 — Dispute

**Tujuan:** admin meninjau sengketa order dan menyelesaikannya.

**Status:** ⬜ Belum · **Bergantung pada:** M0, M1

---

## Endpoint Backend

| Method | Path | Query/Body | Keterangan |
|---|---|---|---|
| GET | `/admin/disputes` | `status?` (`open\|resolved\|rejected`), `page?`, `limit?` | `{ data, meta }` |
| PATCH | `/admin/disputes/:id/resolve` | `{ outcome: 'resolved'\|'rejected', resolution }` | `resolution` 5–1000 char |

`GET /admin/disputes` mengembalikan `data[]` dengan `order: { orderNumber, status, finalPrice }`.

Catatan penting: menyelesaikan dispute **tidak** otomatis mengubah status order —
keputusan lanjutan (refund/COMPLETED) dilakukan manual. Sampaikan info ini di UI.

---

## Rancangan

### Halaman `/disputes`
- Tabel: `order.orderNumber`, status order, `finalPrice`, `reason`, status dispute,
  `createdAt`, `resolvedAt`.
- Filter status (semua / open / resolved / rejected) + pagination.
- Detail (dialog/drawer): `reason`, `resolution` (bila ada), `resolvedBy`, `resolvedAt`,
  `raisedBy`; ringkasan order + tautan ke `/orders/[id]`.
- Aksi **Resolve** (hanya untuk status `open`): pilih `outcome` + isi `resolution`
  (validasi ≥5 char) → konfirmasi.

## Komponen
- `DataTable`, `Pagination`, `StatusBadge`, `ResolveDisputeDialog`, `PageHeader`.

---

## Acceptance Criteria

- [ ] List + filter status + pagination berjalan.
- [ ] Detail menampilkan alasan, hasil (bila ada), dan data order.
- [ ] Resolve hanya tersedia untuk dispute `open`.
- [ ] `resolution` divalidasi minimal 5 karakter.
- [ ] Setelah resolve, status dispute berubah dan data diperbarui.
- [ ] Ada catatan UI bahwa resolve tidak otomatis mengubah status order.
- [ ] `pnpm lint` & `pnpm build` lolos.

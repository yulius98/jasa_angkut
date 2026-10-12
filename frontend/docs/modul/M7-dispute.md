# M7 — Dispute

**Tujuan:** admin meninjau sengketa order dan menyelesaikannya.

**Status:** ✅ Selesai · **Bergantung pada:** M0, M1

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

## Catatan Implementasi

- Halaman `app/(dashboard)/disputes/page.tsx` (Server Component) memakai `serverFetch`
  `GET /admin/disputes` dengan `{ cache: "no-store" }`, filter status + pagination
  server-side (pola sama seperti M4/M5). Status valid divalidasi terhadap
  `DISPUTE_STATUS_META` (`open|resolved|rejected`).
- Mutasi resolve lewat server action `lib/actions/disputes.ts` (`resolveDispute`,
  `PATCH /admin/disputes/:id/resolve`) dengan rotasi token di cookie; client lalu
  `router.refresh()`.
- `DisputeActions` menampilkan tombol **Detail** (selalu) dan **Resolve** hanya untuk
  status `open`. `DisputeDetailDialog` menampilkan alasan, hasil, `resolvedBy`,
  `resolvedAt`, `raisedBy`, ringkasan order + tautan ke `/orders/[id]`.
- `ResolveDisputeDialog` memilih `outcome` (resolved/rejected) + `resolution`
  (divalidasi 5–1000 karakter, sama dengan DTO backend). Ditegaskan di UI bahwa resolve
  tidak otomatis mengubah status order.
- Tipe `DisputeListItem` men-jalankan relasi `order` sebagai ringkasan
  (`orderNumber`, `status`, `finalPrice`), sesuai `select` di `AdminService.listDisputes`.

---

## Acceptance Criteria

- [x] List + filter status + pagination berjalan.
- [x] Detail menampilkan alasan, hasil (bila ada), dan data order.
- [x] Resolve hanya tersedia untuk dispute `open`.
- [x] `resolution` divalidasi minimal 5 karakter.
- [x] Setelah resolve, status dispute berubah dan data diperbarui.
- [x] Ada catatan UI bahwa resolve tidak otomatis mengubah status order.
- [x] `pnpm lint` & `pnpm build` lolos.

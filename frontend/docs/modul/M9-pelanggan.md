# M9 — Pelanggan

**Tujuan:** admin melihat daftar seluruh pelanggan (`role = CUSTOMER`) beserta ringkasan
aktivitas (jumlah pesanan & alamat) dan mencari berdasarkan nama/email/telepon.

**Status:** ✅ Selesai · **Bergantung pada:** M0, M1

---

## Endpoint Backend

| Method | Path | Query | Keterangan |
|---|---|---|---|
| GET | `/admin/customers` | `search?`, `page?`, `limit?` (maks 100) | `{ data, meta }`; hanya `User` role `CUSTOMER` |

Setiap baris berisi `id, name, email, phone, isActive, isVerified, createdAt`,
`_count.addresses`, dan `customerProfile` (`id, avatarUrl, _count.orders`). Field
sensitif (`passwordHash`) tidak pernah dikirim (memakai `select` eksplisit).

---

## Rancangan

### Halaman `/customers`
- Tabel: nama (dengan email), telepon, jumlah pesanan, jumlah alamat, status, tanggal
  bergabung.
- Status diturunkan: `Nonaktif` (destructive) bila `!isActive`, `Terverifikasi` (default)
  bila `isVerified`, selain itu `Belum verifikasi` (secondary).
- **Pencarian** server-side by nama/email/telepon (input dengan debounce).
- Pagination server-side via query `page`.

## Komponen
- `DataTable`, `TablePagination`, `StatusBadge`, `PageHeader`, `CustomerSearch`.

## Catatan Implementasi
- Backend: `AdminService.listCustomers` memfilter `role: CUSTOMER`; bila `search` diisi,
  pakai `OR contains` (`insensitive`) untuk `name`/`email`/`phone`. Jumlah pesanan
  diambil dari relasi `customerProfile._count.orders`, alamat dari `_count.addresses`.
- FE: `CustomerSearch` (Client Component) meng-update query `?search=` setelah 300 ms;
  mengosongkan input menghapus param. Perubahan query mereset halaman ke 1.
- Menu "Pelanggan" ditambahkan di sidebar (grup Operasional).

---

## Acceptance Criteria

- [x] Daftar pelanggan tampil dengan pagination.
- [x] Pencarian nama/email/telepon berjalan (server-side).
- [x] Menampilkan jumlah pesanan, jumlah alamat, dan status.
- [x] Hanya `User` dengan role `CUSTOMER` yang ditampilkan.
- [x] Hanya admin/super admin yang bisa mengakses (`GET /admin/customers`).
- [x] `pnpm lint` & `pnpm build` lolos.

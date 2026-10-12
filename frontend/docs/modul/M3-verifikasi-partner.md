# M3 — Verifikasi Partner

**Tujuan:** admin meninjau pengajuan partner, melihat dokumen identitas & kendaraan,
lalu menyetujui, menolak, atau mensuspend.

**Status:** ✅ Selesai · **Bergantung pada:** M0, M1

---

## Endpoint Backend

| Method | Path | Query/Body | Keterangan |
|---|---|---|---|
| GET | `/partners` | `status?`, `page?`, `limit?` (maks 100) | `{ data, meta }` |
| POST | `/partners` | multipart (lihat bawah) | admin buat partner langsung APPROVED + 1 kendaraan |
| GET | `/partners/:id` | – | detail + `user` + `vehicles` |
| PATCH | `/partners/:id/approve` | – | wajib ada ≥1 kendaraan aktif |
| PATCH | `/partners/:id/reject` | `{ reason }` | hanya status PENDING |
| PATCH | `/partners/:id/suspend` | `{ reason }` | hanya status APPROVED |
| GET | `/partners/:id/documents/:type` | `type` ∈ `ktp`\|`sim` | **stream gambar**, butuh Auth |

Catatan: field `ktpPhotoUrl`/`simPhotoUrl` **tidak** dikirim di JSON (di-omit);
dokumen hanya via endpoint dokumen. `PartnerStatus`: `PENDING|APPROVED|REJECTED|SUSPENDED`.

`POST /partners` (multipart/form-data) — field: `name`, `email`, `phone`, `password`,
`ktpNumber` (16 digit), `simNumber` (12-14 digit), `vehicleType`
(`MOTORCYCLE|PICKUP|BOX_TRUCK|LARGE_TRUCK`), `plateNumber`, `brand`, `model`,
`maxWeightKg` (≤99999), `maxVolumeM3` (≤999); file: `ktpPhoto`, `simPhoto`, `stnkPhoto`
(wajib) + `photo` (opsional; maks 5 MB/gambar, JPG/PNG/WEBP). Membuat `User` role
`PARTNER` (verified) + `Partner` `APPROVED` (dicatat `approvedBy`/`approvedAt`) + 1
`Vehicle` aktif. Email/telepon/KTP/SIM/plat duplikat → 409.

---

## Rancangan

### Halaman `/partners`
- Tabel: nama (dari `user.name`), email, telepon, status (`StatusBadge`), jumlah
  kendaraan (`_count.vehicles`), rating, `createdAt`.
- Filter status (dropdown: semua + 4 status) + pagination (server-side via query).
- Aksi baris: lihat detail.
- Default saat masuk dari dashboard: `?status=PENDING`.

### Halaman `/partners/[id]`
- Profil partner + data user (nama/email/telepon), No. KTP & SIM (angka), status,
  rating, `totalTrips`, `isOnline`, tanggal.
- **Dokumen KTP & SIM**: tombol "Lihat" membuka modal/gambar. Karena stream +
  Authorization, ambil lewat Route Handler proxy: `app/api/proxy/partners/[id]/documents/[type]/route.ts`
  (teruskan cookie → Bearer, balikan body gambar).
- Daftar kendaraan: tipe, plat, brand/model, kapasitas, status aktif; tombol lihat
  STNK & foto via `app/api/proxy/vehicles/[id]/files/[kind]/route.ts`.
- Panel aksi:
  - **Setujui** (konfirmasi) → `approve`.
  - **Tolak** → dialog input `reason` (min 5 char) → `reject`.
  - **Suspend** → dialog input `reason` → `suspend`.
  - Tombol ditampilkan sesuai status (PENDING: approve/reject; APPROVED: suspend).

## Komponen
- `DataTable`, `Pagination`, `StatusBadge`, `ConfirmDialog`, `ReasonDialog`,
  `DocumentViewer` (modal gambar), `PageHeader`.

## Catatan Implementasi
- Dokumen di-stream melalui satu Route Handler catch-all: `app/api/proxy/[...path]/route.ts`.
  Hanya pola `partners/:uuid/documents/{ktp|sim}` dan `vehicles/:uuid/files/{stnk|photo}`
  yang di-forward (cegah SSRF); UUID & enum divalidasi. `refreshOn401` dipakai untuk
  meng-update access token saat akses dokumen.
- Mutasi (approve/reject/suspend) lewat `app/api/admin/partners/[id]/[action]/route.ts`
  (PATCH, `serverFetch` `refreshOn401`); client lalu `router.refresh()`.
- Filter status adalah `<select>` client yang me-rewrite query string, tidak menambah
  state server; pagination server-side via `TablePagination`.
- `PartnerActions` menampilkan tombol sesuai status: PENDING → Setujui/Tolak,
  APPROVED → Suspend. Alasan (min 5 char) divalidasi di sisi client & backend.
- Tipe `Partner`/`Vehicle` pada FE men-jalankan omit backend: `ktpPhotoUrl`,
  `simPhotoUrl`, `photoUrl`, `stnkPhotoUrl` tidak lagi ada di tipe (dokumen hanya via proxy).
- **Tambah Partner** (admin): tombol di header `/partners` → `CreatePartnerDialog`
  (`react-hook-form` + zod untuk field teks, `useState` untuk 3-4 file). Submit membangun
  `FormData` dan memanggil Route Handler `app/api/admin/partners` (`POST`, `serverFetch`
  `refreshOn401`). `lib/api.ts` tidak men-set `Content-Type` bila body berupa `FormData`
  agar `fetch` menetapkan boundary multipart. Sukses → `router.refresh()`.

---

## Acceptance Criteria

- [x] List + filter status + pagination berjalan.
- [x] Detail menampilkan profil, user, dan kendaraan.
- [x] KTP/SIM/STNK/foto kendaraan bisa dilihat (via proxy, tidak bocor ke URL publik).
- [x] Approve gagal dengan pesan jelas bila partner belum punya kendaraan aktif.
- [x] Reject/Suspend meminta alasan dan berhasil.
- [x] Setelah aksi, data di halaman diperbarui (refresh/redirect).
- [x] Parameter `type`/`kind` divalidasi (`ktp|sim`, `stnk|photo`).
- [x] Admin bisa menambah partner (akun + KTP/SIM + 1 kendaraan) dan langsung berstatus APPROVED.
- [x] Validasi client & server (KTP 16 digit, SIM 12-14 digit, plat, kapasitas, ukuran/tipe file).
- [x] `pnpm lint` & `pnpm build` lolos.

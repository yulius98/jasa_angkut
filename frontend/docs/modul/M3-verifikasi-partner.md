# M3 — Verifikasi Partner

**Tujuan:** admin meninjau pengajuan partner, melihat dokumen identitas & kendaraan,
lalu menyetujui, menolak, atau mensuspend.

**Status:** ⬜ Belum · **Bergantung pada:** M0, M1

---

## Endpoint Backend

| Method | Path | Query/Body | Keterangan |
|---|---|---|---|
| GET | `/partners` | `status?`, `page?`, `limit?` (maks 100) | `{ data, meta }` |
| GET | `/partners/:id` | – | detail + `user` + `vehicles` |
| PATCH | `/partners/:id/approve` | – | wajib ada ≥1 kendaraan aktif |
| PATCH | `/partners/:id/reject` | `{ reason }` | hanya status PENDING |
| PATCH | `/partners/:id/suspend` | `{ reason }` | hanya status APPROVED |
| GET | `/partners/:id/documents/:type` | `type` ∈ `ktp`\|`sim` | **stream gambar**, butuh Auth |

Catatan: field `ktpPhotoUrl`/`simPhotoUrl` **tidak** dikirim di JSON (di-omit);
dokumen hanya via endpoint dokumen. `PartnerStatus`: `PENDING|APPROVED|REJECTED|SUSPENDED`.

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

---

## Acceptance Criteria

- [ ] List + filter status + pagination berjalan.
- [ ] Detail menampilkan profil, user, dan kendaraan.
- [ ] KTP/SIM/STNK/foto kendaraan bisa dilihat (via proxy, tidak bocor ke URL publik).
- [ ] Approve gagal dengan pesan jelas bila partner belum punya kendaraan aktif.
- [ ] Reject/Suspend meminta alasan dan berhasil.
- [ ] Setelah aksi, data di halaman diperbarui (refresh/redirect).
- [ ] Parameter `type`/`kind` divalidasi (`ktp|sim`, `stnk|photo`).
- [ ] `pnpm lint` & `pnpm build` lolos.

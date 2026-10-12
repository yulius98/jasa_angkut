# M10 — Kelola Admin

**Tujuan:** admin mengelola akun dengan akses admin (`role = ADMIN` atau `SUPER_ADMIN`):
melihat daftar, menambah admin baru, mengubah profil & role, mengaktifkan/menonaktifkan,
mereset password, dan menghapus akun.

**Status:** ✅ Selesai · **Bergantung pada:** M0, M1

---

## Endpoint Backend

| Method | Path | Body/Query | Keterangan |
|---|---|---|---|
| GET | `/admin/admins` | `search?`, `role?`, `page?`, `limit?` (maks 100) | `{ data, meta }`; hanya `User` role `ADMIN`/`SUPER_ADMIN` |
| POST | `/admin/admins` | `name, email, phone, password, role` | Buat akun admin (`isVerified: true`), `role` wajib `ADMIN`/`SUPER_ADMIN` |
| PATCH | `/admin/admins/:id` | `name?, phone?, role?` | Edit profil dan/atau ubah role |
| PATCH | `/admin/admins/:id/status` | `isActive` | Aktifkan/nonaktifkan |
| PATCH | `/admin/admins/:id/password` | `password` | Reset password (min 8 karakter) |
| DELETE | `/admin/admins/:id` | – | Hapus akun admin |

Setiap baris berisi `id, name, email, phone, role, isActive, isVerified, createdAt`, dan
`adminProfile.tier`. Field sensitif (`passwordHash`) tidak pernah dikirim (memakai `select`
eksplisit). Semua endpoint ber-guard `ADMIN` + `SUPER_ADMIN`.

---

## Aturan Keamanan

Diterapkan di `AdminsService` untuk mencegah akun terkunci:

- Tidak dapat **mengubah role akun sendiri**.
- Tidak dapat **menonaktifkan akun sendiri**.
- Tidak dapat **menghapus akun sendiri**.
- Tidak dapat menurunkan role / menonaktifkan / menghapus **super admin aktif terakhir**.
- Email & nomor telepon unik (duplikat → `409 Conflict`).
- Saat dinonaktifkan atau password direset, seluruh **refresh token** akun tersebut dihapus
  (sesi aktif diakhiri).

---

## Rancangan

### Halaman `/admins`
- Tabel: nama (dengan email), telepon, role (badge), status (badge), tanggal dibuat, aksi.
- **Pencarian** server-side by nama/email/telepon (input dengan debounce).
- Pagination server-side via query `page`.
- Tombol **Tambah Admin** di header.

### Aksi per baris (dropdown)
- **Edit Profil** (nama, telepon).
- **Ubah Role** (ADMIN ↔ SUPER_ADMIN) — dinonaktifkan untuk akun sendiri.
- **Reset Password** (password + konfirmasi).
- **Nonaktifkan/Aktifkan** — nonaktifkan dinonaktifkan untuk akun sendiri.
- **Hapus** (konfirmasi destruktif) — dinonaktifkan untuk akun sendiri.

## Komponen
- `DataTable`, `TablePagination`, `StatusBadge`, `PageHeader`, `ConfirmDialog`.
- `AdminSearch`, `CreateAdminButton`, `CreateAdminDialog`, `EditAdminDialog`,
  `ChangeAdminRoleDialog`, `ResetAdminPasswordDialog`, `AdminRowActions`.

## Catatan Implementasi
- Backend: `AdminsService` di modul `admin` (`AdminsController` rute `admin/admins`),
  memakai `bcrypt` (cost 12) dan `ADMIN_SELECT` agar `passwordHash` tak ikut terkirim.
- FE: mutasi lewat Server Actions `lib/actions/admins.ts` (membaca cookie `access_token`).
- Identitas akun sendiri diambil dari sesi (`requireSession`) untuk menonaktifkan aksi
  destruktif pada baris sendiri.
- Menu "Kelola Admin" ditambahkan di sidebar (grup Konfigurasi); `/admins` ditambahkan ke
  `protectedRoutes` dan `config.matcher` di `proxy.ts`.

---

## Acceptance Criteria

- [x] Daftar admin tampil dengan pagination dan pencarian server-side.
- [x] Menambah admin baru (ADMIN/SUPER_ADMIN) — akun langsung aktif & terverifikasi.
- [x] Edit profil (nama/telepon) dan ubah role.
- [x] Aktifkan/nonaktifkan dan reset password.
- [x] Hapus akun dengan konfirmasi.
- [x] Aturan keamanan (self & super admin terakhir) diuji via endpoint.
- [x] Hanya `User` dengan role `ADMIN`/`SUPER_ADMIN` yang ditampilkan.
- [x] Route `/admins` dilindungi (`proxy.ts`).
- [x] `pnpm lint` & `pnpm build` lolos.

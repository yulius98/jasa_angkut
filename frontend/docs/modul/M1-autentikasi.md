# M1 — Autentikasi & Proteksi Route

**Tujuan:** admin dapat login, sesi tersimpan aman di httpOnly cookie, route dashboard
terproteksi, dan akses dibatasi hanya untuk role `ADMIN` / `SUPER_ADMIN`.

**Status:** ✅ Selesai · **Bergantung pada:** M0

---

## Endpoint Backend

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| POST | `/auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| POST | `/auth/logout` | `{ refreshToken }` | `{ message }` |
| GET | `/auth/me` | – | `{ id, name, email, phone, role, isVerified, createdAt }` |

Catatan: access token berlaku **900 detik**; refresh token **rotasi** (yang lama hangus).

---

## Rancangan

### Route Handler (proxy)
- `app/api/auth/login/route.ts` → panggil backend login, set cookie
  `access_token` & `refresh_token` (`httpOnly`, `sameSite=lax`, `secure` saat produksi,
  `path=/`). Validasi bahwa `user.role` ∈ {ADMIN, SUPER_ADMIN}; jika bukan, tolak.
- `app/api/auth/logout/route.ts` → panggil backend logout, hapus cookie.
- `app/api/auth/refresh/route.ts` → panggil backend refresh (rotasi), perbarui cookie.

### Proteksi
- `proxy.ts` (pengganti `middleware.ts` di Next 16): route di grup `(dashboard)` dicek
  adanya cookie; tanpa access token → arahkan ke refresh bila ada refresh token, jika
  tidak ke `/login`. Role dibaca dari cookie `user` (hanya admin).
- `lib/api.ts` (`serverFetch`): di Server Component, pada 401/403 redirect ke
  `/api/auth/refresh?next=...` (refresh dilakukan tanpa menulis cookie saat render).
  Di Route Handler (`refreshOn401`), refresh token dipertukarkan otomatis lalu request
  diulang.
- `lib/session.ts`: `requireSession()` membaca cookie untuk server component.

### Halaman
- `app/(auth)/login/page.tsx` — form email + password (react-hook-form + zod),
  tampilkan pesan error backend, redirect ke `/dashboard` saat sukses.
- `app/(dashboard)/layout.tsx` — ambil sesi (`requireSession`) lalu tampilkan nama
  admin + tombol logout di topbar.

---

## Catatan Implementasi

- Login user non-admin **tidak menyimpan cookie**; Route Handler mengembalikan
  `403 "Akses ditolak. Halaman ini khusus untuk admin."`
- Refresh route (`GET /api/auth/refresh?next=...`) mengecek role dari cookie `user`
  dan membersihkan cookie bila tidak valid (mencegah infinite redirect).
- Cookie: `access_token` (maxAge 840s), `refresh_token` & `user` (maxAge 7 hari),
  semua `httpOnly`, `sameSite=lax`, `secure` saat produksi.

---

## Acceptance Criteria

- [x] Login dengan kredensial admin valid → masuk `/dashboard`.
- [x] Kredensial salah → pesan error backend tampil.
- [x] Login dengan akun CUSTOMER/PARTNER ditolak (pesan: akses khusus admin).
- [x] Token tersimpan sebagai httpOnly cookie (tidak terbaca `document.cookie`).
- [x] Refresh token otomatis memperbarui access token tanpa memaksa login ulang.
- [x] Logout menghapus sesi lalu redirect ke `/login`.
- [x] Mengakses route dashboard tanpa sesi → redirect `/login`.
- [x] `pnpm lint` & `pnpm build` lolos.

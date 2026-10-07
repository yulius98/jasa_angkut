# M1 — Autentikasi & Proteksi Route

**Tujuan:** admin dapat login, sesi tersimpan aman di httpOnly cookie, route dashboard
terproteksi, dan akses dibatasi hanya untuk role `ADMIN` / `SUPER_ADMIN`.

**Status:** ⬜ Belum · **Bergantung pada:** M0

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
- `middleware.ts`: untuk route di grup `(dashboard)`, cek keberadaan cookie; jika access
  token kedaluwarsa, arahkan ke refresh (atau redirect `/login`). Blokir bila role bukan admin.
- `lib/session.ts`: `getSession()` memakai `GET /auth/me` untuk server component.

### Halaman
- `app/(auth)/login/page.tsx` — form email + password (react-hook-form + zod),
  tampilkan pesan error backend, redirect ke `/dashboard` saat sukses.
- `app/(dashboard)/layout.tsx` — tampilkan nama admin + tombol logout.

---

## Acceptance Criteria

- [ ] Login dengan kredensial admin valid → masuk `/dashboard`.
- [ ] Kredensial salah → pesan error backend tampil.
- [ ] Login dengan akun CUSTOMER/PARTNER ditolak (pesan: akses khusus admin).
- [ ] Token tersimpan sebagai httpOnly cookie (tidak terbaca `document.cookie`).
- [ ] Refresh token otomatis memperbarui access token tanpa memaksa login ulang.
- [ ] Logout menghapus sesi lalu redirect ke `/login`.
- [ ] Mengakses route dashboard tanpa sesi → redirect `/login`.
- [ ] `pnpm lint` & `pnpm build` lolos.

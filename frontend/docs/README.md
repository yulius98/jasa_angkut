# Dashboard Admin — Dokumentasi Perencanaan

Dokumentasi ini adalah acuan pembangunan **dashboard admin** untuk aplikasi Jasa Antar
(Backend NestJS + Prisma 7). Pengerjaan dilakukan **bertahap per modul**; setiap modul
diselesaikan dan diverifikasi sebelum lanjut ke modul berikutnya.

- Status modul dipelihara di tabel [Daftar Modul](#daftar-modul).
- Detail tiap modul ada di folder [`modul/`](./modul/).
- Backend hanya menyediakan endpoint yang dipakai di dokumen ini; modul yang endpoint-nya
  tidak tersedia tidak akan dibuat (lihat [Batasan](#batasan-dan-kendala)).

---

## 1. Keputusan Arsitektur

| Aspek | Keputusan |
|---|---|
| Lokasi aplikasi | Dalam folder `frontend/` yang ada (satu aplikasi Next.js) |
| Framework | Next.js (App Router) + React + TypeScript |
| Data fetching | **Server Components + `fetch` biasa**; mutasi & auth lewat **Route Handler** `app/api/*` sebagai proxy |
| Komponen UI | **shadcn/ui** + Tailwind CSS |
| Tema | Clean SaaS: sidebar + topbar + **light/dark mode** |
| Bahasa UI | Bahasa Indonesia |
| Sesi/Auth | **httpOnly cookie** + **Route Handler proxy** + refresh token |
| Backend | Aktifkan **CORS** + `PORT=3001` (ubah `Backend/src/main.ts` & `.env`) |
| Peta | **Google Maps** (Client Component, butuh API key) |
| Admin pertama | **Prisma seed script** (karena belum ada user admin di DB) |

### Pola alur data

```
Browser ──(cookie httpOnly)──► Next.js Route Handler / Server Component
                                      │  Authorization: Bearer <accessToken>
                                      ▼
                                Backend NestJS  (http://localhost:3001)
```

- **Baca (GET)**: Server Component memanggil backend langsung dengan `lib/api.ts`
  (membaca cookie sesi). Tidak ada token yang bocor ke browser.
- **Tulis/aksi (POST/PATCH)**: Client memanggil Route Handler `app/api/*`; handler
  membaca cookie, meneruskan ke backend, lalu mengembalikan hasil. Handler juga
  yang menangani penyimpanan/refresh cookie.
- **Refresh token**: access token berlaku 900 detik (15 menit). Rotasi refresh token
  ditangani di Route Handler/`middleware.ts`.

---

## 2. Teknologi & Dependency

Sudah ada: `next`, `react`, `react-dom`, `tailwindcss` (v4), `typescript`, `eslint`.

Akan ditambahkan:
- **shadcn/ui** (Radix UI + `class-variance-authority`, `tailwind-merge`, `clsx`, `lucide-react`)
- **next-themes** (dark mode)
- **react-hook-form** + **zod** + `@hookform/resolvers` (form & validasi)
- **sonner** (toast)
- **Google Maps**: `@vis.gl/react-google-maps` (dipakai di M4/M11)
- (opsional) library grafik sederhana untuk M2

---

## 3. Struktur Folder (target)

```
frontend/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # shell: sidebar + topbar + proteksi
│   │   ├── dashboard/page.tsx      # M2
│   │   ├── partners/
│   │   │   ├── page.tsx            # M3
│   │   │   └── [id]/page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx            # M4
│   │   │   └── [id]/page.tsx
│   │   ├── payments/page.tsx       # M5
│   │   ├── pricing/
│   │   │   ├── zones/page.tsx      # M6
│   │   │   └── promos/page.tsx
│   │   ├── disputes/page.tsx       # M7
│   │   └── withdrawals/page.tsx    # M8
│   └── api/                        # proxy Route Handlers
│       ├── auth/{login,logout,refresh}/route.ts
│       └── proxy/...               # endpoint butuh cookie/stream
├── components/
│   ├── ui/                         # komponen shadcn/ui
│   └── shared/                     # DataTable, Pagination, StatusBadge, dll.
├── lib/
│   ├── api.ts                      # server fetch + cookie + error handling
│   ├── session.ts                  # baca/refresh sesi
│   └── format.ts                   # IDR, tanggal, label enum
├── types/                          # mirror model & enum Prisma
├── docs/                           # dokumentasi ini
└── middleware.ts                   # proteksi route + cek role
```

---

## 4. Konvensi

1. **Import & tipe**: tipe domain di `types/` disalin dari `Backend/prisma/schema.prisma`
   dan `src/generated/prisma/enums.ts`.
2. **Enum** (nilai persis, UPPERCASE): `UserRole`, `PartnerStatus`, `VehicleType`,
   `OrderStatus`, `PaymentMethod`, `PaymentStatus`, `PromoType`.
3. **Pagination**: response list backend selalu `{ data, meta: { page, limit, total } }`.
4. **`Decimal` Prisma** ter-serialisasi sebagai **string** di JSON → selalu konversi
   lewat helper `lib/format.ts`. Tanggal berupa ISO string.
5. **Format mata uang**: Rupiah, `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`.
6. **Error backend**: `{ statusCode, message, error }`; `message` bisa string atau array.
   Helper `lib/api.ts` menormalkan jadi pesan siap-tampil (Bahasa Indonesia dari backend).
7. **Mutasi**: wajib konfirmasi untuk aksi destruktif (approve/reject/suspend/resolve/mark-paid).
8. **Penamaan route** memakai istilah domain; label UI Bahasa Indonesia.

---

## 5. Daftar Modul

| Kode | Modul | Route | Endpoint utama | Status |
|---|---|---|---|---|
| M0 | Fondasi & Setup | – | (backend: CORS, PORT, seed) | ✅ Selesai |
| M1 | Autentikasi & Proteksi | `/login` | `POST /auth/login`, `/refresh`, `/logout`, `GET /auth/me` | ✅ Selesai |
| M2 | Dashboard Ringkasan | `/dashboard` | `GET /admin/dashboard` | ✅ Selesai |
| M3 | Verifikasi Partner | `/partners` | `GET /partners`, `GET /partners/:id`, `approve/reject/suspend`, `documents` | ✅ Selesai |
| M4 | Manajemen Order (+ M11 Tracking) | `/orders` | `GET /orders`, `GET /orders/:id`, `tracking/*` | ⬜ Belum |
| M5 | Pembayaran | `/payments` | `GET /payments`, `PATCH /payments/:id/mark-paid` | ⬜ Belum |
| M6 | Harga (Zona & Promo) | `/pricing/*` | `GET/POST/PATCH /pricing/zones`, `/promos` | ⬜ Belum |
| M7 | Dispute | `/disputes` | `GET /admin/disputes`, `PATCH /admin/disputes/:id/resolve` | ⬜ Belum |
| M8 | Pencairan (Withdrawal) | `/withdrawals` | `GET/POST /admin/withdrawals`, `refresh-status` | ⬜ Belum |

Keterangan status: ⬜ Belum · 🟡 Sedang dikerjakan · ✅ Selesai

---

## 6. Referensi Endpoint Backend

Base URL: `http://localhost:3001` (tanpa global prefix). Semua kecuali webhook
memerlukan header `Authorization: Bearer <accessToken>`.

### Auth
| Method | Path | Role |
|---|---|---|
| POST | `/auth/login` | publik |
| POST | `/auth/refresh` | publik |
| POST | `/auth/logout` | publik |
| GET | `/auth/me` | semua login |

### Admin
| Method | Path | Role |
|---|---|---|
| GET | `/admin/dashboard` | ADMIN, SUPER_ADMIN |
| GET | `/admin/disputes` | ADMIN, SUPER_ADMIN |
| PATCH | `/admin/disputes/:id/resolve` | ADMIN, SUPER_ADMIN |
| GET | `/admin/withdrawals` | ADMIN, SUPER_ADMIN |
| POST | `/admin/withdrawals` | ADMIN, SUPER_ADMIN |
| PATCH | `/admin/withdrawals/:id/refresh-status` | ADMIN, SUPER_ADMIN |

### Partner
| Method | Path | Role |
|---|---|---|
| GET | `/partners` | ADMIN, SUPER_ADMIN |
| GET | `/partners/:id` | ADMIN, SUPER_ADMIN |
| PATCH | `/partners/:id/approve` | ADMIN, SUPER_ADMIN |
| PATCH | `/partners/:id/reject` | ADMIN, SUPER_ADMIN |
| PATCH | `/partners/:id/suspend` | ADMIN, SUPER_ADMIN |
| GET | `/partners/:id/documents/:type` (`ktp`\|`sim`) | pemilik / admin |

### Order
| Method | Path | Role |
|---|---|---|
| GET | `/orders` | ADMIN, SUPER_ADMIN |
| GET | `/orders/:id` | ADMIN, SUPER_ADMIN |
| GET | `/tracking/orders/:orderId/latest` | admin/pemilik |
| GET | `/tracking/orders/:orderId/history` | admin/pemilik |

### Payment
| Method | Path | Role |
|---|---|---|
| GET | `/payments` | ADMIN, SUPER_ADMIN |
| PATCH | `/payments/:id/mark-paid` | PARTNER, ADMIN, SUPER_ADMIN |
| GET | `/payments/order/:orderId` | admin/pemilik |

### Pricing
| Method | Path | Role |
|---|---|---|
| GET | `/pricing/zones` | publik |
| POST | `/pricing/zones` | ADMIN, SUPER_ADMIN |
| PATCH | `/pricing/zones/:id` | ADMIN, SUPER_ADMIN |
| PATCH | `/pricing/zones/:id/deactivate` | ADMIN, SUPER_ADMIN |
| GET | `/pricing/promos` | ADMIN, SUPER_ADMIN |
| POST | `/pricing/promos` | ADMIN, SUPER_ADMIN |
| PATCH | `/pricing/promos/:id` | ADMIN, SUPER_ADMIN |

### Vehicle (baca dokumen)
| Method | Path | Role |
|---|---|---|
| GET | `/vehicles/:id/files/:kind` (`stnk`\|`photo`) | pemilik / admin |

---

## 7. Batasan dan Kendala

- **Tidak ada endpoint** untuk: manajemen user/customer, manajemen admin, payout partner
  (`Payout` model ada tanpa controller), dan notifikasi. Modul terkait tidak dibuat.
- **Tidak ada endpoint pencarian** di list; pencarian dilakukan client-side bila perlu.
- **Dokumen (KTP/SIM/STNK)** hanya bisa diambil lewat endpoint ber-Auth dan mengembalikan
  stream gambar → harus lewat Route Handler proxy, bukan `<img src>` langsung.
- **Google Maps** butuh API key dengan billing aktif dan hanya dapat dirender di
  Client Component.
- **Belum ada admin** di database → disiapkan seed script di M0.

---

## 8. Cara Memakai Dokumentasi

1. Baca `README.md` ini untuk gambaran besar & konvensi.
2. Kerjakan modul berurutan mulai M0.
3. Sebelum mulai sebuah modul, buka file di `modul/` dan selesaikan sesuai
   **Acceptance Criteria**.
4. Perbarui status di tabel [Daftar Modul](#daftar-modul) setelah modul selesai
   (`⬜ → 🟡 → ✅`).

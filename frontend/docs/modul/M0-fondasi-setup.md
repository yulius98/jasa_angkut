# M0 — Fondasi & Setup

**Tujuan:** menyiapkan fondasi aplikasi frontend admin sebelum modul fitur dibangun.
Modul ini tidak menampilkan fitur bisnis, tetapi menyediakan kerangka, konvensi, koneksi
API, komponen dasar, dan prasyarat backend.

**Status:** ✅ Selesai

---

## Dependency

- Tidak ada (modul pertama).

---

## Langkah Pengerjaan

### 1. Pelajari Next.js versi ini
- Baca dokumentasi di `frontend/node_modules/next/dist/docs/` (versi ini punya
  breaking changes; jangan berasumsi dari pengetahuan umum).
- Konfirmasi pola App Router, Server Component, Route Handler, `middleware.ts`, dan
  cara penanganan cookie.

### 2. Inisialisasi UI & tooling
- Init **shadcn/ui** (`components.json`, folder `components/ui`).
- Pasang: `next-themes`, `lucide-react`, `sonner`, `react-hook-form`, `zod`,
  `@hookform/resolvers`, `dayjs` (atau `date-fns`).
- Pastikan Tailwind v4 terkonfigurasi (sudah ada) dan variabel tema shadcn terpasang.

### 3. Perubahan Backend (kecil, prasyarat)
- `Backend/src/main.ts`: aktifkan CORS (`app.enableCors({ origin, credentials })`).
- `Backend/.env`: tetapkan `PORT=3001`.
- Buat **Prisma seed** `Backend/prisma/seed.ts` untuk membuat user `SUPER_ADMIN`
  pertama (email+password dari env, password di-hash bcrypt, plus `AdminProfile`).
  Tambahkan script `prisma.seed` di `package.json`.

### 4. Environment frontend
- `frontend/.env.local`:
  ```
  BACKEND_URL=http://localhost:3001
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=      # diisi di M4
  ```

### 5. Struktur & helper
- `types/` — salinan tipe model & enum dari `schema.prisma` + `enums.ts`.
- `lib/api.ts` — wrapper `fetch` server-side: base URL, header Authorization (dari cookie),
  normalisasi error backend menjadi pesan siap tampil.
- `lib/format.ts` — `formatRupiah`, `formatTanggal`, `formatDateTime`, konversi Decimal
  string → number, pemetaan label/warna enum.
- `lib/session.ts` — baca sesi (cookie) & util token (dipakai penuh di M1).

### 6. Shell dashboard
- `app/(dashboard)/layout.tsx`: sidebar (navigasi ke semua modul), topbar (nama admin,
  toggle tema, logout), area konten responsif.
- Komponen bersama di `components/shared/`:
  - `DataTable` (kolom generik), `Pagination`, `StatusBadge`, `EmptyState`,
    `LoadingSkeleton`, `ConfirmDialog`, `PageHeader`, `FilterBar`.

---

## Deliverable

- Aplikasi bisa dijalankan (`pnpm dev`) tanpa error.
- Shell dashboard tampil dengan dark mode toggle.
- Seed admin berhasil; login backend manual (mis. lewat curl) mengembalikan token.
- `lib/api.ts` mampu memanggil `GET /auth/me` / endpoint publik backend.

---

## Acceptance Criteria

- [x] Dokumentasi Next.js versi ini sudah dibaca dan pola yang dipakai sesuai.
- [x] shadcn/ui + next-themes + sonner terpasang & berfungsi.
- [x] CORS backend aktif; backend berjalan di `:3001`.
- [x] Seed admin jalan (`pnpm db:seed`) dan menghasilkan 1 SUPER_ADMIN.
- [x] `.env.local` frontend terisi.
- [x] `types/`, `lib/api.ts`, `lib/format.ts`, `lib/session.ts` tersedia.
- [x] Shell dashboard + komponen dasar (`components/shared`) tersedia & responsif.
- [x] `pnpm lint` dan `pnpm build` frontend lolos.

---

## Catatan

- Jangan commit `.env`, `.env.local`, atau `uploads/`.
- Perubahan Backend di sini seminimal mungkin; hanya CORS, PORT, dan seed.
- Simpan password admin default di env seed, bukan hardcode di file yang di-commit.

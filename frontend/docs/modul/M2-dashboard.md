# M2 — Dashboard Ringkasan

**Tujuan:** halaman utama berisi ringkasan kondisi bisnis untuk admin.

**Status:** ✅ Selesai · **Bergantung pada:** M0, M1

---

## Endpoint Backend

`GET /admin/dashboard` (role ADMIN, SUPER_ADMIN)

Bentuk response:

```jsonc
{
  "orders": {
    "total": 0,
    "byStatus": {
      "PENDING": 0, "CONFIRMED": 0, "DRIVER_ASSIGNED": 0, "EN_ROUTE_TO_PICKUP": 0,
      "ARRIVED_AT_PICKUP": 0, "LOADING": 0, "IN_TRANSIT": 0, "ARRIVED_AT_DROPOFF": 0,
      "UNLOADING": 0, "COMPLETED": 0, "CANCELLED": 0, "DISPUTED": 0
    }
  },
  "customers": { "total": 0 },
  "partners": {
    "byStatus": { "PENDING": 0, "APPROVED": 0, "REJECTED": 0, "SUSPENDED": 0 }
  },
  "revenue": { "gmv": 0, "totalCommission": 0 },
  "disputes": { "open": 0 }
}
```

---

## Rancangan

- Route: `/dashboard` (Server Component, `GET /admin/dashboard`).
- Kartu ringkasan (stat cards):
  - **Total Order** + total customer.
  - **GMV** (format Rupiah) + **Total Komisi** (format Rupiah).
  - **Partner** (total dari byStatus, highlight PENDING yang butuh verifikasi).
  - **Dispute terbuka** (link ke `/disputes?status=open`).
- Distribusi **order per status** (semua status tetap ditampilkan, termasuk 0) —
  gunakan bar/daftar dengan `StatusBadge`.
- Distribusi **partner per status**.
- Pintasan aksi: verifikasi partner pending, dispute open, order berjalan.

## Komponen
- `StatCard`, `StatusDistribution`, `StatusBadge`, `PageHeader`, `ErrorState`.

## Catatan Implementasi
- `app/(dashboard)/dashboard/page.tsx` (Server Component) memakai `serverFetch` dan
  `{ cache: "no-store" }`; pada error non-`ApiError` (mis. redirect refresh) error
  dilempar ulang agar redirect tidak tertelan `try/catch`.
- `loading.tsx` di direktori yang sama menyediakan skeleton (Suspense).
- Nilai uang memakai `formatRupiah` (Rp + non-breaking space + titik ribuan).
- Kartu mitra & dispute bisa menjadi tautan kontekstual: link ke `/partners?status=PENDING`
  bila ada pending, ke `/disputes?status=open` bila ada dispute terbuka.

---

## Acceptance Criteria

- [x] Semua metrik pada response tampil dan akurat.
- [x] Nilai 0 tetap ditampilkan (bukan disembunyikan).
- [x] Nilai uang diformat Rupiah.
- [x] Tautan pintasan mengarah ke modul terkait dengan filter yang sesuai.
- [x] Ada penanganan loading (skeleton) dan error.
- [x] `pnpm lint` & `pnpm build` lolos.

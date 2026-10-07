# M2 — Dashboard Ringkasan

**Tujuan:** halaman utama berisi ringkasan kondisi bisnis untuk admin.

**Status:** ⬜ Belum · **Bergantung pada:** M0, M1

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
- `StatCard`, `StatusDistribution`, `StatusBadge`, `PageHeader`.

---

## Acceptance Criteria

- [ ] Semua metrik pada response tampil dan akurat.
- [ ] Nilai 0 tetap ditampilkan (bukan disembunyikan).
- [ ] Nilai uang diformat Rupiah.
- [ ] Tautan pintasan mengarah ke modul terkait dengan filter yang sesuai.
- [ ] Ada penanganan loading (skeleton) dan error.
- [ ] `pnpm lint` & `pnpm build` lolos.

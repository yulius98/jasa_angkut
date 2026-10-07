# M4 — Manajemen Order (+ M11 Tracking)

**Tujuan:** admin memantau seluruh order dan melihat detail perjalanan, termasuk
posisi partner di peta dan histori lokasi.

**Status:** ⬜ Belum · **Bergantung pada:** M0, M1
**Tergabung:** M11 — Tracking (Google Maps)

---

## Endpoint Backend

| Method | Path | Query | Keterangan |
|---|---|---|---|
| GET | `/orders` | `status?`, `page?`, `limit?` | daftar semua order |
| GET | `/orders/:id` | – | detail + `partner`, `vehicle`, `statusHistory` |
| GET | `/payments/order/:orderId` | – | pembayaran order (bila ada) |
| GET | `/tracking/orders/:orderId/latest` | – | titik lokasi terakhir |
| GET | `/tracking/orders/:orderId/history` | `limit?` (default 500) | histori titik |

`OrderStatus`: `PENDING|CONFIRMED|DRIVER_ASSIGNED|EN_ROUTE_TO_PICKUP|ARRIVED_AT_PICKUP|
LOADING|IN_TRANSIT|ARRIVED_AT_DROPOFF|UNLOADING|COMPLETED|CANCELLED|DISPUTED`.
`VehicleType`: `MOTORCYCLE|PICKUP|BOX_TRUCK|LARGE_TRUCK`.

---

## Rancangan

### Halaman `/orders`
- Tabel: `orderNumber`, tanggal, tipe kendaraan, alamat pickup→dropoff (ringkas),
  harga final (Rupiah), status (`StatusBadge`), partner (bila ada).
- Filter status + pagination (server-side).
- Aksi baris: detail.

### Halaman `/orders/[id]`
- **Ringkasan**: orderNumber, status, tanggal dibuat/confirmed/completed.
- **Rute**: alamat & koordinat pickup/dropoff, `distanceKm`, deskripsi barang,
  `scheduledAt`.
- **Harga**: `estimatedPrice`, `discountAmount`, `finalPrice`.
- **Partner & kendaraan**: nama/telepon partner, rating; kendaraan (plat, tipe, brand/model).
- **Histori status** (`statusHistory`): timeline status + catatan + waktu.
- **Pembayaran**: metode, status, amount, komisi, partner earning (bila ada).
- **Peta (M11)**: Google Maps Client Component.
  - Marker pickup & dropoff.
  - Marker posisi partner (dari `latest`) + polyline dari `history`.
  - Auto-refresh berkala saat status order aktif (`DRIVER_ASSIGNED`..`UNLOADING`).
  - Fallback bila belum ada titik: tampilkan pesan, peta tetap render.

## Komponen
- `DataTable`, `Pagination`, `StatusBadge`, `OrderTimeline`, `OrderMap` (client),
  `PriceSummary`, `PageHeader`.

## Konfigurasi
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` di `.env.local`.
- Library `@vis.gl/react-google-maps`.
- Route proxy tidak diperlukan (koordinat datang sebagai JSON via server fetch),
  kecuali butuh polling dari client → sediakan `app/api/proxy/tracking/[orderId]/route.ts`
  yang meneruskan cookie.

---

## Acceptance Criteria

- [ ] List + filter status + pagination berjalan.
- [ ] Detail menampilkan seluruh bagian di atas.
- [ ] Peta menampilkan pickup, dropoff, posisi partner, dan polyline histori.
- [ ] Peta ter-render dengan API key valid; ada fallback yang jelas tanpa titik.
- [ ] Timeline status berurutan (asc) sesuai backend.
- [ ] Semua nilai uang & jarak diformat.
- [ ] `pnpm lint` & `pnpm build` lolos.

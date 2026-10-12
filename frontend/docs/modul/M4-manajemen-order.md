# M4 — Manajemen Order (+ M11 Tracking)

**Tujuan:** admin memantau seluruh order dan melihat detail perjalanan, termasuk
posisi partner di peta dan histori lokasi.

**Status:** ✅ Selesai · **Bergantung pada:** M0, M1
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

## Catatan Implementasi

- **Relasi di list**: `GET /orders` semula hanya kolom scalar. `OrdersService`
  kini menyertakan ringkasan `partner` (nama/telepon/rating), `customer` (nama), dan
  `vehicle` (tipe/plat/brand/model) lewat `INCLUDE_LIST`; `INCLUDE_DETAIL` juga
  menambahkan `customer`. Tidak ada field yang dihapus (kontrak API tetap).
- **List `/orders`**: kolom No. Order (+ tanggal), tipe kendaraan, rute (pickup →
  dropoff), harga (`finalPrice` fallback `estimatedPrice`), status, pelanggan,
  mitra, dan aksi detail. Filter status + pagination server-side seperti M3.
- **Detail `/orders/[id]`**: server component memanggil paralel
  `GET /orders/:id`, `GET /payments/order/:orderId`,
  `GET /tracking/orders/:orderId/latest` dan `/history?limit=500`. Panggilan
  sekunder memakai `fetchOptional` — bila 404/gagal, halaman tetap tampil
  (bagian Pembayaran menampilkan "belum ada data", peta tetap dirender).
- **Polling peta**: `app/api/proxy/tracking/[orderId]/route.ts` menggabungkan
  `latest` + `history` dalam satu respons (bila `latest` 404 → snapshot kosong),
  memvalidasi UUID, memeriksa role admin, dan me-rotate access token bila perlu.
  `OrderMap` (client) poll tiap **10 detik** hanya selama status ∈
  `DRIVER_ASSIGNED`..`UNLOADING` (disalin dari `ACTIVE_ORDER_STATUSES` backend);
  berhenti otomatis saat status final.
- **Peta**: `@vis.gl/react-google-maps` (+ `@types/google.maps`). Marker pickup
  (hijau), dropoff (merah), posisi mitra (biru) berupa simbol lingkaran; polyline
  biru dari `history`. `defaultBounds` dihitung dari kedua titik (dengan padding
  agar tidak nol). Bila API key kosong → placeholder yang menjelaskan cara
  mengisi `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; bila belum ada titik → peta tetap
  render dengan overlay "Belum ada titik lokasi mitra".
- **Timeline**: `OrderTimeline` mengurutkan `statusHistory` ascending (jaring
  pengaman) lalu menampilkan `StatusBadge` + catatan + waktu.

---

## Acceptance Criteria

- [x] List + filter status + pagination berjalan.
- [x] Detail menampilkan seluruh bagian di atas.
- [x] Peta menampilkan pickup, dropoff, posisi partner, dan polyline histori.
- [x] Peta ter-render dengan API key valid; ada fallback yang jelas tanpa titik.
- [x] Timeline status berurutan (asc) sesuai backend.
- [x] Semua nilai uang & jarak diformat.
- [x] `pnpm lint` & `pnpm build` lolos.

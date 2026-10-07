# M6 — Harga (Zona & Promo)

**Tujuan:** admin mengelola zona tarif dan kode promo.

**Status:** ⬜ Belum · **Bergantung pada:** M0, M1

---

## Endpoint Backend

### Zona Tarif (`PricingZone`)
| Method | Path | Body | Keterangan |
|---|---|---|---|
| GET | `/pricing/zones` | query `vehicleType?` | publik |
| POST | `/pricing/zones` | lihat bawah | ADMIN, SUPER_ADMIN |
| PATCH | `/pricing/zones/:id` | partial + `isActive` | ADMIN, SUPER_ADMIN |
| PATCH | `/pricing/zones/:id/deactivate` | – | soft disable |

Field zona: `name` (string), `vehicleType` (enum), `baseFare` (>0, 2 desimal),
`perKmRate` (>0, 2 desimal), `minDistance` (≥0, 2 desimal), `isActive`.

### Kode Promo (`PromoCode`)
| Method | Path | Body | Keterangan |
|---|---|---|---|
| GET | `/pricing/promos` | – | ADMIN, SUPER_ADMIN |
| POST | `/pricing/promos` | lihat bawah | ADMIN, SUPER_ADMIN |
| PATCH | `/pricing/promos/:id` | partial **tanpa `code`** + `isActive` | ADMIN, SUPER_ADMIN |

Field promo: `code` (`^[A-Z0-9_-]{3,30}$`, hanya saat create), `type`
(`PERCENTAGE|FIXED_AMOUNT`), `value` (>0), `maxDiscount?` (>0), `minOrderValue?` (≥0),
`usageLimit?` (int >0), `validFrom`, `validUntil` (validUntil > validFrom).
`usedCount` & `isActive` read-only dikelola backend.

---

## Rancangan

### Halaman `/pricing/zones`
- Tabel: name, vehicleType, baseFare, perKmRate, minDistance, isActive.
- Filter vehicleType (opsional).
- Aksi: **Tambah**, **Edit**, **Nonaktifkan** (konfirmasi). Form modal/drawer.
- Catatan: `estimate` memakai zona aktif terbaru per `vehicleType`.

### Halaman `/pricing/promos`
- Tabel: code, type, value, maxDiscount, minOrderValue, usageLimit/usedCount,
  validFrom, validUntil, isActive.
- Aksi: **Tambah**, **Edit** (code tidak dapat diubah — tampilkan disabled), toggle aktif.
- Konversi tanggal ke/dari ISO.

## Komponen
- `DataTable`, `StatusBadge`, `Dialog`/`Sheet`, form (`react-hook-form` + zod),
  `DatePicker`/input tanggal, sel mata uang.

---

## Acceptance Criteria

- [ ] List zona & promo tampil.
- [ ] Create/update zona berhasil; deactivate mengubah `isActive=false`.
- [ ] Create promo memvalidasi regex kode & tanggal; error backend tampil.
- [ ] Update promo tidak mengirim/mengubah `code`.
- [ ] Validasi form (angka positif, desimal ≤2, tanggal) berjalan.
- [ ] Setelah aksi, tabel diperbarui.
- [ ] `pnpm lint` & `pnpm build` lolos.

# M8 — Pencairan (Withdrawal)

**Tujuan:** admin membuat permintaan pencairan dana ke rekening bank dan memantau
statusnya.

**Status:** ✅ Selesai · **Bergantung pada:** M0, M1

---

## Endpoint Backend

| Method | Path | Body | Keterangan |
|---|---|---|---|
| GET | `/admin/withdrawals` | – | daftar semua withdrawal |
| POST | `/admin/withdrawals` | lihat bawah | membuat payout |
| PATCH | `/admin/withdrawals/:id/refresh-status` | – | sinkron status dari provider |

Body create:
`beneficiaryName` (≤100), `bankCode` (≤20), `bankAccountNumber` (≤50),
`amount` (int >0), `notes?` (≤255), `provider?` (`IRIS`|`XENDIT`, default `IRIS`).

**Format `bankCode` berbeda per provider:**
- `IRIS`: kode bank biasa (mis. `BCA`, `BNI`, `MANDIRI`).
- `XENDIT`: channel code Xendit (mis. `ID_BCA`, `ID_BNI`).

Catatan penting: sistem **hanya membuat** payout (role Creator) — **tidak** ada
auto-approve. Approval dilakukan terpisah di dashboard provider. Tampilkan info ini.

Field `status` = status dari provider (mis. `pending`, `submitted`, `failed`,
atau status asli Iris setelah sinkron).

---

## Rancangan

### Halaman `/withdrawals`
- Tabel: `referenceNo`, provider, `beneficiaryName`, `bankCode`/`bankAccountNumber`,
  `amount` (Rupiah), `status`, `submittedAt`, `lastCheckedAt`, `createdAt`.
- Aksi per baris: **Refresh Status** (konfirmasi) → `refresh-status`.
- Tombol **Buat Pencairan** → form (dialog/drawer):
  - Provider (radio IRIS/XENDIT) — mengubah hint `bankCode`.
  - `beneficiaryName`, `bankCode`, `bankAccountNumber`, `amount`, `notes`.
  - Validasi sesuai DTO; nomor rekening sebagai string.
- Tampilkan banner: pembuatan payout tidak otomatis menyetujui dana.

## Komponen
- `DataTable`, `StatusBadge`, `ConfirmDialog`, `CreateWithdrawalDialog`, form + zod,
  `PageHeader`.

---

## Catatan Implementasi

- Halaman `app/(dashboard)/withdrawals/page.tsx` (Server Component) memakai
  `serverFetch` `GET /admin/withdrawals` dengan `{ cache: "no-store" }`. Endpoint
  mengembalikan array (bukan `{ data, meta }`), jadi tanpa pagination.
- Mutasi lewat server action `lib/actions/withdrawals.ts`: `createWithdrawal`
  (`POST /admin/withdrawals`) dan `refreshWithdrawalStatus`
  (`PATCH /admin/withdrawals/:id/refresh-status`); client lalu `router.refresh()`.
- `CreateWithdrawalDialog` (react-hook-form + zod) memilih provider lewat radio
  cards; hint `bankCode` berubah sesuai provider (IRIS kode bank biasa, XENDIT
  channel code). Nomor rekening & jumlah diperlakukan sebagai string/numeric.
  Validasi mengikuti DTO: `beneficiaryName` ≤100, `bankCode` ≤20,
  `bankAccountNumber` ≤50, `amount` bilangan bulat >0, `notes` ≤255.
- `WithdrawalActions` menyediakan **Refresh Status** dengan konfirmasi.
- Banner di header menegaskan pembuatan payout tidak otomatis menyetujui dana
  (pemisahan Creator/Approver).
- Status provider ditampilkan via `withdrawalStatusMeta` (fallback label apa adanya
  untuk status asli provider yang belum dipetakan).

---

## Acceptance Criteria

- [x] List withdrawal tampil (termasuk metadata provider).
- [x] Form create memvalidasi semua field; hint `bankCode` berubah sesuai provider.
- [x] Create berhasil membuat record dan menampilkan status dari provider.
- [x] Kegagalan provider (mis. kredensial/saldo) menampilkan pesan error backend,
      record tercatat sebagai `failed`.
- [x] Refresh status memperbarui status baris.
- [x] Ada banner informasi soal tidak adanya auto-approve.
- [x] `pnpm lint` & `pnpm build` lolos.

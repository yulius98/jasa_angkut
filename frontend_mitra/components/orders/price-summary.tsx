import { formatRupiah } from "@/lib/format"

interface PriceSummaryProps {
  estimatedPrice: string
  discountAmount: string
  finalPrice: string | null
}

export function PriceSummary({
  estimatedPrice,
  discountAmount,
  finalPrice,
}: PriceSummaryProps) {
  const rows: Array<{ label: string; value: string; strong?: boolean }> = [
    { label: "Harga estimasi", value: formatRupiah(estimatedPrice) },
    { label: "Diskon promo", value: `− ${formatRupiah(discountAmount)}` },
    {
      label: "Harga final",
      value: formatRupiah(finalPrice ?? estimatedPrice),
      strong: true,
    },
  ]

  return (
    <dl className="grid gap-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className={
            row.strong
              ? "flex items-center justify-between gap-3 border-t pt-2"
              : "flex items-center justify-between gap-3"
          }
        >
          <dt
            className={
              row.strong
                ? "text-sm font-medium"
                : "text-sm text-muted-foreground"
            }
          >
            {row.label}
          </dt>
          <dd
            className={
              row.strong
                ? "text-base font-semibold tabular-nums"
                : "text-sm tabular-nums"
            }
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

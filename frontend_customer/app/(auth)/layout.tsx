import Link from "next/link"
import { Truck } from "lucide-react"

import { APP_NAME } from "@/lib/config"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background px-6 pt-safe">
      <div className="flex flex-1 flex-col justify-center py-10">
        <div className="mb-8 grid gap-2 text-center">
          <Link
            href="/"
            className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm"
          >
            <Truck className="size-7" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
          <p className="text-sm text-muted-foreground">
            Kirim barang lebih mudah, cepat, dan terpercaya.
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}

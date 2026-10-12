import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { cn } from "cn"
import { Button } from "@/components/ui/button"

interface DesktopPageHeaderProps {
  title: string
  subtitle?: string
  /** Jika diisi, tombol kembali ditampilkan (hanya desktop). */
  backHref?: string
  actions?: React.ReactNode
  className?: string
  /** Kelas lebar maksimum konten, mengikuti kontainer halaman. */
  maxWidthClassName?: string
}

/**
 * Header halaman khusus desktop/laptop (>= lg). Disembunyikan pada
 * handphone sehingga tampilan mobile tetap memakai `AppHeader`.
 */
export function DesktopPageHeader({
  title,
  subtitle,
  backHref,
  actions,
  className,
  maxWidthClassName = "max-w-6xl",
}: DesktopPageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 hidden border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:block",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-16 w-full items-center gap-3 px-8",
          maxWidthClassName
        )}
      >
        {backHref ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Kembali"
            nativeButton={false}
            render={<Link href={backHref} />}
          >
            <ChevronLeft className="size-5" />
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  )
}

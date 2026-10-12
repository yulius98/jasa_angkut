import { cn } from "cn"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

type PageEntry = number | "ellipsis"

function getPageRange(current: number, total: number): PageEntry[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: PageEntry[] = [1]
  if (current > 3) pages.push("ellipsis")

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push("ellipsis")
  pages.push(total)

  return pages
}

interface TablePaginationProps {
  page: number
  totalPages: number
  totalItems: number
  buildHref: (page: number) => string
  className?: string
}

export function TablePagination({
  page,
  totalPages,
  totalItems,
  buildHref,
  className,
}: TablePaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageRange(page, totalPages)

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <p className="text-sm text-muted-foreground">
        Menampilkan {totalItems} data
      </p>
      <Pagination className="justify-center sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              text="Sebelumnya"
              aria-label="Halaman sebelumnya"
              href={page > 1 ? buildHref(page - 1) : undefined}
            />
          </PaginationItem>

          {pages.map((entry, index) =>
            entry === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={entry}>
                <PaginationLink
                  isActive={entry === page}
                  aria-label={`Halaman ${entry}`}
                  href={buildHref(entry)}
                >
                  {entry}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              text="Berikutnya"
              aria-label="Halaman berikutnya"
              href={page < totalPages ? buildHref(page + 1) : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
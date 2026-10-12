import { redirect } from "next/navigation"

/**
 * Root app mitra → beranda. Middleware/proxy mengarahkan pengunjung yang
 * belum login ke /login.
 */
export default function RootPage() {
  redirect("/home")
}

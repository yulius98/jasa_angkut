import { redirect } from "next/navigation"

/**
 * Landing page publik kini tinggal di app terpisah (frontend_landingpage).
 * Root app pelanggan langsung menuju beranda; middleware akan mengarahkan
 * pengunjung yang belum login ke /login.
 */
export default function RootPage() {
  redirect("/home")
}

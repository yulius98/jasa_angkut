import type { Metadata } from "next"

import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Daftar",
  description:
    "Buat akun Jasa Antar gratis untuk memesan pengiriman barang dan pindahan.",
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return <RegisterForm next={next} />
}

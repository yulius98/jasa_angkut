"use client"

// Ekstensi browser (misalnya antivirus McAfee/Comodo) menyisipkan atribut
// `fdprocessedid` ke elemen <button>/<input> pada DOM server SEBELUM React
// hydrate. Ini memicu error "hydration mismatch" meskipun bukan kesalahan
// kode kita. Jalankan pembersihan di module scope (saat bundle client
// dievaluasi, sebelum hydrateRoot) supaya DOM server cocok dengan client.
if (typeof window !== "undefined") {
  for (const el of document.querySelectorAll<HTMLElement>("[fdprocessedid]")) {
    el.removeAttribute("fdprocessedid")
  }
}

export function BeforeHydrationCleanup() {
  return null
}
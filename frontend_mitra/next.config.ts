import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Unggahan foto STNK/kendaraan lewat Server Action bisa melebihi batas
    // bawaan 1MB. Naikkan agar mitra bisa mengirim foto dari kamera ponsel.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

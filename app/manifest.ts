import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pastor Rhema",
    short_name: "Pastor Rhema",
    description: "Sua plataforma de preparo de sermões com IA",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0b2a5b",
    theme_color: "#0b2a5b",
    orientation: "portrait",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KhorocBoi",
    short_name: "KhorocBoi",
    description: "Personal expense tracker with Bangla, English and Banglish input.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9fb",
    theme_color: "#0066ff",
    icons: [{ src: "/app-icon.png", sizes: "1024x1024", type: "image/png", purpose: "any" }],
  };
}

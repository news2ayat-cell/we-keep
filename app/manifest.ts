import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "We Keep",
    short_name: "We Keep",
    description:
      "A commitment tracking app for solo and mutual promises with accountability flows.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    orientation: "portrait",
    categories: ["productivity", "utilities"],
    lang: "en",
  };
}
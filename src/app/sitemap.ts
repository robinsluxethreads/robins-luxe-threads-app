import { supabase } from "@/lib/supabase";

const BASE_URL = "https://robinsluxethreads.vercel.app";

export default async function sitemap() {
  // Static pages
  const staticPages = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  // Dynamic product pages
  const { data: products } = await supabase
    .from("products")
    .select("id, created_at")
    .eq("is_active", true);

  const productPages = (products || []).map((product) => ({
    url: `${BASE_URL}/product/${product.id}`,
    lastModified: new Date(product.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}

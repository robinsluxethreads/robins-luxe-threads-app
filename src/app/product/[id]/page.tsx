import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import ProductDetail from "@/components/ProductDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string): Promise<Product | null> {
  const { data } = await supabase
    .from("products")
    .select("id, name, price, old_price, category, description, sizes, badge, emoji, images, is_active")
    .eq("id", Number(id))
    .eq("is_active", true)
    .single();
  return data as Product | null;
}

async function getRelatedProducts(category: string, excludeId: number): Promise<Product[]> {
  const { data } = await supabase
    .from("products")
    .select("id, name, price, old_price, category, emoji, images, badge, is_active, sizes, description")
    .eq("category", category)
    .eq("is_active", true)
    .neq("id", excludeId)
    .limit(4);
  return (data as Product[]) || [];
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return { title: "Product Not Found | Robins Luxe Threads" };
  }
  const description =
    product.description ||
    `Shop ${product.name} at Robins Luxe Threads. ${formatPrice(product.price)}`;
  const imageUrl = product.images?.[0] || undefined;
  return {
    title: `${product.name} | Robins Luxe Threads`,
    description,
    openGraph: {
      title: `${product.name} | Robins Luxe Threads`,
      description,
      images: imageUrl ? [imageUrl] : undefined,
      url: `https://robinsluxethreads.vercel.app/product/${id}`,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: `${product.name} | Robins Luxe Threads`,
      description,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.category, product.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} - Luxury fashion from Robins Luxe Threads`,
    image: product.images?.[0] || undefined,
    category: product.category,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability: product.is_active
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={product} relatedProducts={relatedProducts} />
    </>
  );
}

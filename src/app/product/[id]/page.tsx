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
    .select("*")
    .eq("id", Number(id))
    .single();
  return data as Product | null;
}

async function getRelatedProducts(category: string, excludeId: number): Promise<Product[]> {
  const { data } = await supabase
    .from("products")
    .select("*")
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
  return {
    title: `${product.name} | Robins Luxe Threads`,
    description: product.description || `Shop ${product.name} at Robins Luxe Threads. ${formatPrice(product.price)}`,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.category, product.id);

  return <ProductDetail product={product} relatedProducts={relatedProducts} />;
}

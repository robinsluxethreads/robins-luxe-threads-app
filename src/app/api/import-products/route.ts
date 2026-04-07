import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ImportProduct {
  name: string;
  price: number;
  old_price?: number | null;
  category: string;
  description?: string;
  sizes?: string[];
  badge?: string | null;
  emoji?: string | null;
  stock_quantity?: number;
  low_stock_threshold?: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { products, adminEmail } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "No products to import" }, { status: 400 });
    }

    if (products.length > 500) {
      return NextResponse.json({ error: "Maximum 500 products per import" }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const validProducts: ImportProduct[] = [];

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const rowNum = i + j + 1;

        // Validate required fields
        if (!row.name || !row.name.trim()) {
          errors.push(`Row ${rowNum}: Missing name`);
          errorCount++;
          continue;
        }
        if (!row.price || isNaN(Number(row.price)) || Number(row.price) <= 0) {
          errors.push(`Row ${rowNum}: Invalid price`);
          errorCount++;
          continue;
        }
        if (!row.category || !row.category.trim()) {
          errors.push(`Row ${rowNum}: Missing category`);
          errorCount++;
          continue;
        }

        validProducts.push({
          name: row.name.trim(),
          price: Number(row.price),
          old_price: row.old_price ? Number(row.old_price) : null,
          category: row.category.trim(),
          description: row.description?.trim() || "",
          sizes: row.sizes || [],
          badge: row.badge?.trim() || null,
          emoji: row.emoji?.trim() || null,
          stock_quantity: row.stock_quantity !== undefined ? Number(row.stock_quantity) : 100,
          low_stock_threshold: row.low_stock_threshold !== undefined ? Number(row.low_stock_threshold) : 10,
        });
      }

      if (validProducts.length > 0) {
        const insertData = validProducts.map((p) => ({
          ...p,
          is_active: true,
          images: [],
        }));

        const { error } = await supabaseAdmin.from("products").insert(insertData);
        if (error) {
          errors.push(`Batch starting at row ${i + 1}: ${error.message}`);
          errorCount += validProducts.length;
        } else {
          successCount += validProducts.length;
        }
      }
    }

    // Log the import activity
    if (adminEmail) {
      await supabaseAdmin.from("activity_log").insert({
        admin_email: adminEmail,
        action: "created",
        entity_type: "product",
        entity_id: null,
        details: { import: true, success_count: successCount, error_count: errorCount },
      });
    }

    return NextResponse.json({
      success: true,
      successCount,
      errorCount,
      errors: errors.slice(0, 20), // Return max 20 errors
    });
  } catch (error) {
    console.error("Import products error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json(
      { error: "Failed to import products" },
      { status: 500 }
    );
  }
}

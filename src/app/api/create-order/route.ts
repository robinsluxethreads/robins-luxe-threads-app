import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/validation";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    // Rate limit: 10 per hour per IP
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = rateLimit(`create-order:${ip}`, 10, 3600000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Body size check
    const text = await request.text();
    if (text.length > 51200) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }

    const body = JSON.parse(text);
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    if (items.length > 50) {
      return NextResponse.json({ error: "Too many items in order" }, { status: 400 });
    }

    // Validate items exist and recalculate prices server-side
    const productIds = items.map((item: { productId: number }) => item.productId);
    const { data: dbProducts, error: dbError } = await supabase
      .from("products")
      .select("id, price, name, is_active")
      .in("id", productIds);

    if (dbError || !dbProducts) {
      return NextResponse.json(
        { error: "Failed to validate products" },
        { status: 500 }
      );
    }

    // Check all products exist and are active
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    for (const item of items) {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) {
        return NextResponse.json(
          { error: `Product not found: ${item.name || item.productId}` },
          { status: 400 }
        );
      }
      if (!dbProduct.is_active) {
        return NextResponse.json(
          { error: `Product is no longer available: ${dbProduct.name}` },
          { status: 400 }
        );
      }
    }

    // Recalculate total server-side
    let serverSubtotal = 0;
    for (const item of items) {
      const dbProduct = productMap.get(item.productId)!;
      const qty = Math.max(1, Math.min(item.quantity || 1, 99));
      serverSubtotal += dbProduct.price * qty;
    }

    const serverShipping = serverSubtotal >= 5000 ? 0 : 99;
    const serverTotal = serverSubtotal + serverShipping;

    if (serverTotal <= 0) {
      return NextResponse.json({ error: "Invalid order amount" }, { status: 400 });
    }

    // Amount in paise (INR smallest unit)
    const amountInPaise = Math.round(serverTotal * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return NextResponse.json({
      razorpay_order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Create order error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}

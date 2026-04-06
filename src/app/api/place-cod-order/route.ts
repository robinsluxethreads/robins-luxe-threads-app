import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `RLT-${date}-${seq}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, shipping_address, customer, subtotal, shipping, total } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    const orderNumber = generateOrderNumber();
    const fullAddress = `${shipping_address.address}, ${shipping_address.city}, ${shipping_address.state} - ${shipping_address.pincode}`;

    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        shipping_address: fullAddress,
        items,
        subtotal,
        shipping,
        tax: 0,
        total,
        payment_method: "cod",
        payment_status: "pending",
        payment_id: null,
        order_status: "confirmed",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to place order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order_id: data.id,
      order_number: orderNumber,
    });
  } catch (error) {
    console.error("Place COD order error:", error);
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 }
    );
  }
}

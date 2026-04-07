import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();

    if (!code || typeof subtotal !== "number") {
      return NextResponse.json(
        { valid: false, message: "Invalid request" },
        { status: 400 }
      );
    }

    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !coupon) {
      return NextResponse.json({
        valid: false,
        message: "Invalid coupon code",
      });
    }

    // Check active
    if (!coupon.is_active) {
      return NextResponse.json({
        valid: false,
        message: "This coupon is no longer active",
      });
    }

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        message: "This coupon has expired",
      });
    }

    // Check max uses
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({
        valid: false,
        message: "This coupon has reached its usage limit",
      });
    }

    // Check min order
    if (coupon.min_order && subtotal < coupon.min_order) {
      return NextResponse.json({
        valid: false,
        message: `Minimum order of \u20B9${coupon.min_order.toLocaleString("en-IN")} required`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === "percentage") {
      discount = Math.round((subtotal * coupon.value) / 100);
    } else {
      discount = coupon.value;
    }

    // Don't let discount exceed subtotal
    discount = Math.min(discount, subtotal);

    return NextResponse.json({
      valid: true,
      discount,
      message: `Coupon applied! You save \u20B9${discount.toLocaleString("en-IN")}`,
      couponDetails: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
    });
  } catch {
    return NextResponse.json(
      { valid: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}

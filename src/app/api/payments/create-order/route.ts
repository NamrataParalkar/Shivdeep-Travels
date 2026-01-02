import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";

interface RazorpayOrderRequest {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RazorpayOrderRequest;

    const { amount, currency = "INR", receipt, notes = {} } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    if (!RAZORPAY_KEY_ID) {
      console.error("RAZORPAY_KEY_ID not configured");
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    // Call Razorpay API to create order
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET || ""}`
        ).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to paisa
        currency,
        receipt: receipt || `order-${Date.now()}`,
        notes,
      }),
    });

    if (!razorpayResponse.ok) {
      const error = await razorpayResponse.text();
      console.error("Razorpay error:", error);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    const order = await razorpayResponse.json();

    return NextResponse.json(
      {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

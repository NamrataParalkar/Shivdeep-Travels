import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabaseClient";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const payload = JSON.parse(body);
    const event = payload.event;
    const data = payload.data.payment;

    if (event === "payment.authorized" || event === "payment.captured") {
      // Payment successful
      const orderId = data.notes?.order_id || data.order_id;
      const paymentId = data.id;
      const amount = data.amount / 100; // Convert paisa to rupees

      if (!orderId) {
        console.error("No order ID found in webhook");
        return NextResponse.json(
          { error: "No order ID in webhook" },
          { status: 400 }
        );
      }

      // Use service role to update payment
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          gateway_payment_id: paymentId,
          status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("gateway_order_id", orderId)
        .eq("status", "pending");

      if (updateError) {
        console.error("Error updating payment:", updateError);
        return NextResponse.json(
          { error: "Failed to update payment" },
          { status: 500 }
        );
      }

      // Get the payment to generate invoice
      const { data: paymentData } = await supabase
        .from("payments")
        .select("id")
        .eq("gateway_order_id", orderId)
        .single();

      if (paymentData) {
        // Generate invoice
        const invoiceNumber = `INV-${new Date()
          .toISOString()
          .split("T")[0]
          .replace(/-/g, "")}-${paymentData.id}`;

        await supabase.from("payment_invoices").insert({
          payment_id: paymentData.id,
          invoice_number: invoiceNumber,
        });
      }

      return NextResponse.json({ status: "ok" }, { status: 200 });
    } else if (event === "payment.failed") {
      // Payment failed
      const orderId = data.notes?.order_id || data.order_id;

      if (!orderId) {
        return NextResponse.json(
          { error: "No order ID in webhook" },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from("payments")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("gateway_order_id", orderId)
        .eq("status", "pending");

      if (updateError) {
        console.error("Error updating failed payment:", updateError);
        return NextResponse.json(
          { error: "Failed to update payment" },
          { status: 500 }
        );
      }

      return NextResponse.json({ status: "ok" }, { status: 200 });
    }

    // Ignore other events
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

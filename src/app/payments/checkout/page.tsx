"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getPaymentById, markPaymentPaid } from "@/lib/payments";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentCheckoutPage() {
  const router = useRouter();
  const params = useSearchParams();
  const paymentIdParam = params.get("paymentId");

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any | null>(null);
  const [method, setMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      if (!paymentIdParam) {
        setErrorMsg("Missing paymentId");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const id = parseInt(paymentIdParam, 10);
        const { data, error } = await getPaymentById(id);
        if (error || !data) {
          setErrorMsg("Failed to load payment");
        } else {
          setPayment(data);
        }
      } catch (e) {
        console.error(e);
        setErrorMsg("Failed to load payment");
      } finally {
        setLoading(false);
      }
    })();
  }, [paymentIdParam]);

  const handleBack = () => router.push("/payments");

  const handleProceed = async () => {
    if (!payment) return;
    setProcessing(true);
    setErrorMsg("");

    try {
      const orderResp = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payment.amount,
          currency: "INR",
          receipt: 'payment-' + payment.id,
          notes: { payment_id: payment.id },
        }),
      });

      if (!orderResp.ok) {
        setErrorMsg("Failed to create payment order");
        setProcessing(false);
        return;
      }

      const order = await orderResp.json();

      await supabase.from("payments").update({ gateway_order_id: order.id, payment_method: method }).eq("id", payment.id);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(payment.amount * 100),
        currency: "INR",
        name: "School Bus Management",
        description: 'Bus Payment - ' + payment.month + '/' + payment.year,
        order_id: order.id,
        handler: function (response: any) {
          setTimeout(() => {
            router.push('/payments/success?orderId=' + order.id + '&paymentId=' + response.razorpay_payment_id);
          }, 600);
        },
        prefill: { name: "" },
        theme: { color: "#3B82F6" },
        modal: { ondismiss: () => setProcessing(false) },
      } as any;

      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) {
        setErrorMsg("Razorpay not loaded. Refresh the page.");
        setProcessing(false);
        return;
      }

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      setErrorMsg("Payment initiation failed");
      setProcessing(false);
    }
  };

  const handleManualPay = async () => {
    if (!payment) return;
    setProcessing(true);
    try {
      const { data, error } = await markPaymentPaid(payment.id);
      if (error || !data) {
        setErrorMsg("Failed to mark payment as paid");
        router.push("/payments?status=failure");
        return;
      }
      router.push("/payments?status=success");
    } catch (e) {
      console.error(e);
      router.push("/payments?status=failure");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  if (!payment) {
    return (
      <div className="p-8">
        <button onClick={handleBack} className="mb-4 inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="bg-white rounded-lg shadow p-6 max-w-xl">{errorMsg || "Payment not found."}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <button onClick={handleBack} className="mb-4 inline-flex items-center gap-2 bg-white px-3 py-2 rounded">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">Checkout</h2>

        <p className="mb-2"><strong>Student ID:</strong> {payment.student_id}</p>
        <p className="mb-2"><strong>Route:</strong> {payment.routes?.route_name || payment.route_id}</p>
        <p className="mb-2"><strong>Month:</strong> {payment.month}/{payment.year}</p>
        <p className="mb-4 text-xl font-bold">Amount: ₹{payment.amount.toFixed(2)}</p>

        {errorMsg && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded text-red-700">{errorMsg}</div>
        )}

        <div className="mb-4">
          <label className="block font-semibold mb-2">Payment Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="w-full p-2 border rounded">
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="netbanking">Net Banking</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button onClick={handleProceed} disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded">Pay ₹{payment.amount.toFixed(2)}</button>
          <button onClick={handleManualPay} disabled={processing} className="px-4 py-2 border rounded">Manual Pay (Test)</button>
          <button onClick={() => router.push('/payments')} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </div>

      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    </div>
  );
}

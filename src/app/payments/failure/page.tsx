"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

function PaymentFailureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("Payment was declined. Please try again.");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const id = searchParams.get("orderId");
        const reasonParam = searchParams.get("reason");

        if (id) {
          setOrderId(id);

          // Mark payment as failed in database
          try {
            await supabase
              .from("payments")
              .update({
                status: "failed",
                updated_at: new Date().toISOString(),
              })
              .eq("gateway_order_id", id)
              .eq("status", "pending");
          } catch (err) {
            console.warn("Could not mark payment as failed:", err);
          }
        }

        if (reasonParam) {
          setReason(reasonParam);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 px-4 py-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Error Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle size={48} className="text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Payment Failed
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            {reason}
          </p>

          {/* Error Details */}
          {orderId && (
            <div className="bg-red-50 rounded-lg p-4 mb-6 border border-red-200">
              <p className="text-sm text-gray-600 mb-2">Order Reference</p>
              <p className="font-mono text-sm font-semibold text-red-700 break-all">
                {orderId}
              </p>
            </div>
          )}

          {/* Tips */}
          <div className="bg-yellow-50 rounded-lg p-4 mb-8 border border-yellow-200">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>Try these:</strong>
            </p>
            <ul className="text-xs text-yellow-700 space-y-1 text-left">
              <li>• Check your card/UPI details</li>
              <li>• Ensure sufficient balance</li>
              <li>• Verify payment method is active</li>
              <li>• Try a different payment method</li>
            </ul>
          </div>

          {/* Retry Button */}
          <button
            onClick={() => router.push("/payments")}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 mb-3"
          >
            <RotateCcw size={20} />
            Try Again
          </button>

          {/* Back Button */}
          <button
            onClick={() => router.push("/payments")}
            className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} />
            Back to Payments
          </button>
        </div>

        {/* Support Message */}
        <div className="mt-6 bg-white rounded-lg p-4 text-center shadow-sm">
          <p className="text-sm text-gray-600">
            Need help?{" "}
            <a href="mailto:support@schoolbus.com" className="text-blue-600 hover:text-blue-700 font-semibold">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <PaymentFailureContent />
    </Suspense>
  );
}

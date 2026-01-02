"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    const id = searchParams.get("orderId");
    if (id) {
      setOrderId(id);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <Check size={48} className="text-green-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Payment Successful! 🎉
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Your bus fee payment has been completed successfully. A confirmation email has been sent to your registered email address.
          </p>

          {/* Order Details */}
          <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
            <p className="text-sm text-gray-600 mb-2">Order Reference</p>
            <p className="font-mono text-lg font-semibold text-green-700 break-all">
              {orderId || "Processing..."}
            </p>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-4 mb-8 border border-blue-200">
            <p className="text-sm text-blue-700 mb-2">
              <strong>Next Steps:</strong>
            </p>
            <ul className="text-xs text-blue-600 space-y-1 text-left">
              <li>✓ Your payment is confirmed</li>
              <li>✓ Invoice will be available in Payment History</li>
              <li>✓ You can now access bus services</li>
            </ul>
          </div>

          {/* Button */}
          <button
            onClick={() => router.push("/payments")}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
          >
            View Payment History
            <ArrowRight size={20} />
          </button>

          {/* Secondary Button */}
          <button
            onClick={() => router.push("/profile")}
            className="w-full mt-3 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
          >
            Back to Profile
          </button>
        </div>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";

/**
 * Shown after Razorpay redirects to …/failed (subscription or add-on checkout).
 * Public route so users still see a clear message if auth/session is edge-case.
 */
export default function PaymentFailed() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto bg-white border rounded-lg p-6 md:p-8 shadow-sm">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
          Payment could not be completed
        </h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Something went wrong while confirming your payment. You were not charged,
          or the charge could not be linked to your account. If money was debited,
          contact support with your payment reference from Razorpay.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/plans"
            className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Back to plans
          </Link>
          <Link
            to="/login"
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

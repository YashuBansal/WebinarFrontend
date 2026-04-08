import { Link } from "react-router-dom";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white border rounded-lg p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">Support</h1>
        <p className="text-sm text-gray-500 mb-6">
          Need help with setup, billing, or technical issues? Reach out to us.
        </p>

        <div className="space-y-5 text-sm text-gray-700 leading-6">
          <section>
            <h2 className="font-semibold text-base mb-1">1. Email Support</h2>
            <p>
              Contact us at{" "}
              <a className="underline" href="mailto:support@yourcompany.com">
                support@yourcompany.com
              </a>
              . Please include your account email and issue summary.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-1">2. Response Time</h2>
            <p>
              We usually respond within 1-2 business days depending on ticket volume
              and issue severity.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-1">3. What to Include</h2>
            <p>
              Share steps to reproduce, screenshots, and relevant IDs to help us
              resolve your issue faster.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link className="underline" to="/policy">Policy</Link>
          <Link className="underline" to="/terms">Terms</Link>
          <Link className="underline" to="/documentation">Documentation</Link>
        </div>
      </div>
    </div>
  );
}

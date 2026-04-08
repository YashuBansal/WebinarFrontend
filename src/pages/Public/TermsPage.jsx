import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white border rounded-lg p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-6">Effective Date: April 8, 2026</p>

        <div className="space-y-5 text-sm text-gray-700 leading-6">
          <section>
            <h2 className="font-semibold text-base mb-1">1. Acceptance of Terms</h2>
            <p>
              By using this service, you agree to these terms and all applicable laws.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-1">2. Account Responsibility</h2>
            <p>
              You are responsible for account access, credentials, and all actions
              performed through your account.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-1">3. Acceptable Use</h2>
            <p>
              You must not misuse the platform, attempt unauthorized access, or use it
              for unlawful activity.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-1">4. Service Changes</h2>
            <p>
              We may update, suspend, or improve features to maintain security and
              product quality.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-1">5. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, the service is provided on an
              as-is basis without indirect or consequential liability.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link className="underline" to="/policy">Policy</Link>
          <Link className="underline" to="/support">Support</Link>
          <Link className="underline" to="/documentation">Documentation</Link>
        </div>
      </div>
    </div>
  );
}

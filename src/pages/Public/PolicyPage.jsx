import { Link } from "react-router-dom";

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white border rounded-lg p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-6">Effective Date: April 8, 2026</p>

        <div className="space-y-5 text-sm text-gray-700 leading-6">
          <section>
            <h2 className="font-semibold text-base mb-1">1. Information We Collect</h2>
            <p>
              We collect account details, usage activity, and service interaction data
              required to provide platform features, support, and security.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-1">2. How We Use Information</h2>
            <p>
              Data is used to operate the service, improve product reliability, manage
              subscriptions, provide customer support, and meet legal obligations.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-1">3. Data Sharing</h2>
            <p>
              We do not sell personal data. We may share information with trusted
              vendors and integrations strictly for service delivery and compliance.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-1">4. Data Retention</h2>
            <p>
              We retain data only as long as necessary for business, legal, and
              contractual requirements. Retention periods may vary by record type.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-1">5. Contact</h2>
            <p>
              For privacy inquiries, contact:{" "}
              <a className="underline" href="mailto:support@yourcompany.com">
                support@yourcompany.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link className="underline" to="/terms">Terms</Link>
          <Link className="underline" to="/support">Support</Link>
          <Link className="underline" to="/documentation">Documentation</Link>
        </div>
      </div>
    </div>
  );
}

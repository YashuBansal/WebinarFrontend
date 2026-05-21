import { Link } from "react-router-dom";

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white border rounded-lg p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">
          Documentation
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Product documentation for onboarding, setup, and best practices.
        </p>

        <div className="space-y-5 text-sm text-gray-700 leading-6">
          <section>
            <h2 className="font-semibold text-base mb-1">1. Getting Started</h2>
            <p>
              Start by creating your account, configuring your workspace, and
              inviting team members with appropriate roles.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-1">
              2. Integration Setup
            </h2>
            <p>
              Follow integration-specific setup steps, verify webhook endpoints,
              and confirm required permissions.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-1">3. Troubleshooting</h2>
            <p>
              Check configuration values, token status, and logs. For unresolved
              issues, contact support with error details.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link className="underline" to="/policy">
            Policy
          </Link>
          <Link className="underline" to="/terms">
            Terms
          </Link>
          <Link className="underline" to="/support">
            Support
          </Link>
        </div>
      </div>
    </div>
  );
}

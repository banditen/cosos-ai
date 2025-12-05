'use client';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 5, 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground mb-2">We collect information you provide directly:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Account information (name, email)</li>
              <li>Workspace and team information</li>
              <li>Data from connected integrations (with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Third-Party Integrations</h2>
            <p className="text-muted-foreground mb-2">When you connect third-party services, we may access:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li><strong>Google:</strong> Email metadata, calendar events</li>
              <li><strong>Linear:</strong> Issues, projects, team information</li>
              <li><strong>Slack:</strong> Messages from selected channels</li>
              <li><strong>Notion:</strong> Pages and databases you grant access to</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              You control which integrations are connected and can revoke access at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>To provide and improve the Service</li>
              <li>To generate AI-powered insights and recommendations</li>
              <li>To sync data between your connected tools</li>
              <li>To communicate with you about the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Storage and Security</h2>
            <p className="text-muted-foreground">
              Your data is stored securely using industry-standard encryption. We use Supabase for 
              database services with row-level security. OAuth tokens are encrypted at rest.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your personal data. We may share data with service providers who assist 
              in operating our Service (e.g., hosting, AI processing), bound by confidentiality agreements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Access and export your data</li>
              <li>Delete your account and associated data</li>
              <li>Disconnect any integration at any time</li>
              <li>Opt out of non-essential communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your data while your account is active. Upon deletion request, we remove your 
              data within 30 days, except where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
            <p className="text-muted-foreground">
              For privacy concerns, contact us at privacy@cosos.io
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}


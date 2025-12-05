'use client';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 5, 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Cosos ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground">
              Cosos is an AI-powered workspace tool that helps teams connect their tools, analyze data, 
              and build custom business applications. The Service integrates with third-party platforms 
              including but not limited to Google, Linear, Slack, and Notion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <p className="text-muted-foreground">
              You are responsible for maintaining the confidentiality of your account credentials and for 
              all activities that occur under your account. You must notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Third-Party Integrations</h2>
            <p className="text-muted-foreground">
              The Service allows you to connect third-party accounts. By connecting these accounts, you 
              authorize Cosos to access and process data from these services in accordance with our Privacy Policy. 
              You may disconnect integrations at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Usage</h2>
            <p className="text-muted-foreground">
              We process your data solely to provide the Service. We do not sell your data to third parties. 
              See our Privacy Policy for detailed information on data handling.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              The Service is provided "as is" without warranties of any kind. We are not liable for any 
              indirect, incidental, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. Continued use of the Service after 
              changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms, please contact us at support@cosos.io
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}


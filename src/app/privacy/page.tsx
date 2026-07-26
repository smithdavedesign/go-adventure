import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = "July 24, 2026";
const SITE_NAME = "Travel Roamer";
const CONTACT_EMAIL = "privacy@travel-roamer.com";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <section className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            1. Who we are
          </h2>
          <p>
            {SITE_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;)
            is an outdoor adventure discovery platform. Our registered email for
            privacy inquiries is{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline underline-offset-4 hover:text-foreground"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            2. Information we collect
          </h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Account data</strong> — when you sign in with Google we
              receive your name, email address, and profile picture from Google.
              We store only the name and email address.
            </li>
            <li>
              <strong>Saved destinations</strong> — destinations you explicitly
              bookmark are stored and linked to your account.
            </li>
            <li>
              <strong>Usage events</strong> — we collect anonymised, consent-gated
              analytics events (pages viewed, searches performed, filters used).
              No personal identifiers are attached to these events. Analytics are
              disabled until you accept cookies.
            </li>
            <li>
              <strong>Server logs</strong> — our hosting provider (Vercel) and
              error monitoring service (Sentry) may record IP addresses, user
              agent strings, and request metadata for security and reliability
              purposes. These logs are retained for 30 days.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            3. How we use your information
          </h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>To authenticate your account and maintain your session.</li>
            <li>To store and retrieve your saved destinations.</li>
            <li>
              To improve the product through aggregated, anonymous analytics.
            </li>
            <li>To diagnose errors and monitor service reliability.</li>
          </ul>
          <p className="mt-2">
            We do <strong>not</strong> sell your personal information. We do not
            use your data to train AI models. We do not share your information
            with advertisers.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            4. Legal basis (GDPR)
          </h2>
          <p>
            If you are located in the European Economic Area, our legal basis
            for processing your personal data is:
          </p>
          <ul className="mt-1 ml-4 list-disc space-y-1">
            <li>
              <strong>Contract</strong> — processing necessary to provide the
              services you request (account, saved destinations).
            </li>
            <li>
              <strong>Legitimate interests</strong> — server logs and error
              monitoring for security and reliability.
            </li>
            <li>
              <strong>Consent</strong> — analytics cookies, which you can
              withdraw at any time via your browser settings.
            </li>
          </ul>
          <p className="mt-2">
            <strong>International transfers.</strong> Our infrastructure
            providers are based in the United States, so your data is
            transferred to and stored in the US. Where we transfer personal data
            of users in the EEA or UK, we rely on the appropriate safeguards
            offered by these providers, such as Standard Contractual Clauses.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            5. Third-party services
          </h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Google OAuth</strong> — sign-in is handled by Google. See{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Google&rsquo;s Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>Vercel</strong> — hosting and edge network.
            </li>
            <li>
              <strong>Supabase</strong> — database hosting. Data is stored in
              the US.
            </li>
            <li>
              <strong>Sentry</strong> — error monitoring. Error events may
              include stack traces and request context.
            </li>
            <li>
              <strong>Destination data</strong> — park and recreation area
              information is sourced from the NPS Data API and Recreation.gov
              (RIDB) under their respective terms. We display attribution with
              every sourced fact.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">6. Data retention</h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              Account data is retained until you delete your account.
            </li>
            <li>
              Server logs are retained for 30 days.
            </li>
            <li>
              Anonymous analytics are retained in aggregated form indefinitely.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            7. Your rights
          </h2>
          <p>
            Depending on your location you may have the right to access, correct,
            delete, or export your personal data. You can delete your account and
            all associated data from the{" "}
            <a
              href="/account"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Account page
            </a>
            . For other requests, email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline underline-offset-4 hover:text-foreground"
            >
              {CONTACT_EMAIL}
            </a>
            . We will respond within 30 days.
          </p>
          <p className="mt-2">
            <strong>California residents.</strong> Under the CCPA/CPRA you have
            the right to know what personal information we collect, to delete it,
            to correct it, and to opt out of its &ldquo;sale&rdquo; or
            &ldquo;sharing.&rdquo; We do not sell or share your personal
            information as those terms are defined, and we will not discriminate
            against you for exercising these rights. To make a request, use the{" "}
            <a
              href="/account"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Account page
            </a>{" "}
            or email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline underline-offset-4 hover:text-foreground"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">8. Cookies</h2>
          <p>
            We use a single strictly-necessary session cookie for authentication.
            Analytics cookies are only set after you accept them via the cookie
            notice. You can withdraw consent at any time by clearing cookies in
            your browser.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">9. Children</h2>
          <p>
            {SITE_NAME} is not directed to children under 13. We do not
            knowingly collect personal information from children.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">10. Changes</h2>
          <p>
            We may update this policy. We will notify you of material changes by
            updating the effective date above and, for account holders, by email.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">11. Contact</h2>
          <p>
            Questions? Email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline underline-offset-4 hover:text-foreground"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}

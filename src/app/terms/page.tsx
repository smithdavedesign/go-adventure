import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = "July 24, 2026";
const SITE_NAME = "Travel Roamer";
const CONTACT_EMAIL = "legal@travel-roamer.com";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Use</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <section className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            1. Acceptance
          </h2>
          <p>
            By using {SITE_NAME} you agree to these Terms of Use. If you do not
            agree, please do not use the service.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            2. What {SITE_NAME} is
          </h2>
          <p>
            {SITE_NAME} is an outdoor adventure discovery platform. We aggregate
            publicly available information about destinations and trails from
            government sources (NPS, Recreation.gov) to help you plan trips. We
            do not sell permits, reservations, or tickets. We do not provide
            real-time conditions, navigation, or emergency services.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            3. Informational purpose — safety disclaimer
          </h2>
          <p>
            <strong>
              Content on {SITE_NAME} is for general informational purposes only.
            </strong>{" "}
            Outdoor activities carry inherent risks including injury or death.
            Trail conditions, permit requirements, fees, access, and weather
            change frequently. Always verify current conditions with the land
            management agency before your trip. {SITE_NAME} is not a substitute
            for official guidance, local knowledge, proper training, or safety
            equipment. We are not responsible for decisions you make in the
            field.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            4. Accuracy of information
          </h2>
          <p>
            We make reasonable efforts to ensure accuracy and source our content
            from official government data. However, we cannot guarantee that all
            information is current or error-free. Permit rules, trail distances,
            difficulty ratings, and fee amounts are editorial assessments and
            should be confirmed with official sources. We are not liable for
            errors or omissions.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            5. Accounts
          </h2>
          <p>
            You may create an account using Google Sign-In. You are responsible
            for activity under your account. We may suspend or terminate accounts
            that violate these Terms.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            6. Acceptable use
          </h2>
          <p>You agree not to:</p>
          <ul className="mt-1 ml-4 list-disc space-y-1">
            <li>
              Scrape, copy, or redistribute our content in bulk without written
              permission.
            </li>
            <li>
              Use the service in any way that violates applicable laws or
              regulations.
            </li>
            <li>
              Attempt to gain unauthorised access to any part of the service or
              its underlying systems.
            </li>
            <li>Use the service to harm others.</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            7. Third-party content and links
          </h2>
          <p>
            Destination pages link to official government and land-manager
            websites. We are not responsible for the content of those sites. All
            permit and booking transactions occur on official government
            platforms — we do not handle reservations or payments.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            8. Intellectual property
          </h2>
          <p>
            Factual data sourced from NPS and Recreation.gov is US Government
            work and is in the public domain. Editorial text, design, and code
            are © {new Date().getFullYear()} {SITE_NAME}. You may not reproduce
            them without permission.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            9. Disclaimer of warranties
          </h2>
          <p>
            The service is provided &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo; without warranties of any kind, express or implied,
            including fitness for a particular purpose or non-infringement.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            10. Limitation of liability
          </h2>
          <p>
            To the maximum extent permitted by law, {SITE_NAME} and its
            operators are not liable for any indirect, incidental, special,
            consequential, or punitive damages arising from your use of — or
            inability to use — this service, including any outdoor activities you
            undertake based on information found here.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            11. Changes to these Terms
          </h2>
          <p>
            We may update these Terms. Continued use of the service after changes
            are posted constitutes acceptance of the updated Terms. Material
            changes will be communicated to account holders by email.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">
            12. Governing law
          </h2>
          <p>
            These Terms are governed by the laws of the State of Delaware, United
            States, without regard to conflict-of-law principles.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-foreground">13. Contact</h2>
          <p>
            Questions about these Terms? Email{" "}
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

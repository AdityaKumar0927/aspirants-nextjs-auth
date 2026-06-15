import type { Metadata } from "next";
import ContactForm from "./contact-form";
import T from "@/components/i18n/T"

const SUPPORT_EMAIL = "aspirants.contact@gmail.com";

export const metadata: Metadata = {
  title: "Contact — Penwise",
  description:
    "Get in touch with the Penwise team — ask a question, report a problem, or tell us how we can help with your JEE, NEET, GATE or UPSC prep.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4">
      <header>
        <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
          <T k="auto.contactPage.contact" />
        </p>
        <h1 className="type-display mt-1 text-3xl sm:text-4xl">
          <T k="auto.contactPage.getIn" /> <span className="highlight-sweep"><T k="auto.contactPage.touch" /></span>
        </h1>
        <p className="mt-3 max-w-prose text-sm text-pencil">
          <T k="auto.contactPage.questionsBugReportsOrIdeas" />
        </p>
      </header>

      <section className="paper-sheet p-6">
        <h2 className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
          <T k="auto.contactPage.emailUs" />
        </h2>
        <p className="mt-2 text-sm text-ink">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="type-data text-ballpoint underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
        <p className="counterfoil mt-4 pt-4 text-sm text-pencil">
          <T k="auto.contactPage.weUsuallyReplyWithin2" />
        </p>
      </section>

      <ContactForm />

      <section className="paper-sheet p-6">
        <h2 className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
          <T k="auto.contactPage.otherWaysToReachUs" />
        </h2>
        <ul className="mt-3 space-y-3 text-sm text-ink">
          <li>
            <a href="/feature-requests" className="text-ballpoint underline">
              <T k="auto.contactPage.featureRequests" />
            </a>{" "}
            <span className="text-pencil">
              <T k="auto.contactPage.suggestSomethingNewOrUpvote" />
            </span>
          </li>
          <li>
            <a href="/grievance" className="text-ballpoint underline">
              <T k="auto.contactPage.grievanceDataProtection" />
            </a>{" "}
            <span className="text-pencil">
              <T k="auto.contactPage.questionsOrComplaintsAboutHow" />
            </span>
          </li>
        </ul>
        <p className="counterfoil mt-4 pt-4 text-sm text-pencil">
          <T k="auto.contactPage.wantToHelpBuildAspirants" />{" "}
          <a href="/apply" className="text-ballpoint underline">
            <T k="auto.contactPage.apply" />
          </a>
          .
        </p>
      </section>
    </div>
  );
}

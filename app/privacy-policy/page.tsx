import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type React from "react"
import {
  GRIEVANCE_OFFICER_EMAIL,
  GRIEVANCE_OFFICER_NAME,
  DATA_RETENTION,
} from "@/lib/constants"

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen text-foreground dark:text-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-sans tracking-tight leading-relaxed">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-light tracking-tighter mb-2 text-gray-900 dark:text-gray-100">Privacy Policy</h1>
        <p className="text-sm font-light tracking-tight text-muted-foreground dark:text-gray-400 mb-8">
          Effective date: 12th June, 2026
        </p>

        <Card className="mb-8 bg-paper border-rule">
          <CardContent className="p-6">
            <p className="text-sm font-light tracking-tight text-muted-foreground dark:text-gray-300">
              Penwise (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), operating the website
              penwise-git-main-aditya-kumar-s-projects.vercel.app, is the Data Fiduciary for your personal data and is committed to
              protecting it in accordance with India&rsquo;s Digital Personal Data Protection Act,
              2023 and the DPDP Rules, 2025. This policy explains what we collect, why, how long we
              keep it, how we keep it secure, and the rights you have over it.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Section title="Information we collect">
            <ul className="list-disc list-inside space-y-2 text-sm font-light tracking-tight text-muted-foreground dark:text-gray-400">
              <li><strong>Account data</strong> — your name, email address and profile image, received from Google when you sign in.</li>
              <li><strong>Date of birth</strong> — collected at onboarding to confirm you can legally consent, and to trigger parental consent if you are under 18.</li>
              <li><strong>Study activity</strong> — the questions you attempt, your answers, progress, performance analytics, notes and mock-exam attempts.</li>
              <li><strong>Content you submit</strong> — solutions, feedback, issue reports and volunteer applications.</li>
              <li><strong>AI feature data</strong> — PDFs and prompts you submit to the optional question-import and hint features, and a log of that usage.</li>
              <li><strong>Analytics</strong> — basic usage analytics, collected <em>only</em> if you opt in via the cookie banner, and never for users under 18.</li>
            </ul>
          </Section>

          <Section title="Purposes and consent">
            <p className="text-sm font-light tracking-tight text-muted-foreground dark:text-gray-300 mb-4">
              We process your data to operate your account, deliver the question bank and mock
              exams, track your progress, run the optional AI features you invoke, and — with your
              separate consent — to understand usage through analytics. We ask for your consent
              through a clear, standalone notice (see our{" "}
              <a href="/consent-notice" className="underline">consent notice</a>) with no
              pre-ticked boxes. You can withdraw any non-essential consent at any time from{" "}
              <strong>Settings → Privacy &amp; Data</strong>; withdrawing is as easy as giving
              consent and does not affect processing already carried out.
            </p>
          </Section>

          <Section title="How we keep your data secure">
            <p className="text-sm font-light tracking-tight text-muted-foreground dark:text-gray-300 mb-4">
              In line with the reasonable security safeguards required by the DPDP Rules, 2025 we:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm font-light tracking-tight text-muted-foreground dark:text-gray-400">
              <li>encrypt data in transit (HTTPS/TLS) and rely on managed, encrypted-at-rest database storage;</li>
              <li>authenticate via Google OAuth, so we never handle your password;</li>
              <li>restrict access to personal data to authorised personnel only;</li>
              <li>maintain access and activity audit logs and retain them for one year;</li>
              <li>follow a documented process to detect, investigate and respond to incidents.</li>
            </ul>
            <p className="text-sm font-light tracking-tight text-muted-foreground dark:text-gray-300 mt-4">
              No system is completely secure, but we work to protect your data using these measures.
            </p>
          </Section>

          <Section title="Who we share data with">
            <p className="text-sm font-light tracking-tight text-muted-foreground dark:text-gray-300 mb-4">
              We do not sell your data. We share it only with the processors needed to run the
              service, each bound to equivalent safeguards:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm font-light tracking-tight text-muted-foreground dark:text-gray-400">
              <li>Google (sign-in), our cloud hosting and managed database provider;</li>
              <li>Upstash (rate-limiting);</li>
              <li>AI providers (Google Gemini, Groq, or OpenAI) — only for content you submit to the AI features.</li>
            </ul>
          </Section>

          <Section title="How long we keep your data">
            <p className="text-sm font-light tracking-tight text-muted-foreground dark:text-gray-300 mb-4">
              We keep personal data only as long as needed for the purpose it was collected for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm font-light tracking-tight text-muted-foreground dark:text-gray-400">
              {DATA_RETENTION.map((r) => (
                <li key={r.category}>
                  <strong>{r.category}:</strong> {r.period}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Your rights">
            <p className="text-sm font-light tracking-tight text-muted-foreground dark:text-gray-300 mb-4">
              Under the DPDP Act, 2023 you have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm font-light tracking-tight text-muted-foreground dark:text-gray-400">
              <li>access and download a summary of your personal data;</li>
              <li>correct or complete inaccurate data;</li>
              <li>erase your data;</li>
              <li>withdraw consent;</li>
              <li>nominate another individual to exercise your rights;</li>
              <li>grievance redressal.</li>
            </ul>
            <p className="text-sm font-light tracking-tight text-muted-foreground dark:text-gray-300 mt-4">
              You can exercise most of these instantly from{" "}
              <a href="/forms/privacy" className="underline">Settings → Privacy &amp; Data</a> —
              download your data, manage consents, or file a correction, erasure or grievance
              request. We respond to all requests within 90 days.
            </p>
          </Section>

          <Section title="Children's data">
            <p className="text-sm font-light tracking-tight text-muted-foreground dark:text-gray-300">
              Many of our users are school students who may be under 18. We ask for your date of
              birth at sign-up; if you are under 18 we require <strong>verifiable consent from a
              parent or guardian</strong> before processing your data, and we never track, profile,
              or show targeted advertising to you. A parent or guardian can withdraw their consent
              or contact us at any time at {GRIEVANCE_OFFICER_EMAIL}.
            </p>
          </Section>

          <Section title="Personal data breaches">
            <p className="text-sm font-light tracking-tight text-muted-foreground dark:text-gray-300">
              If a personal data breach occurs, we will notify the Data Protection Board of India
              and, without undue delay, the affected users — describing the breach, the data
              involved, the steps we are taking, and what you can do to protect yourself.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p className="text-sm font-light tracking-tight text-muted-foreground dark:text-gray-300">
              We may update this policy to reflect changes in our practices or the law. We will post
              the updated policy here and, where the change is material, ask for fresh consent.
            </p>
          </Section>

          <Section title="Grievance Officer / contact">
            <p className="text-sm font-light tracking-tight text-muted-foreground dark:text-gray-300">
              For any questions, requests, or complaints about your personal data, contact our
              Grievance / Data Protection Officer, <strong>{GRIEVANCE_OFFICER_NAME}</strong>, at{" "}
              <a href={`mailto:${GRIEVANCE_OFFICER_EMAIL}`} className="underline">
                {GRIEVANCE_OFFICER_EMAIL}
              </a>
              . You may also file a complaint with the Data Protection Board of India.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-8 bg-paper border-rule">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-light tracking-tight text-gray-900 dark:text-gray-100">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm font-light tracking-tight">{children}</CardContent>
    </Card>
  )
}

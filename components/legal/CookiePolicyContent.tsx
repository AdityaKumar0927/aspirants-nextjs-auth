import { ExternalLink } from "lucide-react";

/**
 * The cookie-policy body, as a self-contained document. Rendered both on the
 * full /cookie-policy page and inside the cookie-consent modal's scrollable
 * area, so the policy is always readable in-context (single source of truth).
 * Styled with the desk tokens and plain tables (no inner scroll areas) so it
 * scrolls as one piece wherever it is embedded.
 */
export default function CookiePolicyContent() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-ink">
      <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
        Effective date: 1st September, 2024
      </p>

      <p className="text-pencil">
        This is the cookie policy for Penwise (&quot;Penwise&quot;, &quot;we&quot;,
        &quot;us&quot; or &quot;our&quot;). For more information about how we may use
        personal data, please read our privacy policy or contact us at
        aspirants.contact@gmail.com.
      </p>

      <Section title="Your consent choices">
        <p>
          Essential cookies are always on because the site cannot function without
          them. <strong className="text-ink">Analytics</strong> and{" "}
          <strong className="text-ink">marketing</strong> cookies are off by default
          and are only set after you opt in through our cookie banner — and never for
          users under 18. We honour your choice: if you decline, analytics are not
          loaded at all.
        </p>
        <p>
          You can change your choice at any time from the cookie banner, or from{" "}
          <a href="/forms/privacy" className="text-ballpoint underline">
            Settings → Privacy &amp; Data
          </a>
          .
        </p>
      </Section>

      <Section title="What is a Cookie">
        <p>
          A cookie is a small text file that is downloaded onto your device when you
          access a website. It is sent through your browser, and it helps us to
          recognise you and your device.
        </p>
        <p>
          There are technologies, which, although technically not &quot;cookies&quot;,
          are like cookies. These include:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Web beacons/pixels: used to count the number of users who have interacted with some content on our website</li>
          <li>Local storage: storage of data in your device&apos;s (phone, laptop, computer, etc.) local cache (temporary memory)</li>
          <li>Scripts: Computer programs designed to give extra functionality</li>
        </ul>
      </Section>

      <Section title="Different Types of Cookies">
        <ul className="list-disc space-y-1 pl-5">
          <li>First party cookies: these are the cookies created by us which you might encounter while using our website</li>
          <li>Third party cookies: these are the cookies created by third party platforms which you might encounter while using our website</li>
          <li>Session cookies: these are the cookies which only last for the duration of your visit to our website</li>
          <li>Persistent cookies: these are the cookies which last for a longer period of time than Session Cookies</li>
          <li>Zombie cookies: these are the cookies that are automatically recreated after you delete them. We DO NOT use this type of malicious cookie.</li>
        </ul>
      </Section>

      <Section title="How we use Cookies">
        <p>We use cookies for a variety of purposes, including but not limited to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Keeping you logged into our website</li>
          <li>Analyzing your site usage patterns, such as the duration of your visit, and so on</li>
          <li>Tracking how you navigate and engage with our site&apos;s pages to detect and resolve technical problems</li>
        </ul>
        <p>
          Please keep in mind that cookies are necessary for the functioning of our
          website. We only use first party, third party and session cookies. We do not
          use any type of marketing cookie.
        </p>
        <p>You can change your browser settings to not accept any cookies. Your browser will allow you to:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>See what cookies are installed on your browser</li>
          <li>Block any cookie</li>
          <li>Delete cookies from your browser</li>
        </ol>
        <p>However, it may impact your experience on different websites, including our site.</p>
        <p>For more information on how to manage your cookies on your browser, please browse through:</p>
        <ul className="space-y-1">
          {[
            { name: "Google Chrome", url: "https://support.google.com/chrome/answer/95647?hl=en" },
            { name: "Firefox", url: "https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" },
            { name: "Microsoft Edge", url: "https://support.microsoft.com/en-us/microsoft-edge/view-cookies-in-microsoft-edge-a7d95376-f2cd-8e4a-25dc-1de753474879" },
            { name: "Safari", url: "https://support.apple.com/en-in/105082" },
          ].map((browser) => (
            <li key={browser.name}>
              <a
                href={browser.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-ballpoint hover:underline"
              >
                {browser.name}
                <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="List of Cookies we Use">
        <CookieTable
          title="Necessary Cookies"
          description="These cookies are essential for the basic functionality of our website. They enable basic features such as page navigation and access to secure areas of the site. The website cannot function properly without these cookies."
          cookies={[
            { name: "session_id", provider: "Penwise", purpose: "Maintains user session across pages for seamless navigation.", expiry: "Session", type: "HTTP Cookie" },
            { name: "csrf_token", provider: "Penwise", purpose: "Ensures visitor browsing security by preventing cross-site request forgery.", expiry: "1 day", type: "HTTP Cookie" },
            { name: "consent_status", provider: "Penwise", purpose: "Stores the user's consent preferences for cookie usage.", expiry: "1 year", type: "HTTP Cookie" },
            { name: "cookie_test", provider: "Penwise", purpose: "Used to check if the user's browser supports cookies.", expiry: "Session", type: "HTTP Cookie" },
            { name: "XSRF-TOKEN", provider: "Penwise", purpose: "Protects the website and users from cross-site request forgery attacks.", expiry: "1 day", type: "HTTP Cookie" },
          ]}
        />
        <CookieTable
          title="Preference Cookies"
          description="Preference cookies enable a website to remember information that changes how the website behaves or looks, such as your preferred language or the region you are in."
          cookies={[
            { name: "user_prefs", provider: "Penwise", purpose: "Stores user preferences for future visits, like language settings.", expiry: "1 year", type: "HTTP Cookie" },
            { name: "loglevel", provider: "Penwise", purpose: "Maintains settings and outputs in the Developer Tools Console on the current session.", expiry: "Persistent", type: "HTML Local Storage" },
          ]}
        />
        <CookieTable
          title="Analytics Cookies"
          description="Analytics cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. These insights help us improve the user experience."
          cookies={[
            { name: "_ga", provider: "Google", purpose: "Registers a unique ID to generate statistical data on how visitors use the website.", expiry: "2 years", type: "HTTP Cookie" },
            { name: "_gid", provider: "Google", purpose: "Used to distinguish users for analytical purposes.", expiry: "24 hours", type: "HTTP Cookie" },
            { name: "_gat", provider: "Google", purpose: "Throttles request rate to improve performance on high-traffic sites.", expiry: "1 minute", type: "HTTP Cookie" },
          ]}
        />
        <div className="space-y-2">
          <h3 className="font-medium text-ink">Marketing Cookies (Currently Not Used)</h3>
          <p className="text-pencil">
            Marketing cookies are used to track visitors across websites to display ads
            that are relevant and engaging for the individual user. We currently do not
            deploy marketing cookies but may do so in the future based on business needs.
          </p>
        </div>
      </Section>

      <Section title="Changes to this Policy">
        <p className="text-pencil">
          We may change this policy from time to time. As such, you should check this
          policy each and every time you visit our website. Any changes will be notified
          on the site.
        </p>
      </Section>

      <Section title="Contact Us">
        <p className="text-pencil">
          For more information, please check out our privacy policy or email us at
          aspirants.contact@gmail.com.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="type-display text-base text-ink">{title}</h2>
      <div className="space-y-3 text-pencil">{children}</div>
    </section>
  );
}

function CookieTable({
  title,
  description,
  cookies,
}: {
  title: string;
  description: string;
  cookies: { name: string; provider: string; purpose: string; expiry: string; type: string }[];
}) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-ink">{title}</h3>
      <p className="text-pencil">{description}</p>
      <div className="overflow-x-auto rounded-md border border-rule">
        <table className="w-full text-left text-xs">
          <thead className="bg-secondary text-ink">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Provider</th>
              <th className="px-3 py-2 font-medium">Purpose</th>
              <th className="px-3 py-2 font-medium">Expiry</th>
              <th className="px-3 py-2 font-medium">Type</th>
            </tr>
          </thead>
          <tbody className="text-pencil">
            {cookies.map((cookie) => (
              <tr key={cookie.name} className="border-t border-rule align-top">
                <td className="px-3 py-2 font-medium text-ink">{cookie.name}</td>
                <td className="px-3 py-2">{cookie.provider}</td>
                <td className="px-3 py-2">{cookie.purpose}</td>
                <td className="px-3 py-2 whitespace-nowrap">{cookie.expiry}</td>
                <td className="px-3 py-2 whitespace-nowrap">{cookie.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

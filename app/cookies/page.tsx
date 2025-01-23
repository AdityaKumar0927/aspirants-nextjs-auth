import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExternalLink } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-dark-background dark:text-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground dark:text-gray-400 mb-6">Effective date: 1st September, 2024</p>

        <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm text-muted-foreground dark:text-gray-300">
              This is the cookie policy for Aspirants (&quot;Aspirants&quot;, &quot;we&quot;, &quot;us&quot; or
              &quot;our&quot;). For more information about how we may use personal data, please read our privacy policy
              or contact us at aspirants.contact@gmail.com.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Section title="What is a Cookie">
            <p className="mb-4 text-sm dark:text-gray-300">
              A cookie is a small text file that is downloaded onto your device when you access a website. It is sent
              through your browser, and it helps us to recognise you and your device.
            </p>
            <p className="mb-4 text-sm dark:text-gray-300">
              There are technologies, which, although technically not &quot;cookies&quot;, are like cookies. These
              include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground dark:text-gray-400">
              <li>
                Web beacons/pixels: used to count the number of users who have interacted with some content on our
                website
              </li>
              <li>
                Local storage: storage of data in your device&apos;s (phone, laptop, computer, etc.) local cache
                (temporary memory)
              </li>
              <li>Scripts: Computer programs designed to give extra functionality</li>
            </ul>
          </Section>

          <Section title="Different Types of Cookies">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground dark:text-gray-400">
              <li>
                First party cookies: these are the cookies created by us which you might encounter while using our
                website
              </li>
              <li>
                Third party cookies: these are the cookies created by third party platforms which you might encounter
                while using our website
              </li>
              <li>
                Session cookies: these are the cookies which only last for the duration of your visit to our website
              </li>
              <li>
                Persistent cookies: these are the cookies which last for a longer period of time than Session Cookies
              </li>
              <li>
                Zombie cookies: these are the cookies that are automatically recreated after you delete them. We DO NOT
                use this type of malicious cookie.
              </li>
            </ul>
          </Section>

          <Section title="How we use Cookies">
            <p className="mb-4 text-sm dark:text-gray-300">
              We use cookies for a variety of purposes, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4 text-sm text-muted-foreground dark:text-gray-400">
              <li>Keeping you logged into our website</li>
              <li>Analyzing your site usage patterns, such as the duration of your visit, and so on</li>
              <li>
                Tracking how you navigate and engage with our site&apos;s pages to detect and resolve technical problems
              </li>
            </ul>
            <p className="mb-4 text-sm dark:text-gray-300">
              Please keep in mind that cookies are necessary for the functioning of our website. We only use first
              party, third party and session cookies. We do not use any type of marketing cookie.
            </p>
            <p className="mb-4 text-sm dark:text-gray-300">
              You can change your browser settings to not accept any cookies. Your browser will allow you to:
            </p>
            <ol className="list-decimal list-inside space-y-2 mb-4 text-sm text-muted-foreground dark:text-gray-400">
              <li>See what cookies are installed on your browser</li>
              <li>Block any cookie</li>
              <li>Delete cookies from your browser</li>
            </ol>
            <p className="mb-4 text-sm dark:text-gray-300">
              However, it may impact your experience on different websites, including our site.
            </p>
            <p className="mb-4 text-sm dark:text-gray-300">
              For more information on how to manage your cookies on your browser, please browse through:
            </p>
            <ul className="list-none space-y-2 text-sm">
              {[
                { name: "Google Chrome", url: "https://support.google.com/chrome/answer/95647?hl=en" },
                {
                  name: "Firefox",
                  url: "https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer",
                },
                {
                  name: "Microsoft Edge",
                  url: "https://support.microsoft.com/en-us/microsoft-edge/view-cookies-in-microsoft-edge-a7d95376-f2cd-8e4a-25dc-1de753474879",
                },
                { name: "Safari", url: "https://support.apple.com/en-in/105082" },
              ].map((browser) => (
                <li key={browser.name}>
                  <a
                    href={browser.url}
                    className="text-primary dark:text-blue-400 hover:underline inline-flex items-center"
                  >
                    {browser.name}
                    <ExternalLink className="ml-1 h-4 w-4" />
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
                {
                  name: "session_id",
                  provider: "Aspirants",
                  purpose: "Maintains user session across pages for seamless navigation.",
                  expiry: "Session",
                  type: "HTTP Cookie",
                },
                {
                  name: "csrf_token",
                  provider: "Aspirants",
                  purpose: "Ensures visitor browsing security by preventing cross-site request forgery.",
                  expiry: "1 day",
                  type: "HTTP Cookie",
                },
                {
                  name: "consent_status",
                  provider: "Aspirants",
                  purpose: "Stores the user's consent preferences for cookie usage.",
                  expiry: "1 year",
                  type: "HTTP Cookie",
                },
                {
                  name: "cookie_test",
                  provider: "Aspirants",
                  purpose: "Used to check if the user's browser supports cookies.",
                  expiry: "Session",
                  type: "HTTP Cookie",
                },
                {
                  name: "XSRF-TOKEN",
                  provider: "Aspirants",
                  purpose: "Protects the website and users from cross-site request forgery attacks.",
                  expiry: "1 day",
                  type: "HTTP Cookie",
                },
              ]}
            />

            <CookieTable
              title="Preference Cookies"
              description="Preference cookies enable a website to remember information that changes how the website behaves or looks, such as your preferred language or the region you are in."
              cookies={[
                {
                  name: "user_prefs",
                  provider: "Aspirants",
                  purpose: "Stores user preferences for future visits, like language settings.",
                  expiry: "1 year",
                  type: "HTTP Cookie",
                },
                {
                  name: "loglevel",
                  provider: "Aspirants",
                  purpose: "Maintains settings and outputs in the Developer Tools Console on the current session.",
                  expiry: "Persistent",
                  type: "HTML Local Storage",
                },
              ]}
            />

            <CookieTable
              title="Analytics Cookies"
              description="Analytics cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. These insights help us improve the user experience."
              cookies={[
                {
                  name: "_ga",
                  provider: "Google",
                  purpose: "Registers a unique ID to generate statistical data on how visitors use the website.",
                  expiry: "2 years",
                  type: "HTTP Cookie",
                },
                {
                  name: "_gid",
                  provider: "Google",
                  purpose: "Used to distinguish users for analytical purposes.",
                  expiry: "24 hours",
                  type: "HTTP Cookie",
                },
                {
                  name: "_gat",
                  provider: "Google",
                  purpose: "Throttles request rate to improve performance on high-traffic sites.",
                  expiry: "1 minute",
                  type: "HTTP Cookie",
                },
              ]}
            />

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Marketing Cookies (Currently Not Used)
              </h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Marketing cookies are used to track visitors across websites to display ads that are relevant and
                engaging for the individual user. We currently do not deploy marketing cookies but may do so in the
                future based on business needs.
              </p>
            </div>
          </Section>

          <Section title="Changes to this Policy">
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              We may change this policy from time to time. As such, you should check this policy each and every time you
              visit our website. Any changes will be notified on the site.
            </p>
          </Section>

          <Section title="Contact Us">
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              For more information, please check out our privacy policy or email us at aspirants.contact@gmail.com.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-gray-900 dark:text-gray-100">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function CookieTable({
  title,
  description,
  cookies,
}: {
  title: string
  description: string
  cookies: { name: string; provider: string; purpose: string; expiry: string; type: string }[]
}) {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-sm text-muted-foreground dark:text-gray-400 mb-4">{description}</p>
      <ScrollArea className="h-[300px] rounded-md border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-800">
              <TableHead className="w-[100px] text-gray-900 dark:text-gray-100">Name</TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100">Provider</TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100">Purpose</TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100">Expiry</TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cookies.map((cookie) => (
              <TableRow key={cookie.name} className="border-b border-gray-200 dark:border-gray-700">
                <TableCell className="font-medium text-gray-900 dark:text-gray-100">{cookie.name}</TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">{cookie.provider}</TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">{cookie.purpose}</TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">{cookie.expiry}</TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">{cookie.type}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}


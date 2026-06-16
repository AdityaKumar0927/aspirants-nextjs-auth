import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen text-foreground dark:text-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-sans tracking-tight leading-relaxed">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-light tracking-tighter mb-2 text-gray-900 dark:text-gray-100">Terms of Service</h1>
        <p className="text-muted-foreground dark:text-gray-400 mb-8 text-sm font-light">
          Effective Date: 24th June 2024
        </p>

        <Card className="mb-8 bg-paper border-rule">
          <CardContent className="p-6">
            <p className="text-sm font-light text-muted-foreground dark:text-gray-400">
              These Terms and Conditions of Use apply to the Penwise website located at penwise-git-main-aditya-kumar-s-projects.vercel.app. BY USING
              THE SITE, YOU AGREE TO THESE TERMS OF USE; IF YOU DO NOT AGREE, DO NOT USE THE SITE.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Section title="Introduction">
            <p className="text-sm font-light text-muted-foreground dark:text-gray-400 mb-4">
              Penwise reserves the right, at its sole discretion, to change, modify, add or remove portions of these
              Terms and Conditions at any time. It is your responsibility to check these Terms and Conditions
              periodically for changes. Your continued use of the website following the posting of changes will mean
              that you accept and agree to the changes.
            </p>
            <p className="text-sm font-light text-muted-foreground dark:text-gray-400">
              As long as you comply with these Terms and Conditions, Penwise grants you a personal, non-exclusive,
              non-transferable, limited privilege to enter and use the Site.
            </p>
          </Section>

          <Section title="Use of the App">
            <p className="text-sm font-light text-muted-foreground dark:text-gray-400 mb-4">
              You may need to create an Penwise account to use all or part of our Service. Your username and password
              are for your personal use only and should be kept confidential. You understand that you are responsible
              for all use (including any unauthorized use) of your username and password.
            </p>
            <p className="text-sm font-light text-muted-foreground dark:text-gray-400 mb-4">
              You may use our Services only for lawful personal use, and in accordance with these Terms and Conditions.
              Penwise may, in its sole discretion, terminate your right to use our Services at any time, and may take
              all available legal recourse for actual or suspected violations of these Terms and Conditions.
            </p>
            <p className="text-sm font-light text-muted-foreground dark:text-gray-400 mb-4">
              You agree to use the Site only for lawful purposes and in accordance with these Terms. You are prohibited
              from:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm font-light text-muted-foreground dark:text-gray-400">
              <li>
                Using the Site in any manner that could disable, overburden, damage, or impair the Site or interfere
                with any other party&apos;s use of the Site.
              </li>
              <li>
                Using any robot, spider, or other automatic device, process, or means to access the Site for any
                purpose, including monitoring or copying any of the material on the Site.
              </li>
              <li>
                Introducing any viruses, trojan horses, worms, logic bombs, or other material that is malicious or
                technologically harmful.
              </li>
              <li>
                Attempting to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Site, the
                server on which the Site is stored, or any server, computer, or database connected to the Site.
              </li>
              <li>
                Engaging in any other conduct that restricts or inhibits anyone&apos;s use or enjoyment of the Site, or
                which, as determined by us, may harm us or users of the Site, or expose them to liability.
              </li>
            </ul>
          </Section>

          <Section title="Intellectual Property">
            <p className="text-sm font-light text-muted-foreground dark:text-gray-400">
              Unless otherwise stated, copyright and all intellectual property rights in all material presented on the
              site (including but not limited to text, audio, video or graphical images), trademarks and logos appearing
              on this site are the property of Penwise and are protected under applicable Indian laws. You agree not
              to use any framing techniques to enclose any trademark or logo or other proprietary information of
              Penwise; or remove, conceal or obliterate any copyright or other proprietary notice or any credit-line
              or dateline on other mark or source identifier included on the Site / Service, including without
              limitation, the size, colour, location or style of all proprietary marks. Any infringement shall be
              vigorously defended and pursued to the fullest extent permitted by law.
            </p>
          </Section>

          <Section title="Applicable Laws">
            <p className="text-sm font-light text-muted-foreground dark:text-gray-400">
              These Terms and Conditions and the relationship between Penwise and its users shall be governed by the
              laws of the Republic of India as applied to agreements made, entered, and performed entirely in Republic
              of India, notwithstanding the users&apos; place of residence. All lawsuits arising from or relating to
              these Terms and Conditions, or your use of the Services shall be brought in the courts located in New
              Delhi, India, and you hereby irrevocably submit to the exclusive personal jurisdiction of such courts for
              such purpose.
            </p>
          </Section>

          <Section title="Privacy">
            <p className="text-sm font-light text-muted-foreground dark:text-gray-400">
              Your use of the Site is also governed by our Privacy Policy, which describes how we collect, use, and
              protect your personal data. By using the Site, you consent to the collection and use of your data as
              described in our Privacy Policy, along with the Terms and Conditions.
            </p>
          </Section>

          <Section title="Disclaimers">
            <p className="text-sm font-light text-muted-foreground dark:text-gray-400">
              The Site and all materials provided through the Site are provided on an &quot;as-is&quot; and
              &quot;as-available&quot; basis, without any warranties of any kind, either express or implied. We do not
              warrant that the Site will be uninterrupted, error-free, or free from viruses or other harmful components.
              The content provided on the Site is for educational purposes only. We do not guarantee the accuracy,
              completeness, or usefulness of any information on the Site.
            </p>
          </Section>

          <Section title="Indemnification">
            <p className="text-sm font-light text-muted-foreground dark:text-gray-400 mb-4">
              By using Penwise, you agree to defend, indemnify, and hold harmless Penwise, its affiliates, and their
              respective officers, directors, employees, and agents, from and against any and all claims, damages,
              obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to legal fees)
              arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm font-light text-muted-foreground dark:text-gray-400">
              <li>
                Your Use of the Site: Any use of our Site, its content, or services, other than as expressly authorized
                in these Terms and Conditions.
              </li>
              <li>
                Violation of Terms: Any breach or violation of these Terms and Conditions, the Privacy Policy, or any
                other policy or guidelines set forth by Penwise.
              </li>
              <li>User Content: Any content you post, upload, submit, or otherwise transmit through our Site.</li>
            </ul>
          </Section>

          <Section title="Contact">
            <p className="text-sm font-light text-muted-foreground dark:text-gray-400">
              By using our Site, you acknowledge that you have read, understood, and agreed to these Terms and
              Conditions. If you have any questions, concerns, or feedback, please contact us at
              aspirants.contact@gmail.com.
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
      <CardHeader>
        <CardTitle className="text-xl font-light tracking-tight text-gray-900 dark:text-gray-100">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm font-light">{children}</CardContent>
    </Card>
  )
}


import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Effective date: 23rd June, 2024</p>

        <Card className="mb-8">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              In addition to our Terms and Conditions, Aspirants is dedicated to maintaining the privacy of its users and protecting their data. This privacy policy highlights and explains the policy of Aspirants, (hereinafter referred to as &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), and its website aspirants.tech (hereinafter referred to as &quot;the website&quot;) with respect to collection, storage, and usage of your data during the course of your interaction with the Website.
            </p>
          </CardContent>
        </Card>

        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          <div className="space-y-8">
            <Section title="Information collected from you">
              <p className="text-sm text-muted-foreground mb-4">
                We understand the need for respecting the privacy of the users. For this purpose, we undertake the following steps:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                  Limited Cookie Usage: We only utilize cookies for a specific purpose: to maintain user sessions. This means if you create an account on Aspirants (if applicable), cookies will help you stay logged in for a convenient browsing experience. We do not use cookies for tracking your browsing activity or for any marketing purposes, whatsoever.
                </li>
                <li>
                  Voluntary Data Collection: We collect your email address only when you choose to subscribe to our email list or contact us, using your email.
                </li>
              </ul>
            </Section>

            <Section title="Use of Personal Information">
              <p className="text-sm text-muted-foreground mb-4">
                We only use the email addresses provided by you for 3 purposes, namely:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                  Enable you to login and register on the website, thus storing your progress on the website
                </li>
                <li>
                  Send you important information about the Website, including updates, announcements, and new features.
                </li>
                <li>
                  Respond to your inquiries and requests for support, in case you contact us.
                </li>
              </ol>
            </Section>

            <Section title="Security of Collected Data">
              <p className="text-sm text-muted-foreground mb-4">Measures are taken to protect your data:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                  SSL Certification: The website is SSL (Secure Sockets Layer) certified, enabling encrypted communication between your web browser and our web server.
                </li>
                <li>
                  Third-Party Authentication: We use Okta, a secure identity management provider, to handle user registration and login. This service ensures that your email address and login credentials are protected with industry-standard security measures.
                </li>
              </ol>
              <p className="text-sm text-muted-foreground mt-4">
                However, please note, no website is completely secure.
              </p>
            </Section>

            <Section title="Sharing of Data">
              <p className="text-sm text-muted-foreground">
                We do not share or sell your data to any third party, for marketing purposes or any other reason otherwise. Data is only shared with Okta, as mentioned above, for security purposes.
              </p>
            </Section>

            <Section title="Retention of Data">
              <p className="text-sm text-muted-foreground">
                We retain your email address for as long as your account is active on our website. If you choose to delete your account or request the erasure of your data, we will remove your information promptly and usually within 30 days. To delete your account or request data erasure, please contact us on aspirants.contact@gmail.com.
              </p>
            </Section>

            <Section title="User Rights">
              <p className="text-sm text-muted-foreground mb-4">
                Under the Digital Personal Data Protection Act, 2023 (DPDP Act), as passed by both of the houses of the Parliament of India, you have the following rights as a user:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>The right to access your personal data</li>
                <li>The right to correct your personal data</li>
                <li>The right to the erasure of your personal data</li>
                <li>The right to restrict the processing of your personal data</li>
                <li>The right to data portability</li>
                <li>The right to withdraw consent</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Aspirants is dedicated to upholding the rights of the users. Thus, to exercise any of these rights, please contact us at aspirants.contact@gmail.com.
              </p>
            </Section>

            <Section title="Changes to this Privacy Policy">
              <p className="text-sm text-muted-foreground">
                We may update this Privacy Policy from time to time to reflect changes in our practices or comply with legal requirements. We will notify you of any changes by posting the new Privacy Policy on the Website. You are also thus advised to review this Privacy Policy periodically for any changes.
              </p>
            </Section>

            <Section title="Children&apos;s Privacy">
              <p className="text-sm text-muted-foreground">
                Aspirants is intended for users 18 years of age and older. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at aspirants.contact@gmail.com. We will take steps to remove the information from our systems.
              </p>
            </Section>

            <Section title="Contact Us">
              <p className="text-sm text-muted-foreground">
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at aspirants.contact@gmail.com.
              </p>
            </Section>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

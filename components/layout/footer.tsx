"use client";

import { useState } from "react";
import Modal from "@/components/shared/modal";

export default function Footer() {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <div className="relative w-full py-5 text-center">
     <div className="bg-white shadow-md py-8 mt-10">
  <div className="container mx-auto px-4">
    <div className="flex flex-col md:flex-row justify-center md:space-x-8 text-center md:text-left space-y-4 md:space-y-0">
      <div>
        <h3 className="font-bold mb-4">Resources</h3>
        <ul>
          <li className="mb-2"><a href="#" className="text-gray-600 hover:text-gray-800">Examples</a></li>
          <li className="mb-2"><a href="#" className="text-gray-600 hover:text-gray-800">Help Center</a></li>
          <li className="mb-2"><a href="#" className="text-gray-600 hover:text-gray-800">Support</a></li>
          <li className="mb-2"><a href="#" className="text-gray-600 hover:text-gray-800">Events</a></li>
        </ul>
      </div>
      <div>
        <h3 className="font-bold mb-4">About</h3>
        <ul>
          <li className="mb-2"><a href="#" className="text-gray-600 hover:text-gray-800">Our Story</a></li>
          <li className="mb-2"><a href="#" className="text-gray-600 hover:text-gray-800">Media Kit</a></li>
          <li className="mb-2"><a href="#" className="text-gray-600 hover:text-gray-800">Blog</a></li>
          <li className="mb-2"><a href="#" className="text-gray-600 hover:text-gray-800">Careers</a></li>
          <li className="mb-2"><a href="#" className="text-gray-600 hover:text-gray-800">Email us</a></li>
        </ul>
      </div>
    </div>

    <div className="flex flex-col md:flex-row justify-center items-center mt-10 text-gray-600 space-y-2 md:space-y-0 md:space-x-4">
      <a href="#" className="hover:underline" onClick={() => setShowCookieModal(true)}>Cookie Statement</a>
      <a href="#" className="hover:underline" onClick={() => setShowTermsModal(true)}>Terms of Service</a>
      <a href="#" className="hover:underline" onClick={() => setShowPrivacyModal(true)}>Privacy Policy</a>
    </div>
    <div className="flex justify-center space-x-4 mt-4">
      <a href="#" className="text-gray-600 hover:text-gray-800"><i className="fab fa-facebook-f"></i></a>
      <a href="#" className="text-gray-600 hover:text-gray-800"><i className="fab fa-twitter"></i></a>
      <a href="#" className="text-gray-600 hover:text-gray-800"><i className="fab fa-instagram"></i></a>
      <a href="#" className="text-gray-600 hover:text-gray-800"><i className="fab fa-youtube"></i></a>
      <a href="#" className="text-gray-600 hover:text-gray-800"><i className="fab fa-tiktok"></i></a>
      <a href="#" className="text-gray-600 hover:text-gray-800"><i className="fab fa-linkedin-in"></i></a>
    </div>
    <div className="text-center text-gray-600 mt-4">
      &copy; 2024 aspirants.tech. All rights reserved.
    </div>
  </div>
</div>

      <Modal showModal={showPrivacyModal} setShowModal={setShowPrivacyModal} className="max-w-2xl">
        <div className="w-full overflow-hidden md:max-w-2xl md:rounded-2xl md:border md:border-gray-100 md:shadow-xl">
          <div className="flex flex-col items-center justify-center space-y-3 bg-white px-4 py-6 pt-8 text-center md:px-16">
            <h2 className="font-display text-2xl font-bold">Aspirants Privacy Policy</h2>
            <p className="text-sm text-gray-500">Effective date: 23rd June, 2024</p>
          </div>
          <div className="overflow-y-auto max-h-[60vh] px-4 py-6 text-left text-gray-700">
            <p className="mb-4">
              In addition to our Terms and Conditions, Aspirants is dedicated to maintaining the privacy of its users and protecting their data.
            </p>
            <p className="mb-4">
              This privacy policy highlights and explains the policy of Aspirants, (hereinafter referred to as &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), and its website aspirants.tech (hereinafter referred to as &quot;the website&quot;) with respect to collection, storage and usage of your data during the course of your interaction with the Website.
            </p>
            <p className="mb-4">
              Please read this Privacy Policy carefully and in conjunction with the Terms of Use. If you do not understand this policy, or do not accept any part of it, then you should not use the Platform, as the case may be. Your use and/or continued use of the Platform, amounts to consent to the terms of this Privacy Policy as well as the Terms and Conditions. For any questions, please contact [email id].
            </p>
            <h3 className="font-semibold mb-2">Information collected from you</h3>
            <p className="mb-4">
              We understand the need for respecting the privacy of the users. For this purpose, we undertake the following steps:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li className="mb-2">Limited Cookie Usage: We only utilize cookies for a specific purpose: to maintain user sessions. This means if you create an account on Aspirants (if applicable), cookies will help you stay logged in for a convenient browsing experience. We do not use cookies for tracking your browsing activity or for any marketing purposes, whatsoever.</li>
              <li className="mb-2">Voluntary Data Collection: We collect your email address only when you choose to subscribe to our email list or contact us, using your email.</li>
            </ul>
            <h3 className="font-semibold mb-2">Use of Personal Information</h3>
            <p className="mb-4">
              We only use the email addresses provided by you for 3 purposes, namely:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li className="mb-2">Enable you to login and register on the website, thus storing your progress on the website</li>
              <li className="mb-2">Send you important information about the Website, including updates, announcements, and new features.</li>
              <li className="mb-2">Respond to your inquiries and requests for support, in case you contact us.</li>
            </ul>
            <h3 className="font-semibold mb-2">Security of Collected Data</h3>
            <p className="mb-4">
              Measures are taken to protect your data:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li className="mb-2">SSL Certification: The website is SSL (Secure Sockets Layer) certified, enabling encrypted communication between your web browser and our web server.</li>
              <li className="mb-2">Third-Party Authentication: We use Okta, a secure identity management provider, to handle user registration and login. This service ensures that your email address and login credentials are protected with industry-standard security measures.</li>
            </ul>
            <p className="mb-4">
              However, please note, no website is completely secure.
            </p>
            <h3 className="font-semibold mb-2">Sharing of Data</h3>
            <p className="mb-4">
              We do not share or sell your data to any third party, for marketing purposes or any other reason otherwise. Data is only shared with Okta, as mentioned above, for security purposes.
            </p>
            <h3 className="font-semibold mb-2">Retention of Data</h3>
            <p className="mb-4">
              We retain your email address for as long as your account is active on our website. If you choose to delete your account or request the erasure of your data, we will remove your information promptly and usually within 30 days. To delete your account or request data erasure, please contact us on [mail id].
            </p>
            <h3 className="font-semibold mb-2">User Rights</h3>
            <p className="mb-4">
              Under the Digital Personal Data Protection Act, 2023 (DPDP Act), as passed by both of the houses of the Parliament of India, you have the following rights as a user:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li className="mb-2">The right to access your personal data</li>
              <li className="mb-2">The right to correct your personal data</li>
              <li className="mb-2">The right to the erasure of your personal data</li>
              <li className="mb-2">The right to restrict the processing of your personal data</li>
              <li className="mb-2">The right to data portability</li>
              <li className="mb-2">The right to withdraw consent</li>
            </ul>
            <p className="mb-4">
              Aspirants is dedicated to upholding the rights of the users. Thus, to exercise any of these rights, please contact us at [mail id].
            </p>
            <h3 className="font-semibold mb-2">Changes to this Privacy Policy</h3>
            <p className="mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices or comply with legal requirements. We will notify you of any changes by posting the new Privacy Policy on the Website. You are also thus advised to review this Privacy Policy periodically for any changes.
            </p>
            <h3 className="font-semibold mb-2">Children&apos;s Privacy</h3>
            <p className="mb-4">
              Aspirants is intended for users 18 years of age and older. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at [email id]. We will take steps to remove the information from our systems.
            </p>
            <h3 className="font-semibold mb-2">Contact Us</h3>
            <p className="mb-4">
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at [mail id].
            </p>
            <div className="text-center">
            </div>
          </div>
        </div>
      </Modal>

      <Modal showModal={showCookieModal} setShowModal={setShowCookieModal} className="max-w-2xl">
        <div className="w-full overflow-hidden md:max-w-2xl md:rounded-2xl md:border md:border-gray-100 md:shadow-xl">
          <div className="flex flex-col items-center justify-center space-y-3 bg-white px-4 py-6 pt-8 text-center md:px-16">
            <h2 className="font-display text-2xl font-bold">Aspirants Cookie Policy</h2>
          </div>
          <div className="overflow-y-auto max-h-[60vh] px-4 py-6 text-left text-gray-700">
            <p className="mb-4">
              This is the cookie policy for Aspirants (&quot;Aspirants&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot;). For more information about how we may use personal data, please read our privacy policy or contact us at [email id].
            </p>
            <h3 className="font-semibold mb-2">What is a Cookie</h3>
            <p className="mb-4">
              A cookie is a small text file that is downloaded onto your device when you access a website. It is sent through your browser, and it helps us to recognise you and your device.
            </p>
            <p className="mb-4">
              There are technologies, which, although technically not &quot;cookies&quot;, are like cookies. These include:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li className="mb-2">Web beacons/pixels: used to count the number of users who have interacted with some content on our website</li>
              <li className="mb-2">Local storage: storage of data in your device&apos;s (phone, laptop, computer, etc.) local cache (temporary memory)</li>
              <li className="mb-2">Scripts: Computer programs designed to give extra functionality</li>
            </ul>
            <h3 className="font-semibold mb-2">Different Types of Cookies</h3>
            <p className="mb-4">
              The different types of cookies include:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li className="mb-2">First party cookies: these are the cookies created by us which you might encounter while using our website</li>
              <li className="mb-2">Third party cookies: these are the cookies created by third party platforms which you might encounter while using our website</li>
              <li className="mb-2">Session cookies: these are the cookies which only last for the duration of your visit to our website</li>
              <li className="mb-2">Persistent cookies: these are the cookies which last for a longer period of time than Session Cookies</li>
              <li className="mb-2">Zombie cookies: these are the cookies that are automatically recreated after you delete it. We DO NOT use this type of malicious cookie.</li>
            </ul>
            <h3 className="font-semibold mb-2">How we use Cookies</h3>
            <p className="mb-4">
              We use cookies for a variety of purposes, including but not limited to:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li className="mb-2">Keeping you logged into our website</li>
              <li className="mb-2">Analyzing your site usage patterns, such as the duration of your visit, and so on.</li>
              <li className="mb-2">Tracking you navigate and engage with our site&apos;s pages to detect and resolve technical problems.</li>
            </ul>
            <p className="mb-4">
              Please keep in mind that cookies are necessary for the functioning of our website. We only use first party, third party and session cookies. We do not use any type of marketing cookie.
            </p>
            <p className="mb-4">
              You can change your browser settings to not accept any cookies. Your browser will allow you to:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li className="mb-2">See what cookies are installed on your browser</li>
              <li className="mb-2">Block any cookie</li>
              <li className="mb-2">Delete cookies from your browser</li>
            </ul>
            <p className="mb-4">
              However, it may impact your experience on different websites, including our site.
            </p>
            <p className="mb-4">
              For more information on how to manage your cookies on your browser, please browse through:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li className="mb-2"><a href="https://support.google.com/chrome/answer/95647?hl=en" className="text-blue-500">Google Chrome</a></li>
              <li className="mb-2"><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" className="text-blue-500">Firefox</a></li>
              <li className="mb-2"><a href="https://support.microsoft.com/en-us/microsoft-edge/view-cookies-in-microsoft-edge-a7d95376-f2cd-8e4a-25dc-1de753474879" className="text-blue-500">Microsoft Edge</a></li>
              <li className="mb-2"><a href="https://support.apple.com/en-in/105082" className="text-blue-500">Safari</a></li>
            </ul>
            <h3 className="font-semibold mb-2">Changes to this Policy</h3>
            <p className="mb-4">
              We may change this policy from time to time. As such, you should check this policy each and every time you visit our website. Any changes will be notified on the site.
            </p>
            <p className="mb-4">
              For more information, please check out our privacy policy or email us at [email id].
            </p>
          </div>
        </div>
      </Modal>

      <Modal showModal={showTermsModal} setShowModal={setShowTermsModal} className="max-w-2xl">
        <div className="w-full overflow-hidden md:max-w-2xl md:rounded-2xl md:border md:border-gray-100 md:shadow-xl">
          <div className="flex flex-col items-center justify-center space-y-3 bg-white px-4 py-6 pt-8 text-center md:px-16">
            <h2 className="font-display text-2xl font-bold">Aspirants Terms of Service</h2>
            <p className="text-sm text-gray-500">Effective Date: 24th June 2024</p>
          </div>
          <div className="overflow-y-auto max-h-[60vh] px-4 py-6 text-left text-gray-700">
            <h3 className="font-semibold mb-2">Introduction</h3>
            <p className="mb-4">
              These Terms and Conditions of Use apply to the Aspirants website located at www.aspirants.tech.
            </p>
            <p className="mb-4">
              BY USING THE SITE, YOU AGREE TO THESE TERMS OF USE; IF YOU DO NOT AGREE, DO NOT USE THE SITE.
            </p>
            <p className="mb-4">
              Aspirants reserves the right, at its sole discretion, to change, modify, add or remove portions of these Terms and Conditions at any time. It is your responsibility to check these Terms and Conditions periodically for changes. Your continued use of the website following the posting of changes will mean that you accept and agree to the changes. As long as you comply with these Terms and Conditions, Aspirants grants you a personal, non-exclusive, non-transferable, limited privilege to enter and use the Site.
            </p>
            <h3 className="font-semibold mb-2">Use of the App</h3>
            <p className="mb-4">
              You may need to create an Aspirants account to use all or part of our Service. Your username and password are for your personal use only and should be kept confidential. You understand that you are responsible for all use (including any unauthorized use) of your username and password. Notify us immediately if your username or password is lost or stolen, or if you believe there has been unauthorized access to your account. We may reclaim, or require you to change, your username for any reason.
            </p>
            <p className="mb-4">
              You may use our Services only for lawful personal use, and in accordance with these Terms and Conditions. Aspirants may, in its sole discretion, terminate your right to use our Services at any time, and may take all available legal recourse for actual or suspected violations of these Terms and Conditions, including deletion of your account made in violation of these Terms and Condition. Any delay by Aspirants in taking such actions does not constitute a waiver of Aspirants’ rights to enforce these Terms and Conditions. By making the Services available for your use, Aspirants does not consent to act as your agent or fiduciary.
            </p>
            <p className="mb-4">
              We may provide links to other websites or Internet resources for your convenience only, and such links do not signify or imply our endorsement of such other website or resource or its contents over which we have no control and which we do not monitor. You use those links at your own risk and should apply a reasonable level of caution and discretion in doing so. You agree that we shall have no responsibility or liability for any information, software, or materials found at any other web site or internet resource.
            </p>
            <p className="mb-4">
              You agree to use the Site only for lawful purposes and in accordance with these Terms. You are prohibited from:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li className="mb-2">Using the Site in any manner that could disable, overburden, damage, or impair the Site or interfere with any other party&apos;s use of the Site.</li>
              <li className="mb-2">Using any robot, spider, or other automatic device, process, or means to access the Site for any purpose, including monitoring or copying any of the material on the Site.</li>
              <li className="mb-2">Introducing any viruses, trojan horses, worms, logic bombs, or other material that is malicious or technologically harmful.</li>
              <li className="mb-2">Attempting to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Site, the server on which the Site is stored, or any server, computer, or database connected to the Site.</li>
              <li className="mb-2">Engaging in any other conduct that restricts or inhibits anyone&apos;s use or enjoyment of the Site, or which, as determined by us, may harm us or users of the Site, or expose them to liability.</li>
            </ul>
            <p className="mb-4">
              Aspirants reserves the right to change, suspend, or discontinue any of the Services for you, any or all users, at any time, for any reason, including those laid out in Aspirants’ policies under these Terms and Conditions. We will not be liable to you for the effect that any changes to the Services may have on you.
            </p>
            <h3 className="font-semibold mb-2">Intellectual Property</h3>
            <p className="mb-4">
              Unless otherwise stated, copyright and all intellectual property rights in all material presented on the site (including but not limited to text, audio, video or graphical images), trademarks and logos appearing on this site are the property of Aspirants and are protected under applicable Indian laws. You agree not to use any framing techniques to enclose any trademark or logo or other proprietary information of Aspirants; or remove, conceal or obliterate any copyright or other proprietary notice or any credit-line or dateline on other mark or source identifier included on the Site / Service, including without limitation, the size, colour, location or style of all proprietary marks. Any infringement shall be vigorously defended and pursued to the fullest extent permitted by law. You may not copy, reproduce, distribute, publish, enter into a database, display, perform, modify, create derivative works from, transmit or in any way exploit any part of our site or any content thereon. You may not distribute any part of this site or any content thereon over any network, including, without limitation, a local area network, or sell or offer it for sale. In addition, these files may not be used to construct any kind of database.
            </p>
            <h3 className="font-semibold mb-2">Applicable Laws</h3>
            <p className="mb-4">
              These Terms and Conditions and the relationship between Aspirants and its users shall be governed by the laws of the Republic of India as applied to agreements made, entered, and performed entirely in Republic of India, notwithstanding the users’ place of residence. All lawsuits arising from or relating to these Terms and Conditions, or your use of the Services shall be brought in the courts located in New Delhi, India, and you hereby irrevocably submit to the exclusive personal jurisdiction of such courts for such purpose.
            </p>
            <h3 className="font-semibold mb-2">Privacy</h3>
            <p className="mb-4">
              Your use of the Site is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal data. By using the Site, you consent to the collection and use of your data as described in our Privacy Policy, along with the Terms and Conditions.
            </p>
            <h3 className="font-semibold mb-2">Disclaimers</h3>
            <p className="mb-4">
              The Site and all materials provided through the Site are provided on an &quot;as-is&quot; and &quot;as-available&quot; basis, without any warranties of any kind, either express or implied. We do not warrant that the Site will be uninterrupted, error-free, or free from viruses or other harmful components. The content provided on the Site is for educational purposes only. We do not guarantee the accuracy, completeness, or usefulness of any information on the Site.
            </p>
            <p className="mb-4">
              By using Aspirants, you agree to defend, indemnify, and hold harmless Aspirants, its affiliates, and their respective officers, directors, employees, and agents, from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to legal fees) arising from:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li className="mb-2">Your Use of the Site: Any use of our Site, its content, or services, other than as expressly authorized in these Terms and Conditions, including any use that is illegal, unauthorized, or not in accordance with the intended purposes of Aspirants.</li>
              <li className="mb-2">Violation of Terms: Any breach or violation of these Terms and Conditions, the Privacy Policy, or any other policy or guidelines set forth by Aspirants. This includes, but is not limited to, any unauthorized access to our systems or misuse of the information available through our Site.</li>
              <li className="mb-2">User Content: Any content you post, upload, submit, or otherwise transmit through our Site, including but not limited to, claims regarding the infringement of intellectual property rights, defamation, privacy violations, or any other wrongful act.</li>
            </ul>
            <h3 className="font-semibold mb-2">Contact</h3>
            <p className="mb-4">
              By using our Site, you acknowledge that you have read, understood, and agreed to these Terms and Conditions. If you have any questions, concerns, or feedback, please contact us at [email id].
            </p>
            <p className="mb-4">
              Thank you for choosing Aspirants.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

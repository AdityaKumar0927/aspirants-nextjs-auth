// src/components/Footer.tsx
"use client";

import { useState } from "react";
import Modal from "@/components/shared/modal";

export default function Footer() {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <div className="relative w-full py-5 text-center">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 mx-32 gap-8 text-left">
          <div>
            <h3 className="font-bold mb-4">Product</h3>
            <ul>
              <li className="mb-2"><a href="#" className="text-gray-600">How it works</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">Features</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">Integrations</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">aspirants Stories</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">Pricing</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">Enterprise</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">Start for free</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Use Cases</h3>
            <ul>
              <li className="mb-2"><a href="#" className="text-gray-600">Product Teams</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">Design Teams</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">Design Agencies</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">Tech Startups</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">Agile Teams</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">Educational Institutions</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Resources</h3>
            <ul>
              <li className="mb-2"><a href="#" className="text-gray-600">Examples</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">Help Center</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">Support</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">Events</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">About</h3>
            <ul>
              <li className="mb-2"><a href="#" className="text-gray-600">Our Story</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">Media Kit</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">Blog</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">Careers</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600">Email us</a></li>
            </ul>
          </div>
        </div>
        <div className="flex justify-center items-center mt-10 text-gray-600">
          <a href="#" className="mr-4">Cookie Statement</a>
          <a href="#" className="mr-4">Terms of Service</a>
          <a href="#" onClick={() => setShowPrivacyModal(true)}>Privacy Policy</a>
        </div>
        <div className="flex justify-center space-x-4 mt-4">
          <a href="#" className="text-gray-600"><i className="fab fa-facebook-f"></i></a>
          <a href="#" className="text-gray-600"><i className="fab fa-twitter"></i></a>
          <a href="#" className="text-gray-600"><i className="fab fa-instagram"></i></a>
          <a href="#" className="text-gray-600"><i className="fab fa-youtube"></i></a>
          <a href="#" className="text-gray-600"><i className="fab fa-tiktok"></i></a>
          <a href="#" className="text-gray-600"><i className="fab fa-linkedin-in"></i></a>
        </div>
        <div className="text-center text-gray-600 mt-4">
          © 2024 aspirants.tech. All rights reserved. 
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
              This privacy policy highlights and explains the policy of Aspirants, (hereinafter referred to as “we”, “us”, or “our”), and its website aspirants.tech (hereinafter referred to as “the website”) with respect to collection, storage and usage of your data during the course of your interaction with the Website.
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
            <h3 className="font-semibold mb-2">Children’s Privacy</h3>
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
    </div>
  );
}

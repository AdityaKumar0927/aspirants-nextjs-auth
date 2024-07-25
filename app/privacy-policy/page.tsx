import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="bg-white min-h-screen flex justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-5xl font-bold mb-6 font-sans">Privacy Policy</h1>
        <p className="text-lg text-gray-700 mb-4 font-sans">Effective date: 23rd June, 2024</p>
        <p className="text-lg text-gray-700 mb-4 font-sans">
          In addition to our Terms and Conditions, Aspirants is dedicated to maintaining the privacy of its users and protecting their data.
        </p>
        <p className="text-lg text-gray-700 mb-4 font-sans">
          This privacy policy highlights and explains the policy of Aspirants, (hereinafter referred to as “we”, “us”, or “our”), and its website aspirants.tech (hereinafter referred to as “the website”) with respect to collection, storage, and usage of your data during the course of your interaction with the Website.
        </p>
        <p className="text-lg text-gray-700 mb-4 font-sans">
          Please read this Privacy Policy carefully and in conjunction with the Terms of Use. If you do not understand this policy, or do not accept any part of it, then you should not use the Platform, as the case may be. Your use and/or continued use of the Platform, amounts to consent to the terms of this Privacy Policy as well as the Terms and Conditions. For any questions, please contact [email id].
        </p>

        <h2 className="text-3xl font-semibold mb-4 font-sans">Information collected from you</h2>
        <p className="text-lg text-gray-700 mb-4 font-sans">
          We understand the need for respecting the privacy of the users. For this purpose, we undertake the following steps:
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 mb-4 font-sans">
          <li>Limited Cookie Usage: We only utilize cookies for a specific purpose: to maintain user sessions. This means if you create an account on Aspirants (if applicable), cookies will help you stay logged in for a convenient browsing experience. We do not use cookies for tracking your browsing activity or for any marketing purposes, whatsoever.</li>
          <li>Voluntary Data Collection: We collect your email address only when you choose to subscribe to our email list or contact us, using your email.</li>
        </ul>

        <h2 className="text-3xl font-semibold mb-4 font-sans">Use of Personal Information</h2>
        <p className="text-lg text-gray-700 mb-4 font-sans">We only use the email addresses provided by you for 3 purposes, namely:</p>
        <ol className="list-decimal list-inside text-lg text-gray-700 mb-4 font-sans">
          <li>Enable you to login and register on the website, thus storing your progress on the website</li>
          <li>Send you important information about the Website, including updates, announcements, and new features.</li>
          <li>Respond to your inquiries and requests for support, in case you contact us.</li>
        </ol>

        <h2 className="text-3xl font-semibold mb-4 font-sans">Security of Collected Data</h2>
        <p className="text-lg text-gray-700 mb-4 font-sans">Measures are taken to protect your data:</p>
        <ol className="list-decimal list-inside text-lg text-gray-700 mb-4 font-sans">
          <li>SSL Certification: The website is SSL (Secure Sockets Layer) certified, enabling encrypted communication between your web browser and our web server.</li>
          <li>Third-Party Authentication: We use Okta, a secure identity management provider, to handle user registration and login. This service ensures that your email address and login credentials are protected with industry-standard security measures.</li>
        </ol>
        <p className="text-lg text-gray-700 mb-4 font-sans">However, please note, no website is completely secure.</p>

        <h2 className="text-3xl font-semibold mb-4 font-sans">Sharing of Data</h2>
        <p className="text-lg text-gray-700 mb-4 font-sans">
          We do not share or sell your data to any third party, for marketing purposes or any other reason otherwise. Data is only shared with Okta, as mentioned above, for security purposes.
        </p>

        <h2 className="text-3xl font-semibold mb-4 font-sans">Retention of Data</h2>
        <p className="text-lg text-gray-700 mb-4 font-sans">
          We retain your email address for as long as your account is active on our website. If you choose to delete your account or request the erasure of your data, we will remove your information promptly and usually within 30 days. To delete your account or request data erasure, please contact us on [mail id].
        </p>

        <h2 className="text-3xl font-semibold mb-4 font-sans">User Rights</h2>
        <p className="text-lg text-gray-700 mb-4 font-sans">
          Under the Digital Personal Data Protection Act, 2023 (DPDP Act), as passed by both of the houses of the Parliament of India, you have the following rights as a user:
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 mb-4 font-sans">
          <li>The right to access your personal data</li>
          <li>The right to correct your personal data</li>
          <li>The right to the erasure of your personal data</li>
          <li>The right to restrict the processing of your personal data</li>
          <li>The right to data portability</li>
          <li>The right to withdraw consent</li>
        </ul>
        <p className="text-lg text-gray-700 mb-4 font-sans">
          Aspirants is dedicated to upholding the rights of the users. Thus, to exercise any of these rights, please contact us at [mail id].
        </p>

        <h2 className="text-3xl font-semibold mb-4 font-sans">Changes to this Privacy Policy</h2>
        <p className="text-lg text-gray-700 mb-4 font-sans">
          We may update this Privacy Policy from time to time to reflect changes in our practices or comply with legal requirements. We will notify you of any changes by posting the new Privacy Policy on the Website. You are also thus advised to review this Privacy Policy periodically for any changes.
        </p>

        <h2 className="text-3xl font-semibold mb-4 font-sans">Children’s Privacy</h2>
        <p className="text-lg text-gray-700 mb-4 font-sans">
          Aspirants is intended for users 18 years of age and older. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at [email id]. We will take steps to remove the information from our systems.
        </p>

        <h2 className="text-3xl font-semibold mb-4 font-sans">Contact Us</h2>
        <p className="text-lg text-gray-700 mb-4 font-sans">
          If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at [mail id].
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

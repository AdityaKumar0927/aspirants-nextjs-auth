// components/layout/sign-in-modal.tsx
import Modal2 from "@/components/layout/modal-2";
import { signIn } from "next-auth/react";
import { useState, Dispatch, SetStateAction, useCallback, useMemo, useRef } from "react";
import { LoadingDots, Google } from "@/components/shared/icons";
import Image from "next/image";
import { Badge } from "../magicui/badge";
import FlickeringGrid from "../magicui/flickering-grid";
import { Button } from "@/app/Contact/button";
import { faCircleArrowRight } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import Tooltip from "../shared/tooltip";
import AnimatedModal from "../shared/AnimatedModal";
import {
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { EnterFullScreenIcon } from "@radix-ui/react-icons";
import Modal from "../shared/modal";

const policies = [
  {
    title: "Terms and Conditions",
    content: `
      <div>
        <h2 className="text-3xl font-semibold mb-4">Introduction</h2>
        <p className="text-lg text-gray-700 mb-4">
          These Terms and Conditions of Use apply to the Aspirants website located at www.aspirants.tech.
        </p>
        <p className="text-lg text-gray-700 mb-4">
          BY USING THE SITE, YOU AGREE TO THESE TERMS OF USE; IF YOU DO NOT AGREE, DO NOT USE THE SITE.
        </p>
        <p className="text-lg text-gray-700 mb-4">
          Aspirants reserves the right, at its sole discretion, to change, modify, add or remove portions of these Terms and Conditions at any time. It is your responsibility to check these Terms and Conditions periodically for changes. Your continued use of the website following the posting of changes will mean that you accept and agree to the changes. As long as you comply with these Terms and Conditions, Aspirants grants you a personal, non-exclusive, non-transferable, limited privilege to enter and use the Site.
        </p>
        <p className="text-lg text-gray-700 mb-4">
          You are advised to read these Terms and Conditions every time you open this website. If you would like to print this agreement, please click the print button on your browser toolbar.
        </p>

        <h2 className="text-3xl font-semibold mb-4">Use of the App</h2>
        <p className="text-lg text-gray-700 mb-4">
          You may need to create an Aspirants account to use all or part of our Service. Your username and password are for your personal use only and should be kept confidential. You understand that you are responsible for all use (including any unauthorized use) of your username and password. Notify us immediately if your username or password is lost or stolen, or if you believe there has been unauthorized access to your account. We may reclaim, or require you to change, your username for any reason.
        </p>
        <p className="text-lg text-gray-700 mb-4">
          You may use our Services only for lawful personal use, and in accordance with these Terms and Conditions. Aspirants may, in its sole discretion, terminate your right to use our Services at any time, and may take all available legal recourse for actual or suspected violations of these Terms and Conditions, including deletion of your account made in violation of these Terms and Conditions. Any delay by Aspirants in taking such actions does not constitute a waiver of Aspirants&apos; rights to enforce these Terms and Conditions. By making the Services available for your use, Aspirants does not consent to act as your agent or fiduciary.
        </p>
        <p className="text-lg text-gray-700 mb-4">
          We may provide links to other websites or Internet resources for your convenience only, and such links do not signify or imply our endorsement of such other website or resource or its contents over which we have no control and which we do not monitor. You use those links at your own risk and should apply a reasonable level of caution and discretion in doing so. You agree that we shall have no responsibility or liability for any information, software, or materials found at any other web site or internet resource.
        </p>
        <p className="text-lg text-gray-700 mb-4">
          You agree to use the Site only for lawful purposes and in accordance with these Terms. You are prohibited from:
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 mb-4">
          <li>Using the Site in any manner that could disable, overburden, damage, or impair the Site or interfere with any other party&apos;s use of the Site.</li>
          <li>Using any robot, spider, or other automatic device, process, or means to access the Site for any purpose, including monitoring or copying any of the material on the Site.</li>
          <li>Introducing any viruses, trojan horses, worms, logic bombs, or other material that is malicious or technologically harmful.</li>
          <li>Attempting to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Site, the server on which the Site is stored, or any server, computer, or database connected to the Site.</li>
          <li>Engaging in any other conduct that restricts or inhibits anyone&apos;s use or enjoyment of the Site, or which, as determined by us, may harm us or users of the Site, or expose them to liability.</li>
        </ul>
        <p className="text-lg text-gray-700 mb-4">
          Aspirants reserves the right to change, suspend, or discontinue any of the Services for you, any or all users, at any time, for any reason, including those laid out in Aspirants&apos; policies under these Terms and Conditions. We will not be liable to you for the effect that any changes to the Services may have on you.
        </p>

        <h2 className="text-3xl font-semibold mb-4">Intellectual Property</h2>
        <p className="text-lg text-gray-700 mb-4">
          Unless otherwise stated, copyright and all intellectual property rights in all material presented on the site (including but not limited to text, audio, video or graphical images), trademarks and logos appearing on this site are the property of Aspirants and are protected under applicable Indian laws. You agree not to use any framing techniques to enclose any trademark or logo or other proprietary information of Aspirants; or remove, conceal or obliterate any copyright or other proprietary notice or any credit-line or dateline on other mark or source identifier included on the Site / Service, including without limitation, the size, colour, location or style of all proprietary marks. Any infringement shall be vigorously defended and pursued to the fullest extent permitted by law. You may not copy, reproduce, distribute, publish, enter into a database, display, perform, modify, create derivative works from, transmit or in any way exploit any part of our site or any content thereon. You may not distribute any part of this site or any content thereon over any network, including, without limitation, a local area network, or sell or offer it for sale. In addition, these files may not be used to construct any kind of database.
        </p>

        <h2 className="text-3xl font-semibold mb-4">Applicable Laws</h2>
        <p className="text-lg text-gray-700 mb-4">
          These Terms and Conditions and the relationship between Aspirants and its users shall be governed by the laws of the Republic of India as applied to agreements made, entered, and performed entirely in Republic of India, notwithstanding the users&apos; place of residence. All lawsuits arising from or relating to these Terms and Conditions, or your use of the Services shall be brought in the courts located in New Delhi, India, and you hereby irrevocably submit to the exclusive personal jurisdiction of such courts for such purpose.
        </p>

        <h2 className="text-3xl font-semibold mb-4">Privacy</h2>
        <p className="text-lg text-gray-700 mb-4">
          Your use of the Site is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal data. By using the Site, you consent to the collection and use of your data as described in our Privacy Policy, along with the Terms and Conditions.
        </p>

        <h2 className="text-3xl font-semibold mb-4">Disclaimers</h2>
        <p className="text-lg text-gray-700 mb-4">
          The Site and all materials provided through the Site are provided on an &quot;as-is&quot; and &quot;as-available&quot; basis, without any warranties of any kind, either express or implied. We do not warrant that the Site will be uninterrupted, error-free, or free from viruses or other harmful components. The content provided on the Site is for educational purposes only. We do not guarantee the accuracy, completeness, or usefulness of any information on the Site.
        </p>

        <h2 className="text-3xl font-semibold mb-4">Indemnification</h2>
        <p className="text-lg text-gray-700 mb-4">
          By using Aspirants, you agree to defend, indemnify, and hold harmless Aspirants, its affiliates, and their respective officers, directors, employees, and agents, from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to legal fees) arising from:
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 mb-4">
          <li>Your Use of the Site: Any use of our Site, its content, or services, other than as expressly authorized in these Terms and Conditions, including any use that is illegal, unauthorized, or not in accordance with the intended purposes of Aspirants.</li>
          <li>Violation of Terms: Any breach or violation of these Terms and Conditions, the Privacy Policy, or any other policy or guidelines set forth by Aspirants. This includes, but is not limited to, any unauthorized access to our systems or misuse of the information available through our Site.</li>
          <li>User Content: Any content you post, upload, submit, or otherwise transmit through our Site, including but not limited to, claims regarding the infringement of intellectual property rights, defamation, privacy violations, or any other wrongful act.</li>
        </ul>

        <h2 className="text-3xl font-semibold mb-4">Contact</h2>
        <p className="text-lg text-gray-700 mb-4">
          By using our Site, you acknowledge that you have read, understood, and agreed to these Terms and Conditions. If you have any questions, concerns, or feedback, please contact us at [email id].
        </p>
        <p className="text-lg text-gray-700 mb-4">
          Thank you for choosing Aspirants.
        </p>
      </div>
    `,
  },
  {
    title: "Privacy Policy",
    content: `
      <div>
        <h2 className="text-3xl font-semibold mb-4">Effective date: 23rd June 2024</h2>
        <p className="text-lg text-gray-700 mb-4">
          In addition to our Terms and Conditions, Aspirants is dedicated to maintaining the privacy of its users and protecting their data.
        </p>
        <p className="text-lg text-gray-700 mb-4">
          This privacy policy highlights and explains the policy of Aspirants, (hereinafter referred to as &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), and its website aspirants.tech (hereinafter referred to as &quot;the website&quot;) with respect to collection, storage, and usage of your data during the course of your interaction with the Website.
        </p>
        <p className="text-lg text-gray-700 mb-4">
          Please read this Privacy Policy carefully and in conjunction with the Terms of Use. If you do not understand this policy, or do not accept any part of it, then you should not use the Platform, as the case may be. Your use and/or continued use of the Platform, amounts to consent to the terms of this Privacy Policy as well as the Terms and Conditions. For any questions, please contact [email id].
        </p>

        <h2 className="text-3xl font-semibold mb-4">Information collected from you</h2>
        <p className="text-lg text-gray-700 mb-4">
          We understand the need for respecting the privacy of the users. For this purpose, we undertake the following steps:
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 mb-4">
          <li>Limited Cookie Usage: We only utilize cookies for a specific purpose: to maintain user sessions. This means if you create an account on Aspirants (if applicable), cookies will help you stay logged in for a convenient browsing experience. We do not use cookies for tracking your browsing activity or for any marketing purposes, whatsoever.</li>
          <li>Voluntary Data Collection: We collect your email address only when you choose to subscribe to our email list or contact us, using your email.</li>
        </ul>

        <h2 className="text-3xl font-semibold mb-4">Use of Personal Information</h2>
        <p className="text-lg text-gray-700 mb-4">We only use the email addresses provided by you for 3 purposes, namely:</p>
        <ol className="list-decimal list-inside text-lg text-gray-700 mb-4">
          <li>Enable you to login and register on the website, thus storing your progress on the website</li>
          <li>Send you important information about the Website, including updates, announcements, and new features.</li>
          <li>Respond to your inquiries and requests for support, in case you contact us.</li>
        </ol>

        <h2 className="text-3xl font-semibold mb-4">Security of Collected Data</h2>
        <p className="text-lg text-gray-700 mb-4">Measures are taken to protect your data:</p>
        <ol className="list-decimal list-inside text-lg text-gray-700 mb-4">
          <li>SSL Certification: The website is SSL (Secure Sockets Layer) certified, enabling encrypted communication between your web browser and our web server.</li>
          <li>Third-Party Authentication: We use Okta, a secure identity management provider, to handle user registration and login. This service ensures that your email address and login credentials are protected with industry-standard security measures.</li>
        </ol>
        <p className="text-lg text-gray-700 mb-4">However, please note, no website is completely secure.</p>

        <h2 className="text-3xl font-semibold mb-4">Sharing of Data</h2>
        <p className="text-lg text-gray-700 mb-4">
          We do not share or sell your data to any third party, for marketing purposes or any other reason otherwise. Data is only shared with Okta, as mentioned above, for security purposes.
        </p>

        <h2 className="text-3xl font-semibold mb-4">Retention of Data</h2>
        <p className="text-lg text-gray-700 mb-4">
          We retain your email address for as long as your account is active on our website. If you choose to delete your account or request the erasure of your data, we will remove your information promptly and usually within 30 days. To delete your account or request data erasure, please contact us on [mail id].
        </p>

        <h2 className="text-3xl font-semibold mb-4">User Rights</h2>
        <p className="text-lg text-gray-700 mb-4">
          Under the Digital Personal Data Protection Act, 2023 (DPDP Act), as passed by both of the houses of the Parliament of India, you have the following rights as a user:
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 mb-4">
          <li>The right to access your personal data</li>
          <li>The right to correct your personal data</li>
          <li>The right to the erasure of your personal data</li>
          <li>The right to restrict the processing of your personal data</li>
          <li>The right to data portability</li>
          <li>The right to withdraw consent</li>
        </ul>
        <p className="text-lg text-gray-700 mb-4">
          Aspirants is dedicated to upholding the rights of the users. Thus, to exercise any of these rights, please contact us at [mail id].
        </p>

        <h2 className="text-3xl font-semibold mb-4">Changes to this Privacy Policy</h2>
        <p className="text-lg text-gray-700 mb-4">
          We may update this Privacy Policy from time to time to reflect changes in our practices or comply with legal requirements. We will notify you of any changes by posting the new Privacy Policy on the Website. You are also thus advised to review this Privacy Policy periodically for any changes.
        </p>

        <h2 className="text-3xl font-semibold mb-4">Children&apos;s Privacy</h2>
        <p className="text-lg text-gray-700 mb-4">
          Aspirants is intended for users 18 years of age and older. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at [email id]. We will take steps to remove the information from our systems.
        </p>

        <h2 className="text-3xl font-semibold mb-4">Contact Us</h2>
        <p className="text-lg text-gray-700 mb-4">
          If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at [mail id].
        </p>
      </div>
    `,
  },
];


const SignInModal = ({
  showSignInModal,
  setShowSignInModal,
}: {
  showSignInModal: boolean;
  setShowSignInModal: Dispatch<SetStateAction<boolean>>;
}) => {
  const [signInClicked, setSignInClicked] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedCookies, setAcceptedCookies] = useState(false);
  const [isAbove18, setIsAbove18] = useState(false);
  const [currentPolicyIndex, setCurrentPolicyIndex] = useState(0);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const canSignIn = acceptedTerms && acceptedPrivacy && acceptedCookies && isAbove18;

  const currentPolicy = policies[currentPolicyIndex];

  const policyContentRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (policyContentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = policyContentRef.current;
      const isBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setIsScrolledToBottom(isBottom);
    }
  };

  const handleAcceptPolicy = async () => {
    if (isScrolledToBottom) {
      try {
        const policyName =
          currentPolicyIndex === 0 ? 'Terms and Conditions' : currentPolicyIndex === 1 ? 'Privacy Policy' : 'Cookie Policy';
  
        await fetch('/api/policy/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ policyName }),
        });
  
        if (currentPolicyIndex === 0) setAcceptedTerms(!acceptedTerms);
        if (currentPolicyIndex === 1) setAcceptedPrivacy(!acceptedPrivacy);
        if (currentPolicyIndex === 2) setAcceptedCookies(!acceptedCookies);
      } catch (error) {
        console.error('Error saving policy acceptance:', error);
      }
    }
  };
  
  return (
    <Modal2 showModal={showSignInModal} setShowModal={setShowSignInModal}>
      <section className="flex w-full items-start justify-center bg-[url('https://tailframes.com/images/squares-bg.webp')] bg-cover bg-center bg-no-repeat">
        
        <div className="flex max-w-screen-2xl grow flex-col items-start justify-start gap-12 px-3 py-12 md:pt-24 lg:px-0 xl:flex-row">
          <div className="sm:pl-8 lg:pl-16 xl:pl-32 mb-0 flex flex-1 flex-col items-start gap-12 px-0 xl:mb-24">
            <Badge className="bg-white border-2 border-blue-200 text-black hover:text-white">aspirants v1.0</Badge>
            <div className="flex max-w-lg flex-col gap-6">
              <h3 className="text-4xl font-semibold text-slate-950 md:text-6xl">
                 Begin your <div className="text-blue-300">Academic Comeback</div> with Aspirants!
              </h3>
            
            </div>
            <div className="flex gap-4">
              <Button>Save Time</Button>
              <Button>Make Your Own Question Banks in 1-click</Button>
            </div>
          </div>
        </div>

        <div className="w-1/4 mt-36 mx-auto overflow-hidden shadow-xl md:rounded-2xl md:border md:border-gray-200">
          <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center md:px-16">
            <a href="https://aspirants.tech">
              <Image
                src="/bulb.svg"
                alt="Logo"
                className="h-10 w-10 rounded-full"
                width={20}
                height={20}
              />
            </a>
            <h3 className="font-display text-2xl font-bold">Sign In</h3>
            <p className="text-sm text-gray-500">
              This is strictly for demo purposes - only your email and profile picture will be stored.
            </p>
          </div>

          <div className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 md:px-16">
            <div
              className="bg-white rounded-md p-4 shadow-md border border-gray-300 overflow-y-auto max-h-60"
              ref={policyContentRef}
              onScroll={handleScroll}
            >
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-lg mb-2">{currentPolicy.title}</h4>
                <button onClick={() => setShowPolicyModal(true)}>
                  <EnterFullScreenIcon className="h-5 w-5 text-blue-500 cursor-pointer" />
                </button>
              </div>
              <div
                className="text-sm text-gray-600"
                dangerouslySetInnerHTML={{ __html: currentPolicy.content }}
              />
            </div>

            <TooltipProvider>
              <Tooltip content="Scroll down to read the policy before accepting." disabled={isScrolledToBottom}>
                <TooltipTrigger asChild>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={
                        currentPolicyIndex === 0
                          ? acceptedTerms
                          : currentPolicyIndex === 1
                          ? acceptedPrivacy
                          : acceptedCookies
                      }
                      onChange={handleAcceptPolicy}
                      disabled={!isScrolledToBottom}
                    />
                    <span className="text-sm text-gray-600">
                      I have read and accept the {currentPolicy.title}
                    </span>
                  </label>
                </TooltipTrigger>
              </Tooltip>
            </TooltipProvider>

            {currentPolicyIndex < policies.length - 1 ? (
              <button
                className="border border-gray-200 bg-white text-black hover:bg-gray-50 flex h-10 items-center justify-center rounded-md shadow-sm transition-all duration-75 focus:outline-none"
                onClick={() => setCurrentPolicyIndex(currentPolicyIndex + 1)}
              >
                Next
              </button>
              
            ) : (
              <>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={isAbove18}
                    onChange={() => setIsAbove18(!isAbove18)}
                  />
                  <span className="text-sm text-gray-600">
                    I confirm that I am 18 years of age or older.
                  </span>
                </label>
                <button
                  className="border border-gray-200 bg-white text-black hover:bg-gray-50 flex h-10 items-center justify-center rounded-md shadow-sm transition-all duration-75 focus:outline-none"
                  onClick={() => setCurrentPolicyIndex(currentPolicyIndex - 1)}
                >
                  Previous
                </button>
                <button
                  disabled={signInClicked || !canSignIn}
                  className={`${
                    signInClicked || !canSignIn
                      ? "cursor-not-allowed border-gray-200 bg-gray-100"
                      : "border border-gray-200 bg-white text-black hover:bg-gray-50"
                  } flex h-10 w-full items-center justify-center space-x-3 rounded-md border text-sm shadow-sm transition-all duration-75 focus:outline-none mt-4`}
                  onClick={() => {
                    setSignInClicked(true);
                    signIn("google");
                  }}
                >
                  {signInClicked ? (
                    <LoadingDots color="#808080" />
                  ) : (
                    <>
                      <Google className="h-5 w-5" />
                      <p>Sign In with Google</p>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Modal for Viewing Policies */}
      <Modal showModal={showPolicyModal} setShowModal={setShowPolicyModal} className="z-50">
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h4 className="font-bold text-lg mb-4">{currentPolicy.title}</h4>
          <div
            className="text-base text-gray-700 leading-relaxed overflow-y-auto max-h-[70vh]"
            dangerouslySetInnerHTML={{ __html: currentPolicy.content }}
          />
        </div>
      </Modal>
    </Modal2>
  );
};

export function useSignInModal() {
  const [showSignInModal, setShowSignInModal] = useState(false);

  const SignInModalCallback = useCallback(() => {
    return (
      <SignInModal
        showSignInModal={showSignInModal}
        setShowSignInModal={setShowSignInModal}
      />
    );
  }, [showSignInModal, setShowSignInModal]);

  return useMemo(
    () => ({ setShowSignInModal, SignInModal: SignInModalCallback }),
    [setShowSignInModal, SignInModalCallback]
  );
}
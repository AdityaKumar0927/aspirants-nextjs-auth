import { Metadata } from "next"
import Script from "next/script"

export const metadata: Metadata = {
  title: "Contact Us - Everything AI",
  description:
    "Everything AI is a platform that provides a wide range of AI tools and services to help you stay on top of your business. Generate images, text and everything else that you need to get your business off the ground.",
  openGraph: {
    images: ["https://ai-saas-template-aceternity.vercel.app/banner.png"],
  },
}

export default function ContactPage() {
  return (
    <>
      <Script src="https://tally.so/widgets/embed.js" strategy="afterInteractive" />
      <div className="w-full h-screen overflow-hidden">
        <iframe
          data-tally-src="https://tally.so/r/3XReWd?transparentBackground=1"
          width="100%"
          height="100%"
          title="Contact us"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            border: 0,
          }}
        />
      </div>
    </>
  )
}
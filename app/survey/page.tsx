import { Metadata } from "next"
import Script from "next/script"

export default function Survey() {
  return (
    <>
      <Script src="https://tally.so/widgets/embed.js" strategy="afterInteractive" />
      <div className="w-full h-screen overflow-hidden">
        <iframe
          data-tally-src="https://tally.so/r/mZzar0?transparentBackground=1"
          width="100%"
          height="100%"
          title="Survey"
          style={{
            position: 'absolute',
            top: -25,
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
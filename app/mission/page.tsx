import { ArrowRight } from 'lucide-react'

export default function AspirantsMissionPage() {
  return (
    <div className="min-h-screen bg-white text-black p-8 flex flex-col items-center">
      <header className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-normal mb-8">Our Mission</h1>
        <p className="text-xl md:text-2xl font-normal max-w-3xl mx-auto">
          To democratize education by providing every student, regardless of background, the resources they need to succeed.
        </p>
      </header>

      <div className="max-w-4xl w-full space-y-12">
        <section>
          <h2 className="text-3xl mb-4 font-light">The Challenge</h2>
          <p className="text-lg leading-relaxed">
            Every year, tens of millions of students in India hustle through competitive exams, and the process feels more like a battle of endurance than a journey of growth and learning.
          </p>
        </section>

        <section>
          <h2 className="text-3xl mb-4 font-light">The Old Way</h2>
          <p className="text-lg leading-relaxed">
            The old people think that preparing for your dreams has to be stressful, lonely, AND expensive to top it all off.
          </p>
        </section>

        <section>
          <h2 className="text-3xl mb-4 font-light">Our Approach</h2>
          <p className="text-lg leading-relaxed">
            At Aspirants, we think differently. We believe exam preparation should not come with a price tag, or be buried under outdated methods with delusions of &apos;rigour.&apos; It should be interactive - and more importantly, accessible to everyone.
          </p>
        </section>

        <section>
          <h2 className="text-3xl mb-4 font-light">Our Solution</h2>
          <p className="text-lg leading-relaxed">
            Aspirants is more than a website. It&apos;s a space where students can actually enjoy learning, where doubts are solved in real life (where you use our elaborate markschemes or AI), and where success stories aren&apos;t celebrated - they&apos;re created, together.
          </p>
        </section>

        <section>
          <h2 className="text-3xl mb-4 font-light">Our Commitment</h2>
          <p className="text-lg leading-relaxed">
            We&apos;re not here to sell you courses or slap a paywall on knowledge. We&apos;re here to rewrite how students prepare for exams - and make sure anyone, from Delhi to Darbhanga, has access to high quality education.
          </p>
        </section>
      </div>
    </div>
  )
}


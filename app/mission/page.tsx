const cursive = { fontFamily: "'Dancing Script', cursive" } as const

const sections = [
  {
    title: "The Challenge",
    body: "Every year, tens of millions of students in India hustle through competitive exams, and the process feels more like a battle of endurance than a journey of growth and learning.",
  },
  {
    title: "The Old Way",
    body: "The old guard thinks preparing for your dreams has to be stressful, lonely, and — to top it all off — expensive.",
  },
  {
    title: "Our Approach",
    body: "At Penwise, we think differently. Exam preparation shouldn't come with a price tag, or be buried under outdated methods with delusions of “rigour.” It should be interactive — and, more importantly, accessible to everyone.",
  },
  {
    title: "Our Solution",
    body: "Penwise is more than a website. It's a space where students actually enjoy learning, where doubts are solved for real (through our elaborate markschemes or AI), and where success stories aren't celebrated — they're created, together.",
  },
  {
    title: "Our Commitment",
    body: "We're not here to sell you courses or slap a paywall on knowledge. We're here to rewrite how students prepare for exams — and make sure anyone, from Delhi to Darbhanga, has access to high-quality education.",
  },
]

export default function MissionPage() {
  return (
    <div className="min-h-screen px-6 py-16 text-ink sm:py-24">
      <article className="mx-auto max-w-2xl font-serif">
        {/* Title */}
        <header className="mb-14 text-center sm:mb-20">
          <h1
            style={cursive}
            className="text-6xl font-bold leading-tight text-ballpoint sm:text-7xl"
          >
            Our Mission
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-xl leading-relaxed text-pencil sm:text-2xl">
            To democratize education by giving every student — whatever their
            background — the resources they need to succeed.
          </p>
        </header>

        {/* Body */}
        <div className="space-y-14">
          {sections.map((s) => (
            <section key={s.title}>
              <h2
                style={cursive}
                className="mb-3 text-4xl font-semibold text-ink sm:text-5xl"
              >
                {s.title}
              </h2>
              <p className="text-lg leading-loose tracking-wide text-ink/85 sm:text-xl">
                {s.body}
              </p>
            </section>
          ))}
        </div>

        {/* Signature */}
        <footer className="mt-20 border-t border-rule pt-10 text-right">
          <p className="text-base italic text-pencil">With heart,</p>
          <p style={cursive} className="mt-1 text-5xl font-bold text-ballpoint sm:text-6xl">
            Penwise &amp; Team
          </p>
        </footer>
      </article>
    </div>
  )
}

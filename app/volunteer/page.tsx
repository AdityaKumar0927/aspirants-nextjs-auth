import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import T from "@/components/i18n/T"

export default function Component() {
  const values = [
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-12 h-12" fill="currentColor">
          <path d="M12 2L8 6h8L12 2zm0 20l4-4H8l4 4zm8-8l-4-4v8l4-4zm-16 0l4 4V8l-4 4z" />
        </svg>
      ),
      title: "Commitment",
      description: "Not just better, but the best.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-12 h-12" fill="currentColor">
          <path d="M12 2L8 8l4 4-4 4 4 6 4-6-4-4 4-4z" />
        </svg>
      ),
      title: "Autonomy",
      description: "Contribute ideas and take ownership of your work.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-12 h-12" fill="currentColor">
          <path d="M12 2l2.4 7.4h7.8l-6.3 4.6 2.4 7.4-6.3-4.6-6.3 4.6 2.4-7.4-6.3-4.6h7.8z" />
        </svg>
      ),
      title: "User Focus",
      description: "We would be nothing without you, real talk.",
    },
  ]

  const positions = [
    {
      title: "Subject leader/contributor",
      description: "Contribute your resources and knowledge to the platform! 🤓",
    },
    {
      title: "Business Development",
      description: "Help us grow and expand our reach to more students and teachers! 🚀",
    },
    {
      title: "Lead Writer/Editor",
      description: "Gift others the advice you wish you had when you were starting IB.",
    },
    {
      title: "Software developer / AI engineer",
      description: "Build the future of education. React, NextJS, Supabase, NodeJS 🚀",
    },
    {
      title: "UI/UX or graphic Designer",
      description: "Design the future of education. Figma, Adobe XD, social posts 🎨",
    },
    {
      title: "Beta Tester",
      description: "Try out new and experimental features, and provide feedback! ✏️",
    },
    {
      title: "Content creator",
      description: "Get paid to promote RevisionDojo and help students succeed! 💎",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-16 space-y-16">
      {/* Values Section */}
      <section className="space-y-8">
        <h2 className="text-3xl sm:text-4xl font-serif text-center"><T k="auto.volunteerPage.ourValues" /></h2>
        <div className="grid md:grid-cols-3 gap-6">
          {values.map((value, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6 space-y-4">
                <div className="mx-auto w-16">{value.icon}</div>
                <h3 className="text-xl font-semibold">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Careers Section */}
      <section className="space-y-8">
        <h2 className="text-3xl sm:text-4xl font-serif text-center"><T k="auto.volunteerPage.readyToShapeTheFuture" /></h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {positions.map((position, index) => (
            <Link
              key={index}
              href="/apply"
              className="block group"
            >
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{position.title}</h3>
                    <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                  <p className="text-gray-600">{position.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
          
          <a href="mailto:aspirants.contact@gmail.com" className="block group">
            <Card className="h-full transition-shadow hover:shadow-lg">
              <CardContent className="p-6 space-y-2">
                <h3 className="font-semibold"><T k="auto.volunteerPage.gotAnotherIdea" /></h3>
                <p className="text-gray-600 underline"><T k="auto.volunteerPage.contactUs" /></p>
              </CardContent>
            </Card>
          </a>
        </div>
      </section>
    </div>
  )
}
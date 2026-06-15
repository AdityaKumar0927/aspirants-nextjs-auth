import { ArrowRight } from 'lucide-react'
import T from "@/components/i18n/T"

export default function AspirantsMissionPage() {
  return (
    <div className="min-h-screen bg-white text-black p-6 sm:p-8 flex flex-col items-center">
      <header className="text-center mb-10 sm:mb-16">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-normal mb-6 sm:mb-8"><T k="auto.missionPage.ourMission" /></h1>
        <p className="text-lg sm:text-xl md:text-2xl font-normal max-w-3xl mx-auto">
          <T k="auto.missionPage.toDemocratizeEducationByProviding" />
        </p>
      </header>

      <div className="max-w-4xl w-full space-y-12">
        <section>
          <h2 className="text-3xl mb-4 font-light"><T k="auto.missionPage.theChallenge" /></h2>
          <p className="text-lg leading-relaxed">
            <T k="auto.missionPage.everyYearTensOfMillions" />
          </p>
        </section>

        <section>
          <h2 className="text-3xl mb-4 font-light"><T k="auto.missionPage.theOldWay" /></h2>
          <p className="text-lg leading-relaxed">
            <T k="auto.missionPage.theOldPeopleThinkThat" />
          </p>
        </section>

        <section>
          <h2 className="text-3xl mb-4 font-light"><T k="auto.missionPage.ourApproach" /></h2>
          <p className="text-lg leading-relaxed">
            <T k="auto.missionPage.atAspirantsWeThinkDifferently" />
          </p>
        </section>

        <section>
          <h2 className="text-3xl mb-4 font-light"><T k="auto.missionPage.ourSolution" /></h2>
          <p className="text-lg leading-relaxed">
            <T k="auto.missionPage.aspirantsIsMoreThanA" />
          </p>
        </section>

        <section>
          <h2 className="text-3xl mb-4 font-light"><T k="auto.missionPage.ourCommitment" /></h2>
          <p className="text-lg leading-relaxed">
            <T k="auto.missionPage.weReNotHereTo" />
          </p>
        </section>
      </div>
    </div>
  )
}


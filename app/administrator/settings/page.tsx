import { Divider } from '@/components/admin/divider'
import { Heading, Subheading } from '@/components/admin/heading'
import { Text } from '@/components/admin/text'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/site-config'
import { SiteNameField } from './site-name-field'
import { AdminControls } from './AdminControls'

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata('Controls')
}

export default function Settings() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="space-y-1">
        <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">Operations</p>
        <Heading>Controls</Heading>
        <p className="text-sm text-pencil">
          Kill switches, feature flags, abuse defenses, announcements and security toggles. Changes take effect within
          seconds — no redeploy. Every save is audit-logged.
        </p>
      </div>
      <Divider className="my-10 mt-6" />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading>Site name</Subheading>
          <Text>
            Shown across the site — navbar, footer, page titles, the OG image and emails. Saving applies it everywhere
            within seconds (no redeploy needed).
          </Text>
        </div>
        <SiteNameField />
      </section>

      <Divider className="my-10" soft />

      <AdminControls />
    </div>
  )
}

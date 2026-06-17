import { Separator } from "@/components/ui/separator"
import ProfileFormSession from "./profile-form-session"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import T from "@/components/i18n/T"

export default async function SettingsProfilePage() {
  const session = await auth()

  if (!session) {
    redirect('/')
  }

  const userId = session.user.id

  try {
    const [userSettings, agreements] = await Promise.all([
      prisma.userSettings.findUnique({
        where: { userId: userId },
      }),
      prisma.userPolicyAgreement.findMany({
        where: { userId },
        select: { policyName: true, accepted: true },
      }),
    ])

    // Real acceptance state from UserPolicyAgreement (written during onboarding
    // and editable from this form); a missing row reads as not-accepted.
    const isAccepted = (policyName: string) =>
      agreements.some((a) => a.policyName === policyName && a.accepted)
    const policyState = {
      termsAccepted: isAccepted("terms"),
      privacyPolicyAccepted: isAccepted("privacy"),
      cookiePolicyAccepted: isAccepted("cookie"),
    }

    if (!userSettings) {
      // Create default settings if they don't exist
      const defaultSettings = {
        userId: userId,
        username: session.user.name || '',
        email: session.user.email || '',
        bio: '',
        urls: [],
        name: session.user.name || '',
        language: 'English',
      }

      const createdSettings = await prisma.userSettings.create({
        data: defaultSettings,
      })

      const initialData = {
        id: createdSettings.id,
        username: createdSettings.username,
        email: createdSettings.email,
        bio: createdSettings.bio,
        urls: createdSettings.urls as { value: string }[],
        name: createdSettings.name,
        language: createdSettings.language,
        ...policyState,
      }

      const userRole = session.user?.role || 'member'

      return (
        <div className="space-y-6">
          <div>
            <h3 className="type-display text-lg"><T k="auto.formsPage.profile" /></h3>
            <p className="text-sm text-pencil">
              <T k="auto.formsPage.manageYourProfileInformationAnd" />
            </p>
          </div>
          <Separator />
          <ProfileFormSession
            initialData={initialData}
            userRole={userRole}
            userId={userId}
          />
        </div>
      )
    }

    const initialData = {
      id: userSettings.id,
      username: userSettings.username,
      email: userSettings.email,
      bio: userSettings.bio,
      urls: userSettings.urls as { value: string }[],
      name: userSettings.name,
      language: userSettings.language,
      ...policyState,
    }

    const userRole = session.user?.role || 'member'

    return (
      <div className="space-y-6">
        <div>
          <h3 className="type-display text-lg"><T k="auto.formsPage.profile" /></h3>
          <p className="text-sm text-pencil">
            <T k="auto.formsPage.manageYourProfileInformationAnd" />
          </p>
        </div>
        <Separator />
        <ProfileFormSession
          initialData={initialData}
          userRole={userRole}
          userId={userId}
        />
      </div>
    )
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return (
      <div className="space-y-6">
        <div>
          <h3 className="type-display text-lg text-redpen"><T k="auto.formsPage.couldnTLoadYourProfile" /></h3>
          <p className="text-sm text-pencil">
            <T k="auto.formsPage.somethingWentWrongWhileFetching" />
          </p>
        </div>
      </div>
    )
  }
}
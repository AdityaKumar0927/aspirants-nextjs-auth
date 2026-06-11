import { Separator } from "@/components/ui/separator"
import ProfileForm from "./profile-form"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"

export default async function SettingsProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/')
  }

  const userId = session.user.id

  try {
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: userId },
    })

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
        termsAccepted: false,
        privacyPolicyAccepted: false,
        cookiePolicyAccepted: false,
      }

      const userRole = session.user?.role || 'member'

      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Profile</h3>
            <p className="text-sm text-muted-foreground">
              Manage your profile information and settings
            </p>
          </div>
          <Separator />
          <ProfileForm 
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
      termsAccepted: false, // You may want to fetch this from the database
      privacyPolicyAccepted: false, // You may want to fetch this from the database
      cookiePolicyAccepted: false, // You may want to fetch this from the database
    }

    const userRole = session.user?.role || 'member'

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Profile</h3>
          <p className="text-sm text-muted-foreground">
            Manage your profile information and settings
          </p>
        </div>
        <Separator />
        <ProfileForm 
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
          <h3 className="text-lg font-medium">Error</h3>
          <p className="text-sm text-muted-foreground">
            An error occurred while fetching your profile information. Please try again later.
          </p>
        </div>
      </div>
    )
  }
}
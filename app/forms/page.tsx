import { Separator } from "@/components/ui/separator"
import ProfileForm from "./profile-form"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"

export default async function SettingsProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/aspirants.tech')
  }

  const userId = session.user.id

  const userSettings = await prisma.userSettings.findUnique({
    where: { userId: userId },
  })

  if (!userSettings) {
    // Handle the case where user settings don't exist
    // You might want to create default settings here
    return <div>Error: User settings not found</div>
  }

  const initialData = {
    id: userSettings.id,
    username: userSettings.username,
    email: userSettings.email,
    bio: userSettings.bio,
    urls: userSettings.urls as { value: string }[],
    name: userSettings.name,
    language: userSettings.language,
  }

  const userRole = session.user?.role?.name || 'member'

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
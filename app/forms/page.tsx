import { Separator } from "@/components/ui/separator"
import { ProfileForm } from "@/app/forms/profile-form"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../api/auth/[...nextauth]/options"
import { redirect } from "next/navigation"

async function getProfileData(userId: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/${userId}`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Failed to fetch profile data')
  }
  return response.json()
}

export default async function SettingsProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const userRole = session.user?.role?.name || 'member'
  const initialData = await getProfileData(session.user.id)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          This is how others will see you on the site.
        </p>
      </div>
      <Separator />
      <ProfileForm initialData={initialData} userRole={userRole} />
    </div>
  )
}
// Import the necessary components
import { Separator } from "@/components/ui/separator"
import { ProfileForm } from "@/app/forms/profile-form"

// Define and export the SettingsProfilePage component
export default function SettingsProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          This is how others will see you on the site.
        </p>
      </div>
      <Separator />
      <ProfileForm />
    </div>
  )
}

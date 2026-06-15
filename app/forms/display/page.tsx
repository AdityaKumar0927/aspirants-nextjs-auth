import { Separator } from "@/components/ui/separator"
import { DisplayForm } from "./display-form"

export default function SettingsDisplayPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="type-display text-lg">Display</h3>
        <p className="text-sm text-pencil">
          Turn items on or off to control what&apos;s displayed in the app.
        </p>
      </div>
      <Separator />
      <DisplayForm />
    </div>
  )
}
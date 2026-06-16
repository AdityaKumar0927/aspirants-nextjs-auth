import { Separator } from "@/components/ui/separator"
import FeedbackHistory from "./feedback-history"

export default function SettingsFeedbackPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-medium">Feedback</h3>
        <p className="text-sm text-muted-foreground">
          The feedback you have sent us, and any replies from the team. When the team asks
          for clarification you can reply right here (or from the notification bell).
        </p>
      </div>
      <Separator />
      <FeedbackHistory />
    </div>
  )
}

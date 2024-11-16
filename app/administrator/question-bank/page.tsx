import { QuestionProvider } from './QuestionContext'
import { QuestionBankDashboardContent } from './QuestionBankDashboardContent'

export default function QuestionBankPage() {
  return (
    <QuestionProvider>
      <QuestionBankDashboardContent />
    </QuestionProvider>
  )
}
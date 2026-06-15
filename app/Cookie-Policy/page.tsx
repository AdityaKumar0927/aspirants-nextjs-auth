import CookiePolicyContent from "@/components/legal/CookiePolicyContent"

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">Cookie Policy</h1>
        <CookiePolicyContent />
      </div>
    </div>
  )
}

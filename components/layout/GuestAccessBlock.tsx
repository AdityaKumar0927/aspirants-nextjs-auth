import { useState } from "react"
import { useRouter } from "next/router"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Icons } from "./icons"
import { Lock, LogIn } from "lucide-react"
import { LoadingSpinner } from "../shared/icons"

interface GuestAccessBlockProps {
  featureName?: string
}

export default function GuestAccessBlock({ featureName = "this feature" }: GuestAccessBlockProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignIn = async () => {
    setIsLoading(true)
    // Redirect to sign-in page
    await router.push("/signin")
  }

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4 bg-gradient-to-br from-background to-secondary/20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Access Required</CardTitle>
            <CardDescription className="text-center">
              Sign in to access {featureName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-secondary/10 rounded-lg text-center">
              <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                This content is exclusively available to registered users.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 hover:text-blue-900"
              onClick={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
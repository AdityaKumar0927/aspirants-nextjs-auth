'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AnimatePresence, motion } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function FeedbackPopover() {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const emojis = ['😃', '🙂', '🙁', '😢']

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Error",
        description: "Please enter your feedback before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: feedback,
          emoji: selectedEmoji !== null ? emojis[selectedEmoji] : null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      setFeedback('')
      setSelectedEmoji(null)
      setIsOpen(false)
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback! ❤️",
        className: "bg-green-100 border-green-300 text-green-700",
      })
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full max-w-[120px] bg-white text-black border border-gray-200 hover:bg-gray-100"
          >
            Feedback
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-none shadow-none">
                  <CardContent className="p-4 space-y-4">
                    <div className="relative">
                      <Textarea
                        placeholder="Your feedback..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="min-h-[100px] resize-none pr-8"
                      />
                      <div className="absolute bottom-2 right-2 text-muted-foreground">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Markdown supported.</p>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center p-4 pt-0">
                    <div className="flex space-x-2">
                      {emojis.map((emoji, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className={`p-0 w-8 h-8 rounded-full ${selectedEmoji === index ? 'bg-muted' : ''}`}
                          onClick={() => setSelectedEmoji(index)}
                        >
                          <span className="text-xl">{emoji}</span>
                        </Button>
                      ))}
                    </div>
                    <Button
                      onClick={handleSubmit}
                      className="bg-black text-white hover:bg-black/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending...' : 'Send'}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </PopoverContent>
      </Popover>
      <Toaster />
    </>
  )
}
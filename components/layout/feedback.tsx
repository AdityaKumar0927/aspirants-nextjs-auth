'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AnimatePresence, motion } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"

export default function FeedbackPopover() {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null)
  const [anonymous, setAnonymous] = useState(false)
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
          anonymous,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      setFeedback('')
      setSelectedEmoji(null)
      setAnonymous(false)
      setIsOpen(false)
      toast({
        title: "Feedback submitted",
        description: anonymous
          ? "Thanks! Your feedback was sent anonymously."
          : "Thank you for your feedback!",
        variant: "success",
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
          {/* `theme-desk` here makes the button's shadcn tokens (border/bg/text)
              resolve to the desk palette on EVERY page, so it looks identical on
              the landing and inner pages. */}
          <Button variant="outline" className="theme-desk w-full max-w-30">
            Feedback
          </Button>
        </PopoverTrigger>
        {/* `theme-desk` scopes the whole popup (it portals to <body>, which is
            only themed on inner pages) so its content is desk-styled everywhere. */}
        <PopoverContent className="theme-desk w-[calc(100vw-2rem)] max-w-80 border-rule bg-paper p-0 text-ink">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
              >
                <Card className="border-0 bg-transparent shadow-none">
                  <CardContent className="space-y-3 p-4">
                    <div>
                      <p className="text-sm font-medium text-ink">Share feedback</p>
                      <p className="text-xs text-pencil">
                        Tell us what&rsquo;s working or what could be better.
                      </p>
                    </div>
                    <Textarea
                      placeholder="Your feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="min-h-25 resize-none bg-paper text-ink placeholder:text-pencil"
                    />
                    <label className="flex cursor-pointer items-start gap-2 text-xs text-pencil">
                      <input
                        type="checkbox"
                        checked={anonymous}
                        onChange={(e) => setAnonymous(e.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-ballpoint"
                      />
                      <span>
                        Submit anonymously
                        <span className="block text-pencil/70">
                          We won&rsquo;t show your name to the team. They can still reply for
                          clarification — you&rsquo;ll see it in your notifications.
                        </span>
                      </span>
                    </label>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between p-4 pt-0">
                    <div className="flex gap-1">
                      {emojis.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          aria-label={`Reaction ${index + 1}`}
                          aria-pressed={selectedEmoji === index}
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-xl transition-colors ${
                            selectedEmoji === index
                              ? "bg-ballpoint/10 ring-1 ring-ballpoint"
                              : "hover:bg-secondary"
                          }`}
                          onClick={() => setSelectedEmoji(index)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-ballpoint text-paper hover:bg-ballpoint/90"
                    >
                      {isSubmitting ? "Sending" : "Send"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </PopoverContent>
      </Popover>
    </>
  )
}
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface FeedbackPopoverProps {
  questionId: string
}

export default function FeedbackPopover({ questionId }: FeedbackPopoverProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<string[]>([])
  const [area, setArea] = useState<string>("")
  const [priority, setPriority] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const feedbackOptions = [
    { id: "question", label: "Incorrect Question" },
    { id: "answer", label: "Incorrect Answer" },
    { id: "markscheme", label: "Incorrect Markscheme" },
    { id: "rendering", label: "Image/Equation not Rendering" },
    { id: "diagram", label: "Incorrect Diagram" },
    { id: "other", label: "Other" },
  ]

  const toggleFeedback = (id: string) => {
    setSelectedFeedback((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Feedback for Question ${questionId}: ${selectedFeedback.join(", ")}`,
          description: `${description}\n\nSelected feedback: ${selectedFeedback.join(", ")}`,
          area,
          priority,
          questionId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit feedback")
      }

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      })

      // Reset form and close popover
      setSelectedFeedback([])
      setArea("")
      setPriority("")
      setDescription("")
      setIsOpen(false)
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedFeedback([])
    setArea("")
    setPriority("")
    setDescription("")
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          Report
        </Button>
      </PopoverTrigger>

      <PopoverContent className="theme-desk w-[calc(100vw-2rem)] max-w-88 border-rule bg-paper p-0 text-ink sm:w-md sm:max-w-md">
        <Card className="w-full border-0 bg-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Report a problem</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Feedback Options */}
            <div className="space-y-2">
              <Label className="text-sm text-pencil">
                What&apos;s wrong with this question? Select all that apply.
              </Label>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {feedbackOptions.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => toggleFeedback(option.id)}
                    aria-pressed={selectedFeedback.includes(option.id)}
                    className={`flex min-h-11 items-center gap-2 rounded-md border px-3 text-left text-sm transition-colors ${
                      selectedFeedback.includes(option.id)
                        ? "border-ballpoint bg-ballpoint/5 text-ballpoint"
                        : "border-rule text-ink hover:bg-secondary"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                        selectedFeedback.includes(option.id)
                          ? "border-ballpoint bg-ballpoint text-paper"
                          : "border-pencil"
                      }`}
                    >
                      {selectedFeedback.includes(option.id) && (
                        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                          <path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Area */}
            <div className="space-y-2">
              <Label className="text-sm text-pencil">Area</Label>
              <RadioGroup
                value={area}
                onValueChange={setArea}
                className="flex flex-wrap gap-3"
              >
                {["CONTENT", "UI", "BUG", "FEATURE", "OTHER"].map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={value} className="h-4 w-4" />
                    <Label htmlFor={value} className="capitalize text-ink">
                      {value.toLowerCase()}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-sm text-pencil">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-paper">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-sm text-pencil">
                Anything else? (optional)
              </Label>
              <Textarea
                id="feedback"
                placeholder="Describe the problem"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] bg-paper placeholder:text-pencil"
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" className="text-pencil" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedFeedback.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                "Submit report"
              )}
            </Button>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  )
}

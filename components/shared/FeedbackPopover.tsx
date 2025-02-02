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
        <Button variant="outline">Feedback</Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0">
        <Card className="w-full max-w-md bg-white text-black border-zinc-200">
          <CardHeader>
            <CardTitle>Give feedback</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Feedback Options */}
            <div className="space-y-1">
              <Label className="text-zinc-900">
                Provide additional feedback on this message. Select all that apply.
              </Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {feedbackOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-center space-x-2 rounded-lg border p-3 ${
                      selectedFeedback.includes(option.id)
                        ? "border-blue-600 bg-blue-50"
                        : "border-zinc-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={option.id}
                      checked={selectedFeedback.includes(option.id)}
                      onChange={() => toggleFeedback(option.id)}
                      className="h-4 w-4 rounded-sm border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-600"
                    />
                    <Label
                      htmlFor={option.id}
                      className={`font-normal ${
                        selectedFeedback.includes(option.id)
                          ? "text-blue-600"
                          : "text-zinc-900"
                      }`}
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback Area */}
            <div className="space-y-2">
              <Label className="text-zinc-900">Feedback Area</Label>
              <RadioGroup
                value={area}
                onValueChange={setArea}
                className="flex flex-wrap gap-2"
              >
                {["CONTENT", "UI", "BUG", "FEATURE", "OTHER"].map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={value}
                      id={value}
                      className="h-5 w-5 border-zinc-300 text-blue-600"
                    />
                    <Label htmlFor={value} className="capitalize text-zinc-900">
                      {value.toLowerCase()}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-zinc-900">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-zinc-50 border-zinc-300 text-zinc-900">
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
              <Label htmlFor="feedback" className="text-zinc-900">
                How can we improve? (optional)
              </Label>
              <Textarea
                id="feedback"
                placeholder="Your feedback..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] bg-zinc-50 border-zinc-300 placeholder:text-zinc-500 text-zinc-900"
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              className="border-zinc-300 text-zinc-900 hover:bg-zinc-200"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-white text-black hover:bg-zinc-200"
              onClick={handleSubmit}
              disabled={selectedFeedback.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  )
}

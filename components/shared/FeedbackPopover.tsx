'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from 'lucide-react'

interface FeedbackPopoverProps {
  questionId: string;
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
    { id: "incorrect", label: "Incorrect information" },
    { id: "ignored", label: "Instructions ignored" },
    { id: "lazy", label: "Being lazy" },
    { id: "style", label: "Don't like style" },
    { id: "bad-recommendation", label: "Bad recommendation" },
    { id: "other", label: "Other" },
  ]

  const toggleFeedback = (id: string) => {
    setSelectedFeedback(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id]
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Feedback for Question ${questionId}: ${selectedFeedback.join(', ')}`,
          description: `${description}\n\nSelected feedback: ${selectedFeedback.join(', ')}`,
          area,
          priority,
          questionId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
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
        <div className="dark">
          <Card className="w-full max-w-md bg-zinc-950 text-white border-zinc-800">
            <CardHeader>
              <CardTitle>Give feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-zinc-100">
                  Provide additional feedback on this message. Select all that apply.
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {feedbackOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`flex items-center space-x-2 rounded-lg border p-3 ${
                        selectedFeedback.includes(option.id)
                          ? "border-blue-600 bg-blue-950/50"
                          : "border-zinc-800"
                      }`}
                    >
                      <Checkbox
                        id={option.id}
                        checked={selectedFeedback.includes(option.id)}
                        onCheckedChange={() => toggleFeedback(option.id)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <Label
                        htmlFor={option.id}
                        className={`font-normal ${
                          selectedFeedback.includes(option.id)
                            ? "text-blue-400"
                            : "text-zinc-100"
                        }`}
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-100">Feedback Area</Label>
                <RadioGroup value={area} onValueChange={setArea} className="flex flex-wrap gap-2">
                  {["CONTENT", "UI", "BUG", "FEATURE", "OTHER"].map((value) => (
                    <div key={value} className="flex items-center space-x-2">
                      <RadioGroupItem value={value} id={value} className="border-zinc-700 text-blue-600" />
                      <Label htmlFor={value} className="capitalize text-zinc-100">{value.toLowerCase()}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-100">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
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
              <div className="space-y-2">
                <Label htmlFor="feedback" className="text-zinc-100">
                  How can we improve? (optional)
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="Your feedback..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px] bg-zinc-900 border-zinc-800 placeholder:text-zinc-500"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                className="border-zinc-800 text-zinc-100 hover:bg-zinc-800"
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
                  'Submit'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </PopoverContent>
    </Popover>
  )
}
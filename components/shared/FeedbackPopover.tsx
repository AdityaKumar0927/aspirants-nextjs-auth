'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Sun, Moon } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface FeedbackPopoverProps {
  questionId: string;
}

export default function FeedbackPopover({ questionId }: FeedbackPopoverProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<string[]>([])
  const [area, setArea] = useState<string>("")
  const [priority, setPriority] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkTheme(true)
    }
  }, [])

  const handleFeedbackChange = (value: string) => {
    setSelectedFeedback(prev => 
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    )
  }

  const handleSubmit = async () => {
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

      // Reset form
      setSelectedFeedback([])
      setArea("")
      setPriority("")
      setDescription("")
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Feedback</Button>
      </PopoverTrigger>
      <PopoverContent className={`w-[calc(100vw-2rem)] sm:w-[480px] p-0 ${isDarkTheme ? 'bg-zinc-900 text-white' : 'bg-white text-black'}`}>
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className={`text-lg sm:text-xl font-semibold ${isDarkTheme ? 'text-white' : 'text-black'}`}>Question Feedback</h2>
              <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-zinc-400' : 'text-gray-500'}`}>
                Help us improve our question bank. Select all that apply.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Sun className="h-3 w-3 sm:h-4 sm:w-4" />
              <Switch
                checked={isDarkTheme}
                onCheckedChange={toggleTheme}
                className={`${isDarkTheme ? 'bg-zinc-700' : 'bg-gray-200'}`}
              />
              <Moon className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </div>

          <div className="grid gap-2 sm:gap-3">
            {[
              { id: "incorrect", label: "Incorrect answer" },
              { id: "unclear", label: "Unclear question" },
              { id: "typo", label: "Typo or grammatical error" },
              { id: "outdated", label: "Outdated information" },
              { id: "duplicate", label: "Duplicate question" },
              { id: "other", label: "Other" }
            ].map(({ id, label }) => (
              <div key={id} className={`flex items-center space-x-2 rounded-md border p-2 ${
                isDarkTheme ? 'border-zinc-800' : 'border-gray-200'
              }`}>
                <Checkbox 
                  id={id} 
                  checked={selectedFeedback.includes(id)}
                  onCheckedChange={() => handleFeedbackChange(id)}
                  className={`${
                    isDarkTheme 
                      ? 'border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600' 
                      : 'border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                  }`}
                />
                <Label htmlFor={id} className="text-xs sm:text-sm">{label}</Label>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label className={`text-xs sm:text-sm ${isDarkTheme ? 'text-zinc-400' : 'text-gray-600'}`}>Feedback Area</Label>
            <RadioGroup value={area} onValueChange={setArea} className="flex flex-wrap gap-2 sm:gap-4">
              {["CONTENT", "UI", "BUG", "FEATURE", "OTHER"].map((value) => (
                <div key={value} className="flex items-center space-x-2">
                  <RadioGroupItem value={value} id={value} className={`${isDarkTheme ? 'border-zinc-700' : 'border-gray-300'} text-blue-600`} />
                  <Label htmlFor={value} className="capitalize text-xs sm:text-sm">{value.toLowerCase()}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className={`text-xs sm:text-sm ${isDarkTheme ? 'text-zinc-400' : 'text-gray-600'}`}>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className={`${isDarkTheme ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-300'}`}>
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
            <Label htmlFor="feedback" className={`text-xs sm:text-sm ${isDarkTheme ? 'text-zinc-400' : 'text-gray-600'}`}>
              Additional comments (optional)
            </Label>
            <Textarea
              id="feedback"
              placeholder="Provide any additional feedback about this question..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`h-20 sm:h-24 text-xs sm:text-sm resize-none ${
                isDarkTheme 
                  ? 'bg-zinc-800 border-zinc-700 placeholder:text-zinc-500' 
                  : 'bg-white border-gray-300 placeholder:text-gray-400'
              }`}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              className={`text-xs sm:text-sm py-1 px-2 sm:py-2 sm:px-4 ${
                isDarkTheme 
                  ? 'text-white bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-white' 
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 text-white hover:bg-blue-700 text-xs sm:text-sm py-1 px-2 sm:py-2 sm:px-4" 
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
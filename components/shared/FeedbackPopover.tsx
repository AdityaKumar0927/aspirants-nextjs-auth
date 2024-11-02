"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Sun, Moon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface FeedbackPopoverProps {
  questionId: string;
}

export default function FeedbackPopover({ questionId }: FeedbackPopoverProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<string[]>([])
  const [questionDifficulty, setQuestionDifficulty] = useState<string>("")
  const [isDarkTheme, setIsDarkTheme] = useState(false)

  useEffect(() => {
    // Check for user's preferred color scheme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkTheme(true)
    }
  }, [])

  const handleFeedbackChange = (value: string) => {
    setSelectedFeedback(prev => 
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    )
  }

  const handleSubmit = () => {
    console.log("Submitted feedback:", { questionId, selectedFeedback, questionDifficulty })
    // Here you would typically send this data to your backend
  }

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Feedback</Button>
      </PopoverTrigger>
      <PopoverContent className="w-[480px]">
        <Card className={`w-full ${isDarkTheme ? 'bg-zinc-900 text-white border-zinc-800' : 'bg-white text-black border-gray-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className={`text-2xl ${isDarkTheme ? 'text-white' : 'text-black'}`}>Question Feedback</CardTitle>
              <CardDescription className={isDarkTheme ? 'text-zinc-400' : 'text-gray-500'}>
                Help us improve our question bank. Select all that apply.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Sun className="h-4 w-4" />
              <Switch
                checked={isDarkTheme}
                onCheckedChange={toggleTheme}
                className={`${isDarkTheme ? 'bg-zinc-700' : 'bg-gray-200'}`}
              />
              <Moon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { id: "incorrect", label: "Incorrect answer" },
                { id: "unclear", label: "Unclear question" },
                { id: "typo", label: "Typo or grammatical error" },
                { id: "outdated", label: "Outdated information" },
                { id: "duplicate", label: "Duplicate question" },
                { id: "other", label: "Other" }
              ].map(({ id, label }) => (
                <div key={id} className={`flex items-center space-x-2 rounded-lg border p-4 ${
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
                  <Label htmlFor={id} className="text-base">{label}</Label>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label className={`text-sm ${isDarkTheme ? 'text-zinc-400' : 'text-gray-600'}`}>Question difficulty</Label>
              <RadioGroup 
                value={questionDifficulty} 
                onValueChange={setQuestionDifficulty}
                className="flex space-x-4"
              >
                {["easy", "medium", "hard"].map((difficulty) => (
                  <div key={difficulty} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={difficulty} 
                      id={difficulty} 
                      className={`${isDarkTheme ? 'border-zinc-700' : 'border-gray-300'} text-blue-600`} 
                    />
                    <Label htmlFor={difficulty} className="capitalize">{difficulty}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback" className={`text-sm ${isDarkTheme ? 'text-zinc-400' : 'text-gray-600'}`}>
                Additional comments (optional)
              </Label>
              <Textarea
                id="feedback"
                placeholder="Provide any additional feedback about this question..."
                className={`h-32 resize-none ${
                  isDarkTheme 
                    ? 'bg-zinc-800 border-zinc-700 placeholder:text-zinc-500' 
                    : 'bg-white border-gray-300 placeholder:text-gray-400'
                }`}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                className={`${
                  isDarkTheme 
                    ? 'text-white bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-white' 
                    : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Cancel
              </Button>
              <Button 
                className="bg-blue-600 text-white hover:bg-blue-700" 
                onClick={handleSubmit}
              >
                Submit Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DialogFooter } from "@/components/ui/dialog"
import { Trash2 } from 'lucide-react'
import type { Question } from './types'

interface QuestionFormProps {
  initialData?: Partial<Question>
  onSubmit: (question: Partial<Question>) => void
}

export function QuestionForm({ initialData, onSubmit }: QuestionFormProps) {
  const [formData, setFormData] = useState<Partial<Question>>(() => ({
    text: '',
    subject: '',
    topic: '',
    difficulty: '',
    options: [],
    correctOption: '',
    markscheme: '',
    notes: [],
    ...initialData
  }))

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOptionChange = (index: number, value: string) => {
    setFormData(prev => {
      const newOptions = [...(prev.options || [])]
      newOptions[index] = value
      return { ...prev, options: newOptions }
    })
  }

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), '']
    }))
  }

  const handleRemoveOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }))
  }

  const handleNoteChange = (index: number, value: string) => {
    setFormData(prev => {
      const newNotes = [...(prev.notes || [])]
      newNotes[index] = { ...newNotes[index], content: value }
      return { ...prev, notes: newNotes }
    })
  }

  const handleAddNote = () => {
    setFormData(prev => ({
      ...prev,
      notes: [...(prev.notes || []), { id: Date.now().toString(), content: '' }]
    }))
  }

  const handleRemoveNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes?.filter((_, i) => i !== index) || []
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="text">Question Text</Label>
        <Textarea
          id="text"
          name="text"
          value={formData.text}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="topic">Topic</Label>
          <Input
            id="topic"
            name="topic"
            value={formData.topic}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="difficulty">Difficulty</Label>
        <Select
          name="difficulty"
          value={formData.difficulty}
          onValueChange={(value) => handleSelectChange('difficulty', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Options</Label>
        {formData.options?.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Input
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
            />
            <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveOption(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={handleAddOption}>
          Add Option
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="correctOption">Correct Option</Label>
        <Select
          name="correctOption"
          value={formData.correctOption || ''}
          onValueChange={(value) => handleSelectChange('correctOption', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select correct option" />
          </SelectTrigger>
          <SelectContent>
            {formData.options?.map((option, index) => (
              <SelectItem key={index} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="markscheme">Mark Scheme</Label>
        <Textarea
          id="markscheme"
          name="markscheme"
          value={formData.markscheme || ''}
          onChange={handleInputChange}
        />
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        {formData.notes?.map((note, index) => (
          <div key={note.id} className="flex items-center space-x-2">
            <Textarea
              value={note.content}
              onChange={(e) => handleNoteChange(index, e.target.value)}
              placeholder={`Note ${index + 1}`}
            />
            <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveNote(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={handleAddNote}>
          Add Note
        </Button>
      </div>
      <DialogFooter>
        <Button type="submit">Save Question</Button>
      </DialogFooter>
    </form>
  )
}
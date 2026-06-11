'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogFooter } from "@/components/ui/dialog"
import { Trash2 } from 'lucide-react'
import { QUESTION_TYPES, type Question } from './types'

interface QuestionFormProps {
  initialData?: Partial<Question>
  onSubmit: (question: Partial<Question>) => void
}

const letterFor = (index: number) => String.fromCharCode(65 + index)

/** Resolves a stored correct value (letter OR full option text) to a letter. */
function toLetter(value: string | null | undefined, options: string[]): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (/^[A-J]$/i.test(trimmed)) return trimmed.toUpperCase()
  const idx = options.findIndex((o) => o.trim() === trimmed)
  return idx >= 0 ? letterFor(idx) : ''
}

export function QuestionForm({ initialData, onSubmit }: QuestionFormProps) {
  const opts = initialData?.options ?? []
  const [formData, setFormData] = useState<Partial<Question>>(() => ({
    text: '',
    subject: '',
    topic: '',
    difficulty: '',
    type: 'Multiple Choice',
    options: [],
    answerText: '',
    answerMin: null,
    answerMax: null,
    markscheme: '',
    status: 'DRAFT',
    ...initialData,
    // Normalize stored correct answers to letters for editing.
    correctOption: toLetter(initialData?.correctOption ?? null, opts) || null,
    correctOptions: (initialData?.correctOptions ?? [])
      .map((c) => toLetter(c, opts))
      .filter(Boolean),
  }))

  const type = formData.type || 'Multiple Choice'
  const isChoice = type === 'Multiple Choice' || type === 'Multiple Correct'

  const set = <K extends keyof Question>(name: K, value: Question[K] | null) =>
    setFormData((prev) => ({ ...prev, [name]: value }))

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleOptionChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newOptions = [...(prev.options || [])]
      newOptions[index] = value
      return { ...prev, options: newOptions }
    })
  }

  const handleAddOption = () =>
    setFormData((prev) => ({ ...prev, options: [...(prev.options || []), ''] }))

  const handleRemoveOption = (index: number) => {
    const removed = letterFor(index)
    const remap = (letter: string): string | null => {
      if (letter === removed) return null
      const i = letter.charCodeAt(0) - 65
      return i > index ? letterFor(i - 1) : letter
    }
    setFormData((prev) => ({
      ...prev,
      options: (prev.options || []).filter((_, i) => i !== index),
      correctOption: remap(prev.correctOption || '') ?? '',
      correctOptions: (prev.correctOptions || [])
        .map(remap)
        .filter((l): l is string => l !== null),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Send only the fields relevant to the chosen type (the server validates).
    const payload: Partial<Question> = {
      ...formData,
      correctOption: type === 'Multiple Choice' ? formData.correctOption || null : null,
      correctOptions: type === 'Multiple Correct' ? formData.correctOptions || [] : [],
      options: isChoice ? formData.options || [] : [],
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Question Type</Label>
          <Select value={type} onValueChange={(v) => set('type', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status || 'DRAFT'}
            onValueChange={(v) => set('status', v as Question['status'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="text">Question Text (Markdown + LaTeX)</Label>
        <Textarea id="text" name="text" value={formData.text} onChange={handleInputChange} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" name="subject" value={formData.subject ?? ''} onChange={handleInputChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="topic">Topic</Label>
          <Input id="topic" name="topic" value={formData.topic ?? ''} onChange={handleInputChange} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="difficulty">Difficulty</Label>
        <Select
          value={formData.difficulty || ''}
          onValueChange={(value) => set('difficulty', value)}
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

      {/* Options + correct answer(s) for choice questions */}
      {isChoice && (
        <div className="space-y-2">
          <Label>
            Options ({type === 'Multiple Choice' ? 'select the correct one' : 'tick all correct'})
          </Label>
          {(formData.options || []).map((option, index) => {
            const letter = letterFor(index)
            return (
              <div key={index} className="flex items-center space-x-2">
                {type === 'Multiple Choice' ? (
                  <input
                    type="radio"
                    name="correctOption"
                    checked={formData.correctOption === letter}
                    onChange={() => set('correctOption', letter)}
                  />
                ) : (
                  <Checkbox
                    checked={(formData.correctOptions || []).includes(letter)}
                    onCheckedChange={(v) =>
                      set(
                        'correctOptions',
                        v === true
                          ? [...(formData.correctOptions || []), letter]
                          : (formData.correctOptions || []).filter((l) => l !== letter),
                      )
                    }
                  />
                )}
                <span className="w-5 text-sm font-medium">{letter}.</span>
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveOption(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
          <Button type="button" variant="outline" onClick={handleAddOption}>
            Add Option
          </Button>
        </div>
      )}

      {/* Integer / Subjective answer */}
      {(type === 'Integer' || type === 'Subjective') && (
        <div className="space-y-2">
          <Label htmlFor="answerText">
            {type === 'Integer' ? 'Answer (whole number)' : 'Model answer (optional)'}
          </Label>
          {type === 'Integer' ? (
            <Input
              id="answerText"
              name="answerText"
              inputMode="numeric"
              value={formData.answerText ?? ''}
              onChange={handleInputChange}
            />
          ) : (
            <Textarea
              id="answerText"
              name="answerText"
              value={formData.answerText ?? ''}
              onChange={handleInputChange}
            />
          )}
        </div>
      )}

      {/* Numerical answer with tolerance range */}
      {type === 'Numerical' && (
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="answerText">Answer</Label>
            <Input
              id="answerText"
              name="answerText"
              value={formData.answerText ?? ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label>Accepted min</Label>
            <Input
              value={formData.answerMin ?? ''}
              onChange={(e) => set('answerMin', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Accepted max</Label>
            <Input
              value={formData.answerMax ?? ''}
              onChange={(e) => set('answerMax', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="markscheme">Solution / Mark Scheme</Label>
        <Textarea
          id="markscheme"
          name="markscheme"
          value={formData.markscheme || ''}
          onChange={handleInputChange}
        />
      </div>

      <DialogFooter>
        <Button type="submit">Save Question</Button>
      </DialogFooter>
    </form>
  )
}

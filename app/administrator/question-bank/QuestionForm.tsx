'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogFooter } from "@/components/ui/dialog"
import { Plus, Trash2 } from 'lucide-react'
import { QUESTION_TYPES, type Question } from './types'

interface QuestionFormProps {
  initialData?: Partial<Question>
  onSubmit: (question: Partial<Question>) => void | Promise<void>
  onCancel?: () => void
  submitting?: boolean
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

/** A titled group of fields, so the form reads as distinct sections. */
function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3 rounded-lg border border-rule bg-paper/60 p-4">
      <div>
        <h3 className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-pencil">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

export function QuestionForm({ initialData, onSubmit, onCancel, submitting }: QuestionFormProps) {
  const opts = initialData?.options ?? []
  const [formData, setFormData] = useState<Partial<Question>>(() => ({
    text: '',
    exam: '',
    subject: '',
    topic: '',
    chapter: '',
    subtopic: '',
    difficulty: '',
    type: 'Multiple Choice',
    year: undefined,
    marks: null,
    negMarks: null,
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

  const numberOrNull = (v: string) => (v === '' ? null : Number(v))

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
      {/* Type & status */}
      <Section title="Type & status">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Question type</Label>
            <Select value={type} onValueChange={(v) => set('type', v)}>
              <SelectTrigger id="type">
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
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft (needs review)</SelectItem>
                <SelectItem value="ACTIVE">Active (published)</SelectItem>
                <SelectItem value="ARCHIVED">Archived (hidden)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      {/* Question content */}
      <Section title="Question" hint="Markdown + LaTeX ($…$ inline, $$…$$ display).">
        <Textarea
          id="text"
          name="text"
          value={formData.text}
          onChange={handleInputChange}
          rows={4}
          placeholder="Enter the question stem…"
          required
        />
      </Section>

      {/* Classification */}
      <Section title="Classification" hint="Powers filtering and the Exam Blueprint — fill exam & year where known.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="exam">Exam</Label>
            <Input id="exam" name="exam" value={formData.exam ?? ''} onChange={handleInputChange} placeholder="e.g. jee-main" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              name="year"
              inputMode="numeric"
              value={formData.year ?? ''}
              onChange={(e) => set('year', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="e.g. 2024"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" value={formData.subject ?? ''} onChange={handleInputChange} placeholder="e.g. Physics" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chapter">Chapter</Label>
            <Input id="chapter" name="chapter" value={formData.chapter ?? ''} onChange={handleInputChange} placeholder="e.g. Kinematics" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input id="topic" name="topic" value={formData.topic ?? ''} onChange={handleInputChange} placeholder="e.g. Projectile motion" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtopic">Subtopic</Label>
            <Input id="subtopic" name="subtopic" value={formData.subtopic ?? ''} onChange={handleInputChange} placeholder="optional" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select
            value={formData.difficulty || ''}
            onValueChange={(value) => set('difficulty', value)}
          >
            <SelectTrigger id="difficulty">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>

      {/* Answer */}
      <Section
        title="Answer"
        hint={
          isChoice
            ? type === 'Multiple Choice'
              ? 'Add options and select the single correct one.'
              : 'Add options and tick every correct one.'
            : undefined
        }
      >
        {isChoice && (
          <div className="space-y-2">
            {(formData.options || []).map((option, index) => {
              const letter = letterFor(index)
              return (
                <div key={index} className="flex items-center gap-2">
                  {type === 'Multiple Choice' ? (
                    <input
                      type="radio"
                      name="correctOption"
                      aria-label={`Mark option ${letter} correct`}
                      className="accent-ballpoint"
                      checked={formData.correctOption === letter}
                      onChange={() => set('correctOption', letter)}
                    />
                  ) : (
                    <Checkbox
                      aria-label={`Mark option ${letter} correct`}
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
                  <span className="w-5 type-data text-sm font-medium text-pencil">{letter}.</span>
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${letter}`}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOption(index)} title="Remove option">
                    <Trash2 className="h-4 w-4 text-redpen" />
                  </Button>
                </div>
              )
            })}
            <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add option
            </Button>
          </div>
        )}

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
                rows={3}
                value={formData.answerText ?? ''}
                onChange={handleInputChange}
              />
            )}
          </div>
        )}

        {type === 'Numerical' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                onChange={(e) => set('answerMin', numberOrNull(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Accepted max</Label>
              <Input
                value={formData.answerMax ?? ''}
                onChange={(e) => set('answerMax', numberOrNull(e.target.value))}
              />
            </div>
          </div>
        )}
      </Section>

      {/* Marks & solution */}
      <Section title="Marks & solution">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="marks">Marks</Label>
            <Input
              id="marks"
              inputMode="decimal"
              value={formData.marks ?? ''}
              onChange={(e) => set('marks', numberOrNull(e.target.value))}
              placeholder="e.g. 4"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="negMarks">Negative marks</Label>
            <Input
              id="negMarks"
              inputMode="decimal"
              value={formData.negMarks ?? ''}
              onChange={(e) => set('negMarks', numberOrNull(e.target.value))}
              placeholder="e.g. 1"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="markscheme">Solution / mark scheme</Label>
          <Textarea
            id="markscheme"
            name="markscheme"
            rows={3}
            value={formData.markscheme || ''}
            onChange={handleInputChange}
            placeholder="Worked solution or marking notes (Markdown + LaTeX)…"
          />
        </div>
      </Section>

      <DialogFooter className="gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save question'}
        </Button>
      </DialogFooter>
    </form>
  )
}

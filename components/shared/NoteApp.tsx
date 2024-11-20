'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { Loader2Icon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Note = {
  id: string
  title: string
  content: string
  updatedAt: string
}

const CACHE_KEY = 'notes_cache'
const API_RATE_LIMIT = 5000 // 5 seconds

export default function OptimizedNoteApp() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastApiCall, setLastApiCall] = useState(0)

  const { control, handleSubmit, reset } = useForm<{ title: string; content: string }>({
    defaultValues: { title: "", content: "" },
  })

  const fetchNotes = useCallback(async () => {
    const now = Date.now()
    if (now - lastApiCall < API_RATE_LIMIT) {
      console.log('Rate limit reached, using cached data')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/notes')
      if (!response.ok) throw new Error('Failed to fetch notes')
      const data = await response.json()
      setNotes(data)
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      setLastApiCall(now)
      toast.success("Notes loaded successfully")
    } catch (error) {
      console.error('Error fetching notes:', error)
      toast.error("Failed to load notes")
    } finally {
      setIsLoading(false)
    }
  }, [lastApiCall])

  useEffect(() => {
    const cachedNotes = localStorage.getItem(CACHE_KEY)
    if (cachedNotes) {
      setNotes(JSON.parse(cachedNotes))
    }
    fetchNotes()
  }, [fetchNotes])

  const onSubmit = async (data: { title: string; content: string }) => {
    const now = Date.now()
    if (now - lastApiCall < API_RATE_LIMIT) {
      toast.error("Please wait before submitting again")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to save note')

      const savedNote = await response.json()
      setNotes(prevNotes => [savedNote, ...prevNotes])
      localStorage.setItem(CACHE_KEY, JSON.stringify([savedNote, ...notes]))
      setLastApiCall(now)
      reset({ title: "", content: "" })
      toast.success("Note added successfully")
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error("Failed to save note")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create Note</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Controller 
                name="title" 
                control={control}
                rules={{ required: "Title is required" }}
                render={({ field }) => <Input id="title" {...field} />}
              />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Controller 
                name="content" 
                control={control}
                rules={{ required: "Content is required" }}
                render={({ field }) => <Textarea id="content" {...field} />}
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Note"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <Card key={note.id}>
            <CardHeader>
              <CardTitle>{note.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{note.content}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(note.updatedAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
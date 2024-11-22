'use client'

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { RocketIcon, Search, PlusIcon, ImageIcon, Loader2Icon, PencilIcon, Square, Circle, Edit2Icon, EraserIcon, BoldIcon, ItalicIcon, UnderlineIcon, ListIcon, ListOrderedIcon, Mic, MicOff } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Toggle } from "@/components/ui/toggle"
import { Skeleton } from "@/components/ui/skeleton"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'

type NoteType = "TEXT" | "IMAGE" | "STYLUS" | "VOICE"

type Note = {
  id: string
  title: string
  content: string
  type: NoteType
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'demo_notes'

const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('')
  const [listening, setListening] = useState(false)

  const startListening = useCallback(() => {
    setListening(true)
    // Simulating speech recognition
    const recognition = setInterval(() => {
      setTranscript(prev => prev + ' ' + Math.random().toString(36).substring(7))
    }, 1000)
    setTimeout(() => {
      clearInterval(recognition)
      setListening(false)
    }, 5000)
  }, [])

  const stopListening = useCallback(() => {
    setListening(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
  }, [])

  return {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition: true
  }
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="flex space-x-2 mb-2">
      <Toggle
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrderedIcon className="h-4 w-4" />
      </Toggle>
    </div>
  )
}

export default function DemoNoteComponent() {
  const [notes, setNotes] = useState<Note[]>([])
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDrawing, setIsDrawing] = useState(false)
  const [penColor, setPenColor] = useState("#000000")
  const [penSize, setPenSize] = useState(2)
  const [currentShape, setCurrentShape] = useState<"pen" | "square" | "circle">("pen")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { control, handleSubmit, reset, watch, setValue } = useForm<{ title: string; content: string; type: NoteType }>({
    defaultValues: { title: "", content: "", type: "TEXT" },
  })

  const noteType = watch("type")

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '',
    onUpdate: ({ editor }) => {
      setValue('content', editor.getHTML())
    }
  })

  useEffect(() => {
    const storedNotes = localStorage.getItem(STORAGE_KEY)
    if (storedNotes) {
      setNotes(JSON.parse(storedNotes))
    }
  }, [])

  const saveNotesToStorage = useCallback((updatedNotes: Note[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes))
  }, [])

  const onSubmit = async (data: { title: string; content: string; type: NoteType }) => {
    setIsLoading(true)
    try {
      let noteContent = data.content
      if (data.type === 'STYLUS') {
        noteContent = canvasRef.current?.toDataURL() || ''
      } else if (data.type === 'TEXT') {
        noteContent = editor?.getHTML() || ''
      }

      if (!noteContent.trim()) {
        throw new Error('Note content cannot be empty')
      }

      const newNote: Note = {
        id: editingNote ? editingNote.id : Date.now().toString(),
        title: data.title.trim() || 'Untitled Note',
        content: noteContent,
        type: data.type,
        createdAt: editingNote ? editingNote.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setNotes(prevNotes => {
        const updatedNotes = editingNote
          ? prevNotes.map(note => note.id === newNote.id ? newNote : note)
          : [newNote, ...prevNotes]
        saveNotesToStorage(updatedNotes)
        return updatedNotes
      })

      toast.success(editingNote ? "Note updated successfully" : "Note added successfully", {
        description: `Your ${data.type.toLowerCase()} note has been ${editingNote ? "updated" : "saved"}.`,
      })

      reset({ title: "", content: "", type: "TEXT" })
      editor?.commands.setContent('')
      setEditingNote(null)
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error("Failed to save note", {
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteNote = async (note: Note) => {
    setIsLoading(true)
    try {
      setNotes(prevNotes => {
        const updatedNotes = prevNotes.filter((n) => n.id !== note.id)
        saveNotesToStorage(updatedNotes)
        return updatedNotes
      })
      toast.success("Note deleted successfully", {
        description: "Your note has been permanently removed.",
      })
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error("Failed to delete note", {
        description: "The note couldn't be deleted. Please try again later.",
      })
    } finally {
      setIsLoading(false)
      setIsDeleteModalOpen(false)
      setNoteToDelete(null)
    }
  }

  const handleEdit = (note: Note) => {
    setEditingNote(note)
    reset({ title: note.title, content: note.content, type: note.type })
    if (note.type === 'STYLUS' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      const img = new Image()
      img.onload = () => {
        ctx?.drawImage(img, 0, 0)
      }
      img.src = note.content
    } else if (note.type === 'TEXT') {
      editor?.commands.setContent(note.content)
    }
    toast.info("Editing note", {
      description: "You are now editing an existing note. Make your changes and click 'Update Note' to save.",
    })
  }

  const filteredNotes = notes.filter(
    (note) => note.title.toLowerCase().includes(searchTerm.toLowerCase()) || note.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx?.beginPath()
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let x, y
    if ('touches' in e) {
      x = (e.touches[0].clientX - rect.left) * scaleX
      y = (e.touches[0].clientY - rect.top) * scaleY
    } else {
      x = (e.clientX - rect.left) * scaleX
      y = (e.clientY - rect.top) * scaleY
    }

    ctx.strokeStyle = penColor
    ctx.lineWidth = penSize
    ctx.lineCap = 'round'

    if (currentShape === 'pen') {
      ctx.lineTo(x, y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x, y)
    } else if (currentShape === 'square') {
      ctx.strokeRect(x - penSize / 2, y - penSize / 2, penSize, penSize)
    } else if (currentShape === 'circle') {
      ctx.beginPath()
      ctx.arc(x, y, penSize / 2, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  const VoiceToTextContent = () => {
    const {
      transcript,
      listening,
      startListening,
      stopListening,
      resetTranscript,
      browserSupportsSpeechRecognition
    } = useSpeechRecognition()

    useEffect(() => {
      setValue('content', transcript)
    }, [transcript, setValue])

    if (!browserSupportsSpeechRecognition) {
      return <span>Browser doesn&apos;t support speech recognition.</span>
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-center space-x-2">
          <Button
            onClick={startListening}
            disabled={listening}
          >
            <Mic className="mr-2 h-4 w-4" />
            Start Recording
          </Button>
          <Button
            onClick={stopListening}
            disabled={!listening}
            variant="secondary"
          >
            <MicOff className="mr-2 h-4 w-4" />
            Stop Recording
          </Button>
          <Button
            onClick={resetTranscript}
            variant="outline"
          >
            Reset
          </Button>
        </div>
        <div className="p-4 border rounded-md min-h-[100px]">
          {transcript || "Your note will appear here..."}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <h1 className="text-lg font-semibold">Demo Note App</h1>
        <div className="flex-1" />
        <Input
          className="w-[200px] md:w-[300px]"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 overflow-auto">
        <Card className="w-full md:w-[700px]">
          <CardHeader>
            <CardTitle>{editingNote ? "Edit Note" : "Create Note"}</CardTitle>
            <CardDescription>
              Add a new note or edit an existing one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((data) => {
              if (!data.content.trim() && data.type !== 'STYLUS') {
                toast.error("Note content cannot be empty")
                return
              }
              onSubmit(data)
            })}>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="title">Title</Label>
                  <Controller 
                    name="title" 
                    control={control} 
                    rules={{ required: "Title is required" }}
                    render={({ field, fieldState: { error } }) => (
                      <>
                        <Input id="title" {...field} placeholder="Enter a title" />
                        {error && <span className="text-red-500 text-sm">{error.message}</span>}
                      </>
                    )}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label>Note Type</Label>
                  <Tabs value={noteType} onValueChange={(value) => setValue("type", value as NoteType)}>
                    <TabsList>
                      <TabsTrigger value="TEXT">Text</TabsTrigger>
                      <TabsTrigger value="IMAGE">Image</TabsTrigger>
                      <TabsTrigger value="STYLUS">Stylus</TabsTrigger>
                      <TabsTrigger value="VOICE">Voice</TabsTrigger>
                    </TabsList>
                    <TabsContent value="TEXT">
                      <div className="border rounded-md p-4">
                        <MenuBar editor={editor} />
                        <EditorContent editor={editor} />
                      </div>
                    </TabsContent>
                    <TabsContent value="IMAGE">
                      <Input 
                        id="picture" 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setValue('content', reader.result as string)
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </TabsContent>
                    <TabsContent value="STYLUS">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline">Open Drawing Canvas</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px] backdrop-blur-sm bg-opacity-50">
                          <DialogHeader>
                            <DialogTitle>Drawing Canvas</DialogTitle>
                            <DialogDescription>Use your stylus or mouse to draw a note.</DialogDescription>
                          </DialogHeader>
                          <div className="flex flex-col space-y-4">
                            <div className="flex justify-between items-center">
                              <div className="flex space-x-2">
                                <Toggle pressed={currentShape === 'pen'} onPressedChange={() => setCurrentShape('pen')}>
                                  <PencilIcon className="h-4 w-4"  />
                                </Toggle>
                                <Toggle pressed={currentShape === 'square'} onPressedChange={() => setCurrentShape('square')}>
                                  <Square className="h-4 w-4" />
                                </Toggle>
                                <Toggle pressed={currentShape === 'circle'} onPressedChange={() => setCurrentShape('circle')}>
                                  <Circle className="h-4 w-4" />
                                </Toggle>
                              </div>
                              <Input
                                type="color"
                                value={penColor}
                                onChange={(e) => setPenColor(e.target.value)}
                                className="w-10 h-10 p-0 border-0"
                              />
                              <Input
                                type="range"
                                min="1"
                                max="20"
                                value={penSize}
                                onChange={(e) => setPenSize(parseInt(e.target.value))}
                                className="w-32"
                              />
                              <Button variant="outline" onClick={clearCanvas}>
                                <EraserIcon className="h-4 w-4 mr-2" />
                                Clear
                              </Button>
                            </div>
                            <canvas
                              ref={canvasRef}
                              width={700}
                              height={400}
                              onMouseDown={startDrawing}
                              onMouseUp={stopDrawing}
                              onMouseOut={stopDrawing}
                              onMouseMove={draw}
                              onTouchStart={startDrawing}
                              onTouchEnd={stopDrawing}
                              onTouchMove={draw}
                              className="border border-gray-300 rounded-lg touch-none"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TabsContent>
                    <TabsContent value="VOICE">
                      <VoiceToTextContent />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              <div className="mt-4 flex justify-between">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Please wait
                    </>
                  ) : editingNote ? (
                    "Update Note"
                  ) : (
                    "Add Note"
                  )}
                </Button>
                {editingNote && (
                  <Button type="button" variant="outline"
                    onClick={() => {
                      setEditingNote(null)
                      reset({ title: "", content: "", type: "TEXT" })
                      editor?.commands.setContent('')
                      toast.info("Cancelled editing", {
                        description: "You've cancelled editing. The note remains unchanged.",
                      })
                    }}
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <motion.div
                  key={`skeleton-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-5 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-9 w-20 mr-2" />
                      <Skeleton className="h-9 w-20" />
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            ) : filteredNotes.length === 0 ? (
              <motion.div
                key="no-notes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full text-center text-muted-foreground"
              >
                No notes found. Start by creating a new note!
              </motion.div>
            ) : (
              filteredNotes.map((note) => (
                <motion.div key={note.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{note.title || "Untitled Note"}</CardTitle>
                      {note.type === "TEXT" && <Edit2Icon className="h-4 w-4 text-muted-foreground" />}
                      {note.type === "IMAGE" && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                      {note.type === "STYLUS" && <PencilIcon className="h-4 w-4 text-muted-foreground" />}
                      {note.type === "VOICE" && <Mic className="h-4 w-4 text-muted-foreground" />}
                    </CardHeader>
                    <CardContent>
                      {note.type === 'STYLUS' ? (
                        <img src={note.content} alt="Stylus note" className="w-full h-auto" />
                      ) : note.type === 'TEXT' ? (
                        <div dangerouslySetInnerHTML={{ __html: note.content }} className="prose max-w-none" />
                      ) : note.type === 'IMAGE' ? (
                        <img src={note.content} alt="Note image" className="w-full h-auto" />
                      ) : (
                        <p className="text-sm">{note.content}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">{new Date(note.updatedAt).toLocaleString()}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(note)}>
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setNoteToDelete(note)
                          setIsDeleteModalOpen(true)
                        }}
                      >
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && noteToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full"
          >
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6">Are you sure you want to delete this note? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setNoteToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteNote(noteToDelete)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}


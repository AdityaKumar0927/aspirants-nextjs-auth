"use client"

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  ChangeEvent,
  MouseEvent,
  TouchEvent,
} from "react"
import { useForm, Controller } from "react-hook-form"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListIcon,
  ListOrderedIcon,
  PencilIcon,
  ImageIcon,
  Mic,
  MicOff,
  Loader2Icon,
  Edit2Icon,
  EraserIcon,
  Square,
  Circle,
  Trash2Icon,
} from "lucide-react"

// shadcn/ui components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toggle } from "@/components/ui/toggle"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"

/* ------------------------------------------------------------------
   NOTE TYPES
------------------------------------------------------------------ */

type NoteType = "TEXT" | "IMAGE" | "STYLUS" | "VOICE"

type Note = {
  id: string
  title: string
  content: string     // text, HTML, or base64 string for images/drawing, or transcript
  type: NoteType
  createdAt: string
  updatedAt: string
  userId: string
  questionId: string | null

  // For voice notes with actual recorded audio:
  // store base64/dataURL of audio so we can play it
  audio?: string
}

/* ------------------------------------------------------------------
   CONSTANTS
------------------------------------------------------------------ */

const CACHE_KEY = "notes_cache"
const API_RATE_LIMIT = 5000 // 5 seconds cooldown between API calls

/* ------------------------------------------------------------------
   SPEECH RECOGNITION (TRANSCRIPTION) HOOK
   - Basic speech-to-text using browser's SpeechRecognition
------------------------------------------------------------------ */
const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState("")
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const startListening = useCallback(() => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event) => {
        const finalTranscript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("")
        setTranscript(finalTranscript)
      }

      recognitionRef.current.onstart = () => setListening(true)
      recognitionRef.current.onend = () => setListening(false)

      recognitionRef.current.start()
    } else {
      console.error("Speech recognition not supported")
      toast.error("Speech recognition is not supported in this browser.")
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript("")
  }, [])

  return {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition:
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
  }
}

/* ------------------------------------------------------------------
   AUDIO RECORDER (Optional) - store audio in state as dataURL
   to allow playback
------------------------------------------------------------------ */
const useAudioRecorder = () => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState<string>("")

  useEffect(() => {
    // Convert recorded chunks to dataURL
    if (!isRecording && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: "audio/webm" })
      const reader = new FileReader()
      reader.onloadend = () => {
        if (reader.result) {
          setAudioURL(reader.result as string)
        }
      }
      reader.readAsDataURL(blob)
    }
  }, [isRecording, recordedChunks])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data])
        }
      }
      recorder.onstart = () => {
        setRecordedChunks([])
        setIsRecording(true)
      }
      recorder.onstop = () => {
        setIsRecording(false)
      }

      recorder.start()
      setMediaRecorder(recorder)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      toast.error("Error accessing microphone for audio recording.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setMediaRecorder(null)
    }
  }

  const resetRecording = () => {
    setRecordedChunks([])
    setAudioURL("")
  }

  return {
    isRecording,
    audioURL,
    startRecording,
    stopRecording,
    resetRecording,
  }
}

/* ------------------------------------------------------------------
   TIPTAP MENUBAR COMPONENT
------------------------------------------------------------------ */
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="flex space-x-2 mb-2">
      <Toggle
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={editor.isActive("underline")}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrderedIcon className="h-4 w-4" />
      </Toggle>
    </div>
  )
}

/* ------------------------------------------------------------------
   MAIN NOTE APP
------------------------------------------------------------------ */
export default function NextGenNoteApp({ questionId }: { questionId?: string }) {
  // State
  const [notes, setNotes] = useState<Note[]>([])
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDrawing, setIsDrawing] = useState(false)
  const [penColor, setPenColor] = useState("#000000")
  const [penSize, setPenSize] = useState(2)
  const [currentShape, setCurrentShape] = useState<"pen" | "square" | "circle">("pen")

  const [isClient, setIsClient] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)
  const [lastApiCall, setLastApiCall] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<{
    title: string
    content: string
    type: NoteType
    audio?: string
  }>({
    defaultValues: {
      title: "",
      content: "",
      type: "TEXT",
      audio: "",
    },
  })

  const noteType = watch("type")

  // Tiptap Editor
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: "",
    onUpdate: ({ editor }) => {
      setValue("content", editor.getHTML())
    },
  })

  // Voice to text (like original code)
  const {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition()

  // Audio recorder (for actual audio playback)
  const {
    isRecording,
    audioURL,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder()

  // Fetch notes from backend or local cache
  const fetchNotes = useCallback(async () => {
    const now = Date.now()
    if (now - lastApiCall < API_RATE_LIMIT) {
      // Rate limit reached, use cached data
      const cachedNotes = localStorage.getItem(CACHE_KEY)
      if (cachedNotes) {
        setNotes(JSON.parse(cachedNotes))
      }
      return
    }

    setIsLoading(true)
    try {
      let url = "/api/notes"
      if (questionId) {
        url += `/question?questionId=${questionId}`
      }
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch notes")
      const data = await response.json()
      setNotes(Array.isArray(data) ? data : [])
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      setLastApiCall(now)
      toast.success("Notes loaded successfully")
    } catch (error) {
      console.error("Error fetching notes:", error)
      toast.error("Failed to load notes", {
        description: "Please try again later. Your existing notes are still available.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [questionId, lastApiCall])

  // On mount, load cached notes and fetch fresh ones
  useEffect(() => {
    setIsClient(true)
    const cachedNotes = localStorage.getItem(CACHE_KEY)
    if (cachedNotes) {
      setNotes(JSON.parse(cachedNotes))
    }
    fetchNotes()
  }, [fetchNotes])

  // Keep an eye on the voice transcript
  useEffect(() => {
    if (noteType === "VOICE") {
      setValue("content", transcript)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript])

  // Submission
  const onSubmit = async (data: { title: string; content: string; type: NoteType; audio?: string }) => {
    const now = Date.now()
    if (now - lastApiCall < API_RATE_LIMIT) {
      toast.error("Please wait before submitting again")
      return
    }

    setIsLoading(true)
    try {
      let noteContent = data.content
      let noteAudio = data.audio || ""

      // If it's stylus, convert canvas to data URL
      if (data.type === "STYLUS" && canvasRef.current) {
        noteContent = canvasRef.current.toDataURL()
      }
      // If text, take content from Tiptap
      else if (data.type === "TEXT") {
        noteContent = editor?.getHTML() || ""
      }
      // If voice, check if we have an audioURL recorded
      else if (data.type === "VOICE") {
        // Use transcript as `content`
        // and store the audio in `audio` field if available
        noteAudio = audioURL
      }

      // Validate non-empty content for text or stylus
      if ((data.type === "TEXT" || data.type === "VOICE") && !noteContent.trim()) {
        throw new Error("Note content cannot be empty")
      }

      const noteData = {
        title: data.title.trim() || `Note for ${questionId ? `Question ${questionId}` : "General"}`,
        content: noteContent,
        type: data.type,
        questionId: questionId || null,
        audio: noteAudio,
      }

      const url = editingNote ? `/api/notes/${editingNote.id}` : "/api/notes"
      const method = editingNote ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(noteData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save note")
      }

      const savedNote = await response.json()

      setNotes((prevNotes) => {
        const updatedNotes = editingNote
          ? prevNotes.map((note) => (note.id === savedNote.id ? savedNote : note))
          : [savedNote, ...prevNotes]
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedNotes))
        return updatedNotes
      })

      setLastApiCall(now)
      toast.success(editingNote ? "Note updated successfully" : "Note added successfully", {
        description: `Your ${data.type.toLowerCase()} note has been ${
          editingNote ? "updated" : "saved"
        }.`,
      })

      // Reset form
      reset({ title: "", content: "", type: "TEXT" })
      editor?.commands.setContent("")
      setEditingNote(null)
      resetTranscript()
      resetRecording()
      clearCanvas()
    } catch (error: any) {
      console.error("Error saving note:", error)
      toast.error("Failed to save note", {
        description: error?.message || "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Deletion
  const deleteNote = async (note: Note) => {
    const now = Date.now()
    if (now - lastApiCall < API_RATE_LIMIT) {
      toast.error("Please wait before deleting again")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete note")

      setNotes((prevNotes) => {
        const updatedNotes = prevNotes.filter((n) => n.id !== note.id)
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedNotes))
        return updatedNotes
      })
      setLastApiCall(now)
      toast.success("Note deleted successfully", {
        description: "Your note has been permanently removed.",
      })
    } catch (error) {
      console.error("Error deleting note:", error)
      toast.error("Failed to delete note", {
        description: "The note couldn't be deleted. Please try again later.",
      })
    } finally {
      setIsLoading(false)
      setIsDeleteModalOpen(false)
      setNoteToDelete(null)
    }
  }

  // Edit note
  const handleEdit = (note: Note) => {
    setEditingNote(note)
    reset({
      title: note.title,
      content: note.content,
      type: note.type,
      audio: note.audio || "",
    })

    if (note.type === "STYLUS" && canvasRef.current) {
      clearCanvas()
      const ctx = canvasRef.current.getContext("2d")
      const img = new Image()
      img.onload = () => {
        ctx?.drawImage(img, 0, 0)
      }
      img.src = note.content
    } else if (note.type === "TEXT") {
      editor?.commands.setContent(note.content)
    } else if (note.type === "VOICE") {
      // load transcript into content
      setValue("content", note.content)
      // load recorded audio if any
      if (note.audio) {
        // we have a stored audio in base64
      }
    }

    toast.info("Editing note", {
      description:
        "You are now editing an existing note. Make your changes and click 'Update Note' to save.",
    })
  }

  // Filtered notes
  const filteredNotes = notes.filter((note) => {
    const term = searchTerm.toLowerCase()
    return (
      note.title.toLowerCase().includes(term) ||
      note.content.toLowerCase().includes(term)
    )
  })

  /* ------------------------------------------------------------------
     STYLUS DRAWING LOGIC
  ------------------------------------------------------------------ */
  const startDrawing = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      ctx?.beginPath()
    }
  }

  const draw = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let x: number
    let y: number
    if ("touches" in e) {
      x = (e.touches[0].clientX - rect.left) * scaleX
      y = (e.touches[0].clientY - rect.top) * scaleY
    } else {
      x = ((e as MouseEvent).clientX - rect.left) * scaleX
      y = ((e as MouseEvent).clientY - rect.top) * scaleY
    }

    ctx.strokeStyle = penColor
    ctx.lineWidth = penSize
    ctx.lineCap = "round"

    if (currentShape === "pen") {
      ctx.lineTo(x, y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x, y)
    } else if (currentShape === "square") {
      ctx.strokeRect(x - penSize / 2, y - penSize / 2, penSize, penSize)
    } else if (currentShape === "circle") {
      ctx.beginPath()
      ctx.arc(x, y, penSize / 2, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  /* ------------------------------------------------------------------
     RENDER
  ------------------------------------------------------------------ */
  return (
    <div className="flex h-screen bg-gradient-to-tr from-gray-900 via-[#1E1E2F] to-[#2C2C44] text-white overflow-hidden">
      {/** SIDEBAR - list of notes + search */}
      <aside className="w-64 flex flex-col bg-white/10 backdrop-blur-sm p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Notes 2025</h1>
          <p className="text-sm text-gray-300">
            {questionId
              ? `For Question #${questionId}`
              : "General Notes"}
          </p>
        </div>
        <div className="mb-4">
          <Input
            className="w-full"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-auto space-y-2">
          {/* List (or grid) of existing notes */}
          <AnimatePresence>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <motion.div
                  key={`skeleton-sidebar-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Skeleton className="h-10 w-full rounded-md" />
                </motion.div>
              ))
            ) : filteredNotes.length === 0 ? (
              <motion.div
                key="no-notes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-sm text-gray-400 mt-4"
              >
                No notes found.
              </motion.div>
            ) : (
              filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="cursor-pointer border border-white/10 rounded-md px-3 py-2 hover:bg-white/20"
                  onClick={() => handleEdit(note)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate text-sm">{note.title || "Untitled"}</span>
                    {note.type === "TEXT" && <Edit2Icon className="h-4 w-4 text-gray-300" />}
                    {note.type === "IMAGE" && <ImageIcon className="h-4 w-4 text-gray-300" />}
                    {note.type === "STYLUS" && <PencilIcon className="h-4 w-4 text-gray-300" />}
                    {note.type === "VOICE" && <Mic className="h-4 w-4 text-gray-300" />}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(note.updatedAt).toLocaleString()}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col p-6 overflow-auto">
        <Card className="bg-white/5 backdrop-blur-sm text-white max-w-3xl mx-auto w-full mb-4 border-white/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              {editingNote ? "Edit Note" : "Create Note"}
            </CardTitle>
            <CardDescription>
              {questionId
                ? `Note for Question ${questionId}`
                : "Add or edit a note"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((data) => {
                // Basic empty check for text/voice
                if (data.type !== "STYLUS" && !data.content.trim()) {
                  toast.error("Note content cannot be empty")
                  return
                }
                onSubmit(data)
              })}
            >
              <div className="space-y-4">
                {/* Title */}
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="title">Title</Label>
                  <Controller
                    name="title"
                    control={control}
                    rules={{ required: "Title is required" }}
                    render={({ field, fieldState: { error } }) => (
                      <>
                        <Input
                          id="title"
                          {...field}
                          placeholder="Enter a title"
                          className="bg-white/10 text-white"
                        />
                        {error && (
                          <span className="text-red-400 text-sm">
                            {error.message}
                          </span>
                        )}
                      </>
                    )}
                  />
                </div>

                {/* Note Type Tabs */}
                <div className="flex flex-col space-y-1.5">
                  <Label>Note Type</Label>
                  <Tabs
                    value={noteType}
                    onValueChange={(value) =>
                      setValue("type", value as NoteType)
                    }
                  >
                    <TabsList className="bg-white/10 text-white">
                      <TabsTrigger value="TEXT">Text</TabsTrigger>
                      <TabsTrigger value="IMAGE">Image</TabsTrigger>
                      <TabsTrigger value="STYLUS">Stylus</TabsTrigger>
                      <TabsTrigger value="VOICE">Voice</TabsTrigger>
                    </TabsList>

                    {/* TEXT */}
                    <TabsContent value="TEXT">
                      <div className="border border-white/10 rounded-md p-4 mt-2">
                        <MenuBar editor={editor} />
                        <EditorContent editor={editor} />
                      </div>
                    </TabsContent>

                    {/* IMAGE */}
                    <TabsContent value="IMAGE">
                      <div className="mt-2">
                        <Input
                          id="picture"
                          type="file"
                          accept="image/*"
                          className="bg-white/10 text-white"
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onloadend = () => {
                                setValue("content", reader.result as string)
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                      </div>
                    </TabsContent>

                    {/* STYLUS */}
                    <TabsContent value="STYLUS">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="mt-2">
                            Open Drawing Canvas
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[900px] bg-white/10 backdrop-blur-md text-white border-white/10">
                          <DialogHeader>
                            <DialogTitle>Drawing Canvas</DialogTitle>
                            <DialogDescription>
                              Use your stylus or mouse to draw.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex flex-col space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex space-x-2">
                                <Toggle
                                  pressed={currentShape === "pen"}
                                  onPressedChange={() => setCurrentShape("pen")}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Toggle>
                                <Toggle
                                  pressed={currentShape === "square"}
                                  onPressedChange={() => setCurrentShape("square")}
                                >
                                  <Square className="h-4 w-4" />
                                </Toggle>
                                <Toggle
                                  pressed={currentShape === "circle"}
                                  onPressedChange={() => setCurrentShape("circle")}
                                >
                                  <Circle className="h-4 w-4" />
                                </Toggle>
                              </div>
                              <Input
                                type="color"
                                value={penColor}
                                onChange={(e) => setPenColor(e.target.value)}
                                className="w-10 h-10 p-0 border-0 bg-transparent"
                              />
                              <Input
                                type="range"
                                min="1"
                                max="20"
                                value={penSize}
                                onChange={(e) =>
                                  setPenSize(parseInt(e.target.value))
                                }
                                className="w-32 bg-white/30"
                              />
                              <Button variant="outline" onClick={clearCanvas}>
                                <EraserIcon className="h-4 w-4 mr-2" />
                                Clear
                              </Button>
                            </div>
                            <canvas
                              ref={canvasRef}
                              width={800}
                              height={500}
                              className="border border-white/20 rounded-lg"
                              onMouseDown={startDrawing}
                              onMouseUp={stopDrawing}
                              onMouseOut={stopDrawing}
                              onMouseMove={draw}
                              onTouchStart={startDrawing}
                              onTouchEnd={stopDrawing}
                              onTouchMove={draw}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TabsContent>

                    {/* VOICE */}
                    <TabsContent value="VOICE">
                      <div className="space-y-4 mt-2">
                        {/* Speech-to-text */}
                        <div>
                          <Label className="mb-2 block">Transcription</Label>
                          <div className="flex gap-2 mb-2">
                            <Button
                              onClick={startListening}
                              disabled={listening}
                            >
                              <Mic className="mr-2 h-4 w-4" />
                              {listening ? "Listening..." : "Start Recording"}
                            </Button>
                            <Button
                              onClick={stopListening}
                              disabled={!listening}
                              variant="secondary"
                            >
                              <MicOff className="mr-2 h-4 w-4" />
                              Stop
                            </Button>
                            <Button onClick={resetTranscript} variant="outline">
                              Reset Transcript
                            </Button>
                          </div>
                          <div className="p-2 border border-white/20 rounded-md min-h-[80px] bg-white/5">
                            {transcript || "Transcription will appear here..."}
                          </div>
                          {!browserSupportsSpeechRecognition && (
                            <p className="text-red-300 text-sm mt-2">
                              Browser does not support speech recognition.
                            </p>
                          )}
                        </div>

                        {/* Audio Recorder */}
                        <div>
                          <Label className="mb-2 block">Audio Recording</Label>
                          <div className="flex gap-2 mb-2">
                            {!isRecording ? (
                              <Button onClick={startRecording}>
                                <Mic className="mr-2 h-4 w-4" />
                                Record Audio
                              </Button>
                            ) : (
                              <Button variant="destructive" onClick={stopRecording}>
                                <MicOff className="mr-2 h-4 w-4" />
                                Stop
                              </Button>
                            )}
                            <Button onClick={resetRecording} variant="outline">
                              Reset Audio
                            </Button>
                          </div>
                          {audioURL && (
                            <audio controls src={audioURL} className="mt-2">
                              Your browser does not support the audio element.
                            </audio>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              {/* Submit / Cancel Buttons */}
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingNote(null)
                      reset({ title: "", content: "", type: "TEXT", audio: "" })
                      editor?.commands.setContent("")
                      resetTranscript()
                      resetRecording()
                      clearCanvas()
                      toast.info("Cancelled editing", {
                        description: "You've cancelled editing.",
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

        {/* If the user wants to see the currently selected note in main area,
            you could display it below or do something else. For simplicity,
            we'll rely on the sidebar to pick the note and the card to edit. */}
      </main>

      {/* DELETE NOTE MODAL */}
      {isDeleteModalOpen && noteToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full text-gray-900"
          >
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6">
              Are you sure you want to delete this note? This action cannot be
              undone.
            </p>
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
              <Button variant="destructive" onClick={() => deleteNote(noteToDelete)}>
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

      {/* You could put a floating delete button or use the sidebar items' "delete" triggers. 
          For example, hooking a right-click or a small trash icon in the sidebar would do: 
          setNoteToDelete(note); setIsDeleteModalOpen(true); 
      */}
    </div>
  )
}

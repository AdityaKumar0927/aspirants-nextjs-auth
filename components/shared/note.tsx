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

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toggle } from "@/components/ui/toggle"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

// Tiptap
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"

// TYPES
type NoteType = "TEXT" | "IMAGE" | "STYLUS" | "VOICE"

type Note = {
  id: string
  title: string
  content: string
  type: NoteType
  createdAt: string
  updatedAt: string
  userId: string
  questionId: string | null
  audio?: string
}

// CONSTANTS
const CACHE_KEY = "notes_cache"
const API_RATE_LIMIT = 5000 // 5 seconds

/* ------------------------------------------------------------------
   SPEECH RECOGNITION (TRANSCRIPTION)
------------------------------------------------------------------ */
const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState("")
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const startListening = useCallback(() => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || (window as any).webkitSpeechRecognition
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
      toast.error("Speech recognition not supported by this browser.")
    }
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
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
   AUDIO RECORDER (For Voice Notes)
------------------------------------------------------------------ */
const useAudioRecorder = () => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState("")

  useEffect(() => {
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
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setRecordedChunks((prev) => [...prev, e.data])
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
    } catch (error) {
      toast.error("Error accessing mic for recording.")
    }
  }

  const stopRecording = () => {
    mediaRecorder?.stop()
    setMediaRecorder(null)
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
   TIPTAP MENUBAR (For text formatting)
------------------------------------------------------------------ */
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null

  return (
    <div className="mb-3 flex items-center space-x-2">
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
        onPressedChange={() =>
          editor.chain().focus().toggleOrderedList().run()
        }
      >
        <ListOrderedIcon className="h-4 w-4" />
      </Toggle>
    </div>
  )
}

/* ------------------------------------------------------------------
   MAIN COMPONENT (Vercel-like Minimal Style)
------------------------------------------------------------------ */
export default function VercelStyleNoteApp({ questionId }: { questionId?: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDrawing, setIsDrawing] = useState(false)
  const [penColor, setPenColor] = useState("#000")
  const [penSize, setPenSize] = useState(2)
  const [currentShape, setCurrentShape] = useState<"pen" | "square" | "circle">("pen")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)
  const [lastApiCall, setLastApiCall] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // FORM
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
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

  // TIPTAP
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: "",
    onUpdate: ({ editor }) => {
      setValue("content", editor.getHTML())
    },
  })

  // SPEECH RECOGNITION
  const {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition()

  // AUDIO RECORDER
  const {
    isRecording,
    audioURL,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder()

  // Fetch
  const fetchNotes = useCallback(async () => {
    const now = Date.now()
    if (now - lastApiCall < API_RATE_LIMIT) {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) setNotes(JSON.parse(cached))
      return
    }

    setIsLoading(true)
    try {
      let url = "/api/notes"
      if (questionId) url += `/question?questionId=${questionId}`
      const resp = await fetch(url)
      if (!resp.ok) throw new Error("Failed to fetch.")
      const data = await resp.json()
      setNotes(Array.isArray(data) ? data : [])
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      setLastApiCall(now)
    } catch (error) {
      toast.error("Could not load notes.")
    } finally {
      setIsLoading(false)
    }
  }, [questionId, lastApiCall])

  useEffect(() => {
    const cache = localStorage.getItem(CACHE_KEY)
    if (cache) setNotes(JSON.parse(cache))
    fetchNotes()
  }, [fetchNotes])

  useEffect(() => {
    if (noteType === "VOICE") {
      setValue("content", transcript)
    }
  }, [transcript, noteType, setValue])

  // SUBMIT
  const onSubmit = async (data: {
    title: string
    content: string
    type: NoteType
    audio?: string
  }) => {
    const now = Date.now()
    if (now - lastApiCall < API_RATE_LIMIT) {
      toast.error("Please wait before submitting again.")
      return
    }

    setIsLoading(true)
    try {
      let noteContent = data.content
      let noteAudio = data.audio || ""

      if (data.type === "STYLUS" && canvasRef.current) {
        noteContent = canvasRef.current.toDataURL()
      } else if (data.type === "TEXT") {
        noteContent = editor?.getHTML() || ""
      } else if (data.type === "VOICE") {
        noteAudio = audioURL
      }

      // Basic validation for text/voice
      if ((data.type === "TEXT" || data.type === "VOICE") && !noteContent.trim()) {
        throw new Error("Cannot be empty.")
      }

      const noteData = {
        title: data.title.trim() || "Untitled",
        content: noteContent,
        type: data.type,
        questionId: questionId || null,
        audio: noteAudio,
      }

      const url = editingNote ? `/api/notes/${editingNote.id}` : "/api/notes"
      const method = editingNote ? "PUT" : "POST"

      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      })
      if (!resp.ok) {
        const errData = await resp.json()
        throw new Error(errData.error || "Error saving note.")
      }

      const savedNote = await resp.json()
      setNotes((prev) => {
        const updated = editingNote
          ? prev.map((n) => (n.id === savedNote.id ? savedNote : n))
          : [savedNote, ...prev]
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated))
        return updated
      })

      setLastApiCall(now)
      toast.success(editingNote ? "Note updated" : "Note added")
      reset({ title: "", content: "", type: "TEXT", audio: "" })
      editor?.commands.setContent("")
      resetTranscript()
      resetRecording()
      clearCanvas()
      setEditingNote(null)
    } catch (error: any) {
      toast.error(error.message || "Failed to save note.")
    } finally {
      setIsLoading(false)
    }
  }

  // DELETE
  const deleteNote = async (note: Note) => {
    const now = Date.now()
    if (now - lastApiCall < API_RATE_LIMIT) {
      toast.error("Please wait before deleting again.")
      return
    }
    setIsLoading(true)
    try {
      const resp = await fetch(`/api/notes/${note.id}`, { method: "DELETE" })
      if (!resp.ok) throw new Error("Delete failed.")
      setNotes((prev) => {
        const updated = prev.filter((n) => n.id !== note.id)
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated))
        return updated
      })
      setLastApiCall(now)
      toast("Note deleted.")
    } catch (error) {
      toast.error("Failed to delete.")
    } finally {
      setIsLoading(false)
      setIsDeleteModalOpen(false)
      setNoteToDelete(null)
    }
  }

  // EDIT
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
      if (!ctx) return
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = note.content
    } else if (note.type === "TEXT") {
      editor?.commands.setContent(note.content)
    }
  }

  // FILTER
  const filteredNotes = notes.filter((n) => {
    const t = searchTerm.toLowerCase()
    return n.title.toLowerCase().includes(t) || n.content.toLowerCase().includes(t)
  })

  // STYLUS
  const startDrawing = (
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawing(true)
    draw(e)
  }
  const stopDrawing = () => {
    setIsDrawing(false)
    canvasRef.current?.getContext("2d")?.beginPath()
  }
  const draw = (
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !canvasRef.current) return
    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height

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

  // RENDER
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* HEADER */}
      <header className="border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Notes</h1>
          {questionId && (
            <span className="text-sm text-neutral-400">Q#{questionId}</span>
          )}
        </div>
        <Input
          placeholder="Search..."
          className="bg-neutral-900 text-sm text-white placeholder:text-neutral-500 border-0 focus:outline-none px-3 py-1.5"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR - LIST OF NOTES */}
        <aside className="border-r border-neutral-800 hidden md:block w-64 p-4 overflow-auto">
          <h2 className="font-semibold mb-3">Your Notes</h2>
          <div className="space-y-2">
            <AnimatePresence>
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <motion.div
                      key={`skel-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Skeleton className="h-8 w-full bg-neutral-800 rounded" />
                    </motion.div>
                  ))
                : filteredNotes.length === 0
                ? (
                  <motion.div
                    key="no-notes"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-neutral-500"
                  >
                    No notes found.
                  </motion.div>
                ) : (
                  filteredNotes.map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="p-2 border border-neutral-800 rounded hover:border-neutral-600 transition-colors cursor-pointer"
                      onClick={() => handleEdit(note)}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{note.title || "Untitled"}</span>
                        {note.type === "TEXT" && (
                          <Edit2Icon className="h-4 w-4 text-neutral-400" />
                        )}
                        {note.type === "IMAGE" && (
                          <ImageIcon className="h-4 w-4 text-neutral-400" />
                        )}
                        {note.type === "STYLUS" && (
                          <PencilIcon className="h-4 w-4 text-neutral-400" />
                        )}
                        {note.type === "VOICE" && (
                          <Mic className="h-4 w-4 text-neutral-400" />
                        )}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {new Date(note.updatedAt).toLocaleString()}
                      </div>
                    </motion.div>
                  ))
                )}
            </AnimatePresence>
          </div>
        </aside>

        {/* MAIN EDITOR */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <motion.div
            layout
            className="max-w-2xl mx-auto w-full border border-neutral-800 rounded p-4"
          >
            <h2 className="text-lg font-semibold mb-1">
              {editingNote ? "Edit Note" : "Create Note"}
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              {questionId ? `Question #${questionId}` : "Write or draw something."}
            </p>

            <form
              onSubmit={handleSubmit((data) => {
                if (data.type !== "STYLUS" && !data.content.trim()) {
                  toast.error("Content cannot be empty.")
                  return
                }
                onSubmit(data)
              })}
            >
              {/* TITLE */}
              <Label className="block mb-1">Title</Label>
              <Controller
                name="title"
                control={control}
                rules={{ required: "Title is required." }}
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      {...field}
                      className="w-full bg-neutral-900 text-white mb-3"
                      placeholder="Note title"
                    />
                    {fieldState.error && (
                      <span className="text-red-400 text-sm">
                        {fieldState.error.message}
                      </span>
                    )}
                  </>
                )}
              />

              {/* TABS */}
              <Tabs value={noteType} onValueChange={(val) => setValue("type", val as NoteType)}>
                <TabsList className="bg-neutral-900 text-white mb-3">
                  <TabsTrigger value="TEXT">Text</TabsTrigger>
                  <TabsTrigger value="IMAGE">Image</TabsTrigger>
                  <TabsTrigger value="STYLUS">Stylus</TabsTrigger>
                  <TabsTrigger value="VOICE">Voice</TabsTrigger>
                </TabsList>

                {/* TEXT */}
                <TabsContent value="TEXT">
                  <MenuBar editor={editor} />
                  <div className="border border-neutral-800 rounded p-2">
                    <EditorContent editor={editor} />
                  </div>
                </TabsContent>

                {/* IMAGE */}
                <TabsContent value="IMAGE">
                  <Input
                    type="file"
                    accept="image/*"
                    className="bg-neutral-900 text-white mt-2"
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
                </TabsContent>

                {/* STYLUS */}
                <TabsContent value="STYLUS">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="mt-2 text-sm">
                        Open Canvas
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border border-neutral-700 bg-neutral-900 text-white max-w-3xl w-full">
                      <DialogHeader>
                        <DialogTitle>Draw</DialogTitle>
                        <DialogDescription>Use your mouse or stylus.</DialogDescription>
                      </DialogHeader>
                      <div className="mt-4 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
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
                          <Input
                            type="color"
                            value={penColor}
                            onChange={(e) => setPenColor(e.target.value)}
                            className="w-8 h-8 p-0"
                          />
                          <Input
                            type="range"
                            min={1}
                            max={20}
                            value={penSize}
                            onChange={(e) => setPenSize(parseInt(e.target.value))}
                            className="w-28"
                          />
                          <Button
                            variant="outline"
                            className="text-sm"
                            onClick={clearCanvas}
                          >
                            <EraserIcon className="h-4 w-4 mr-2" />
                            Clear
                          </Button>
                        </div>
                        <canvas
                          ref={canvasRef}
                          width={800}
                          height={400}
                          className="border border-neutral-700 w-full"
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
                  {/* Transcription */}
                  <div className="mt-2">
                    <Label className="mb-1">Transcription</Label>
                    <div className="flex gap-2 mb-2">
                      <Button
                        onClick={startListening}
                        disabled={listening}
                        className="text-sm"
                      >
                        <Mic className="mr-2 h-4 w-4" />
                        {listening ? "Listening..." : "Start"}
                      </Button>
                      <Button
                        onClick={stopListening}
                        disabled={!listening}
                        variant="outline"
                        className="text-sm"
                      >
                        <MicOff className="mr-2 h-4 w-4" />
                        Stop
                      </Button>
                      <Button
                        onClick={resetTranscript}
                        variant="outline"
                        className="text-sm"
                      >
                        Reset
                      </Button>
                    </div>
                    <div className="min-h-[60px] border border-neutral-800 rounded p-2 text-sm text-neutral-200">
                      {transcript || "Your transcription here..."}
                    </div>
                    {!browserSupportsSpeechRecognition && (
                      <p className="text-red-400 text-sm mt-2">
                        Browser not supported.
                      </p>
                    )}
                  </div>

                  {/* Audio Recording */}
                  <div className="mt-4">
                    <Label className="mb-1">Audio Recording</Label>
                    <div className="flex gap-2 mb-2">
                      {!isRecording ? (
                        <Button onClick={startRecording} className="text-sm">
                          <Mic className="mr-2 h-4 w-4" />
                          Record Audio
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          onClick={stopRecording}
                          className="text-sm"
                        >
                          <MicOff className="mr-2 h-4 w-4" />
                          Stop
                        </Button>
                      )}
                      <Button onClick={resetRecording} variant="outline" className="text-sm">
                        Reset
                      </Button>
                    </div>
                    {audioURL && (
                      <audio controls src={audioURL} className="mt-2 w-full">
                        Audio not supported.
                      </audio>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* ACTION BUTTONS */}
              <div className="mt-4 flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="text-sm bg-[#0070F3] hover:bg-[#0059bf]"
                >
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
                    variant="outline"
                    className="text-sm"
                    onClick={() => {
                      setEditingNote(null)
                      reset({ title: "", content: "", type: "TEXT", audio: "" })
                      editor?.commands.setContent("")
                      resetTranscript()
                      resetRecording()
                      clearCanvas()
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </motion.div>
        </main>
      </div>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {isDeleteModalOpen && noteToDelete && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-neutral-900 border border-neutral-700 p-6 rounded text-white max-w-sm w-full"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <h2 className="text-xl font-bold mb-4">Delete Note</h2>
              <p className="mb-4 text-sm text-neutral-400">
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteModalOpen(false)
                    setNoteToDelete(null)
                  }}
                  className="text-sm"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteNote(noteToDelete)}
                  className="text-sm"
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

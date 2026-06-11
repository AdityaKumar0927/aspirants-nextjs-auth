"use client"

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react"
import { useForm, Controller, UseFormSetValue } from "react-hook-form"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  RocketIcon,
  Search,
  PlusIcon,
  ImageIcon,
  Loader2Icon,
  PencilIcon,
  Square,
  Circle,
  Edit2Icon,
  EraserIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListIcon,
  ListOrderedIcon,
  Mic,
  MicOff,
} from "lucide-react"

import { sanitizeRichText } from "@/lib/sanitize"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Toggle } from "@/components/ui/toggle"
import { Skeleton } from "@/components/ui/skeleton"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"

// ------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------
type NoteType = "TEXT" | "IMAGE" | "STYLUS" | "VOICE"

// The shape of each note
type Note = {
  id: string
  title: string
  content: string
  type: NoteType
  createdAt: string
  updatedAt: string
  userId: string
  questionId: string | null
}

// The shape of your form
interface FormValues {
  title: string
  content: string
  type: NoteType
}

const CACHE_KEY = "notes_cache"
const API_RATE_LIMIT = 5000 // 5 seconds

// ------------------------------------------------------------------
// SPEECH RECOGNITION HOOK
// ------------------------------------------------------------------
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

  const browserSupportsSpeechRecognition =
    "SpeechRecognition" in window || "webkitSpeechRecognition" in window

  return {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  }
}

// ------------------------------------------------------------------
// TIPTAP MENUBAR
// ------------------------------------------------------------------
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null

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
        onPressedChange={() =>
          editor.chain().focus().toggleOrderedList().run()
        }
      >
        <ListOrderedIcon className="h-4 w-4" />
      </Toggle>
    </div>
  )
}

// ------------------------------------------------------------------
// PROPS for VoiceToTextContent
// ------------------------------------------------------------------
interface VoiceToTextContentProps {
  // UseFormSetValue matches the exact form shape
  setValue: UseFormSetValue<FormValues>
}

// ------------------------------------------------------------------
// VOICE NOTE COMPONENT
// ------------------------------------------------------------------
const VoiceToTextContent = ({ setValue }: VoiceToTextContentProps) => {
  const [isClient, setIsClient] = useState(false)

  const {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition()

  useEffect(() => {
    // If we do support speech recognition, set isClient to true
    if (browserSupportsSpeechRecognition) {
      setIsClient(true)
    }
  }, [browserSupportsSpeechRecognition])

  // Update the form's 'content' field each time transcript changes
  useEffect(() => {
    setValue("content", transcript)
  }, [transcript, setValue])

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn&apos;t support speech recognition.</span>
  }

  if (!isClient) {
    return <span>Loading speech recognition...</span>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center space-x-2">
        <Button onClick={startListening} disabled={listening}>
          <Mic className="mr-2 h-4 w-4" />
          Start Recording
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
          Reset
        </Button>
      </div>
      <div className="p-4 border rounded-md min-h-[100px]">
        {transcript || "Your note will appear here..."}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// MAIN NOTE APP
// ------------------------------------------------------------------
export default function OptimizedNoteApp({ questionId }: { questionId?: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)
  const [lastApiCall, setLastApiCall] = useState(0)

  // TIPTAP
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: "",
    onUpdate: ({ editor }) => {
      // each time tiptap updates, we store the HTML in the form
      setValue("content", editor.getHTML())
    },
  })

  // REACT HOOK FORM
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { title: "", content: "", type: "TEXT" },
  })
  const noteType = watch("type")

  // LOAD NOTES
  const fetchNotes = useCallback(async () => {
    const now = Date.now()
    if (now - lastApiCall < API_RATE_LIMIT) {
      // rate limit => load from localStorage
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        setNotes(JSON.parse(cached))
      }
      return
    }

    setIsLoading(true)
    try {
      let url = "/api/notes"
      if (questionId) {
        url += `/question?questionId=${questionId}`
      }
      const resp = await fetch(url)
      if (!resp.ok) throw new Error("Failed to fetch notes")
      const data = await resp.json()
      setNotes(Array.isArray(data) ? data : [])
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      setLastApiCall(now)
      toast.success("Notes loaded successfully")
    } catch (err) {
      console.error("Error fetching notes:", err)
      toast.error("Failed to load notes", {
        description: "Please try again later. Your existing notes are still available.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [questionId, lastApiCall])

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      setNotes(JSON.parse(cached))
    }
    fetchNotes()
  }, [fetchNotes])

  // SUBMIT (CREATE / UPDATE)
  const onSubmit = async (data: FormValues) => {
    const now = Date.now()
    if (now - lastApiCall < API_RATE_LIMIT) {
      toast.error("Please wait before submitting again")
      return
    }
    setIsLoading(true)
    try {
      let noteContent = data.content
      // if type=TEXT => noteContent is Tiptap HTML
      // if type=IMAGE => we store base64 from file input
      // if type=VOICE => we store the transcript
      // if type=STYLUS => we store stylus data or a canvas image

      if (!noteContent.trim()) {
        throw new Error("Note content cannot be empty")
      }

      const noteData = {
        title:
          data.title.trim() ||
          `Note for ${questionId ? `Question ${questionId}` : "General"}`,
        content: noteContent,
        type: data.type,
        questionId: questionId || null,
      }

      const url = editingNote ? `/api/notes/${editingNote.id}` : "/api/notes"
      const method = editingNote ? "PUT" : "POST"
      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      })
      if (!resp.ok) {
        const errorData = await resp.json()
        throw new Error(errorData.error || "Failed to save note")
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
      toast.success(
        editingNote ? "Note updated successfully" : "Note added successfully",
        {
          description: `Your ${data.type.toLowerCase()} note has been ${
            editingNote ? "updated" : "saved"
          }.`,
        }
      )

      reset({ title: "", content: "", type: "TEXT" })
      editor?.commands.setContent("")
      setEditingNote(null)
    } catch (error: any) {
      console.error("Error saving note:", error)
      toast.error("Failed to save note", {
        description: error.message || "An unexpected error occurred.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // DELETE
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

      setNotes((prev) => {
        const updated = prev.filter((n) => n.id !== note.id)
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated))
        return updated
      })
      setLastApiCall(now)
      toast.success("Note deleted successfully", {
        description: "Your note has been removed.",
      })
    } catch (err) {
      console.error("Error deleting note:", err)
      toast.error("Failed to delete note", {
        description: "Please try again later.",
      })
    } finally {
      setIsLoading(false)
      setIsDeleteModalOpen(false)
      setNoteToDelete(null)
    }
  }

  // EDIT
  const handleEdit = (note: Note) => {
    setEditingNote(note)
    reset({ title: note.title, content: note.content, type: note.type })
    if (note.type === "TEXT") {
      editor?.commands.setContent(note.content)
    }
    toast.info("Editing note", {
      description:
        "You are now editing an existing note. Make changes and click 'Update Note' to save.",
    })
  }

  // FILTER
  const filteredNotes = notes.filter((note) => {
    const term = searchTerm.toLowerCase()
    return (
      note.title.toLowerCase().includes(term) ||
      note.content.toLowerCase().includes(term)
    )
  })

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* HEADER */}
      <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <h1 className="font-display text-2xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
          {questionId ? `Notes for Question ${questionId}` : "My Notes"}
        </h1>
        <div className="flex-1" />
        <Input
          className="w-[200px] md:w-[300px]"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </header>

      {/* MAIN */}
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 overflow-auto">
        <Card className="w-full md:w-[700px]">
          <CardHeader>
            <CardTitle>{editingNote ? "Edit Note" : "Create Note"}</CardTitle>
            <CardDescription>
              {questionId
                ? `Add a note for Question ${questionId}`
                : "Add a note"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((data) => {
                if (!data.content.trim() && data.type !== "STYLUS") {
                  toast.error("Note content cannot be empty")
                  return
                }
                onSubmit(data)
              })}
            >
              <div className="grid w-full items-center gap-4">
                {/* TITLE */}
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="title">Title</Label>
                  <Controller
                    name="title"
                    control={control}
                    rules={{ required: "Title is required" }}
                    render={({ field, fieldState: { error } }) => (
                      <>
                        <Input id="title" {...field} placeholder="Enter a title" />
                        {error && (
                          <span className="text-red-500 text-sm">
                            {error.message}
                          </span>
                        )}
                      </>
                    )}
                  />
                </div>

                {/* NOTE TYPE */}
                <div className="flex flex-col space-y-1.5">
                  <Label>Note Type</Label>
                  <Tabs
                    value={noteType}
                    onValueChange={(value) =>
                      setValue("type", value as NoteType)
                    }
                  >
                    <TabsList>
                      <TabsTrigger value="TEXT">Text</TabsTrigger>
                      <TabsTrigger value="IMAGE">Image</TabsTrigger>
                      <TabsTrigger value="STYLUS">Stylus</TabsTrigger>
                      <TabsTrigger value="VOICE">Voice</TabsTrigger>
                    </TabsList>

                    {/* TEXT */}
                    <TabsContent value="TEXT">
                      <div className="border rounded-md p-4">
                        <MenuBar editor={editor} />
                        <EditorContent editor={editor} />
                      </div>
                    </TabsContent>

                    {/* IMAGE */}
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
                              setValue("content", reader.result as string)
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </TabsContent>

                    {/* STYLUS (placeholder or your canvas approach) */}
                    <TabsContent value="STYLUS">
                      <p className="text-sm text-muted-foreground">
                        
                      </p>
                    </TabsContent>

                    {/* VOICE */}
                    <TabsContent value="VOICE">
                      {/*
                        Pass the typed setValue from react-hook-form
                        so VoiceToTextContent can do setValue('content', transcript)
                      */}
                      <VoiceToTextContent setValue={setValue} />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              {/* ACTIONS */}
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
                      reset({ title: "", content: "", type: "TEXT" })
                      editor?.commands.setContent("")
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

        {/* NOTES LIST */}
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
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {note.title || "Untitled Note"}
                      </CardTitle>
                      {note.type === "TEXT" && (
                        <Edit2Icon className="h-4 w-4 text-muted-foreground" />
                      )}
                      {note.type === "IMAGE" && (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                      {note.type === "STYLUS" && (
                        <PencilIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                      {note.type === "VOICE" && (
                        <Mic className="h-4 w-4 text-muted-foreground" />
                      )}
                    </CardHeader>
                    <CardContent>
                      {note.type === "STYLUS" ? (
                        <p className="text-sm">
                          (Example stylus data or Tldraw JSON)
                        </p>
                      ) : note.type === "TEXT" ? (
                        <div
                          dangerouslySetInnerHTML={{ __html: sanitizeRichText(note.content) }}
                          className="prose max-w-none"
                        />
                      ) : note.type === "IMAGE" ? (
                        <img
                          src={note.content}
                          alt="Note image"
                          className="w-full h-auto"
                        />
                      ) : (
                        <p className="text-sm">{note.content}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(note.updatedAt).toLocaleString()}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(note)}
                      >
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

      {/* DELETE MODAL */}
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

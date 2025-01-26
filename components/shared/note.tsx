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
import { toast } from "sonner"
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListIcon,
  ListOrderedIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  MoreHorizontalIcon,
  PencilIcon,
  Square,
  Circle,
  EraserIcon,
  Mic,
  MicOff,
} from "lucide-react"

// shadcn/ui (or your UI library) components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Toggle } from "@/components/ui/toggle"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"

// Tiptap
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Image from "@tiptap/extension-image"
import Heading from "@tiptap/extension-heading"

// TYPES
interface DocFormValues {
  title: string
  content: string
  stylusData?: string
  voiceTranscript?: string
  voiceAudio?: string
}

/* ------------------------------------------------------------------
   SPEECH RECOGNITION
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
      toast.error("Browser does not support speech recognition.")
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
   AUDIO RECORDER
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
      toast.error("Unable to access microphone.")
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
   STYLUS DRAWING
------------------------------------------------------------------ */
type ShapeTool = "pen" | "square" | "circle"

const useCanvasDrawing = () => {
  const [isDrawing, setIsDrawing] = useState(false)
  const [penColor, setPenColor] = useState("#000000")
  const [penSize, setPenSize] = useState(3)
  const [shape, setShape] = useState<ShapeTool>("pen")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startDrawing = useCallback(
    (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
      setIsDrawing(true)
      draw(e)
    },
    []
  )

  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      ctx?.beginPath()
    }
  }, [])

  const clearCanvas = useCallback(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [])

  // The actual drawing function
  const draw = useCallback(
    (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
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

      if (shape === "pen") {
        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x, y)
      } else if (shape === "square") {
        ctx.strokeRect(x - penSize / 2, y - penSize / 2, penSize, penSize)
      } else if (shape === "circle") {
        ctx.beginPath()
        ctx.arc(x, y, penSize / 2, 0, Math.PI * 2)
        ctx.stroke()
      }
    },
    [isDrawing, penColor, penSize, shape]
  )

  return {
    canvasRef,
    penColor,
    setPenColor,
    penSize,
    setPenSize,
    shape,
    setShape,
    startDrawing,
    stopDrawing,
    draw,
    clearCanvas,
  }
}

/* ------------------------------------------------------------------
   MAIN COMPONENT (WITHOUT TEXT ALIGN EXTENSION)
------------------------------------------------------------------ */
export default function WordLikeEditorNoTextAlign() {
  const [darkMode, setDarkMode] = useState(false)

  // React Hook Form
  const { control, handleSubmit, reset, setValue, watch } = useForm<DocFormValues>({
    defaultValues: {
      title: "Untitled Document",
      content: "",
      stylusData: "",
      voiceTranscript: "",
      voiceAudio: "",
    },
  })
  const docTitle = watch("title")

  // TIPTAP Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      // No text alignment extension used here
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setValue("content", editor.getHTML())
    },
  })

  // HEADINGS
  const toggleHeading = (level: 1 | 2 | 3) => {
    if (!editor) return
    editor.chain().focus().toggleHeading({ level }).run()
  }

  // Insert image
  const handleInsertImage = (file: File) => {
    if (!editor || !file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      editor.chain().focus().setImage({ src: url }).run()
    }
    reader.readAsDataURL(file)
  }

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

  // Keep transcript in form if needed
  useEffect(() => {
    setValue("voiceTranscript", transcript)
  }, [transcript, setValue])

  // STYLUS DRAWING
  const {
    canvasRef,
    penColor,
    setPenColor,
    penSize,
    setPenSize,
    shape,
    setShape,
    startDrawing,
    stopDrawing,
    draw,
    clearCanvas,
  } = useCanvasDrawing()

  const handleInsertDrawing = () => {
    const dataURL = canvasRef.current?.toDataURL()
    if (!dataURL || !editor) return
    editor.chain().focus().setImage({ src: dataURL }).run()
    toast("Drawing inserted!")
  }

  // SAVE / LOAD (localStorage)
  const onSaveDoc = handleSubmit((vals) => {
    localStorage.setItem("my_doc", JSON.stringify(vals))
    toast.success("Document saved!")
  })
  const onLoadDoc = () => {
    const data = localStorage.getItem("my_doc")
    if (data) {
      const doc = JSON.parse(data) as DocFormValues
      reset(doc)
      editor?.commands.setContent(doc.content)
      toast("Loaded saved doc.")
    } else {
      toast.error("No saved document found.")
    }
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-neutral-900 dark:text-gray-100 flex flex-col">
        
        {/* HEADER: Title + Save/Load + Dark mode toggle */}
        <div className="flex items-center justify-between bg-white dark:bg-neutral-800 border-b border-gray-300 dark:border-neutral-700 p-3">
          <div className="flex items-center gap-2">
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  className="text-lg font-semibold border-0 focus:ring-0 bg-transparent p-0"
                />
              )}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? "Light Mode" : "Dark Mode"}
            </Button>
            <Button variant="secondary" onClick={onLoadDoc}>
              Load
            </Button>
            <Button variant="default" onClick={onSaveDoc}>
              Save
            </Button>
          </div>
        </div>

        {/* RIBBON with headings, bold, italic, underline, lists, insert menu */}
        <div className="bg-white dark:bg-neutral-800 border-b border-gray-300 dark:border-neutral-700 px-3 py-2 flex flex-wrap items-center gap-2">
          
          {/* HEADINGS */}
          <div className="flex items-center gap-1">
            <Toggle
              pressed={editor?.isActive("heading", { level: 1 })}
              onPressedChange={() => toggleHeading(1)}
            >
              <Heading1Icon className="h-5 w-5" />
            </Toggle>
            <Toggle
              pressed={editor?.isActive("heading", { level: 2 })}
              onPressedChange={() => toggleHeading(2)}
            >
              <Heading2Icon className="h-5 w-5" />
            </Toggle>
            <Toggle
              pressed={editor?.isActive("heading", { level: 3 })}
              onPressedChange={() => toggleHeading(3)}
            >
              <Heading3Icon className="h-5 w-5" />
            </Toggle>
          </div>

          {/* BASIC STYLES: B, I, U */}
          <div className="flex items-center gap-1">
            <Toggle
              pressed={editor?.isActive("bold")}
              onPressedChange={() => editor?.chain().focus().toggleBold().run()}
            >
              <BoldIcon className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={editor?.isActive("italic")}
              onPressedChange={() =>
                editor?.chain().focus().toggleItalic().run()
              }
            >
              <ItalicIcon className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={editor?.isActive("underline")}
              onPressedChange={() =>
                editor?.chain().focus().toggleUnderline().run()
              }
            >
              <UnderlineIcon className="h-4 w-4" />
            </Toggle>
          </div>

          {/* LISTS */}
          <div className="flex items-center gap-1">
            <Toggle
              pressed={editor?.isActive("bulletList")}
              onPressedChange={() =>
                editor?.chain().focus().toggleBulletList().run()
              }
            >
              <ListIcon className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={editor?.isActive("orderedList")}
              onPressedChange={() =>
                editor?.chain().focus().toggleOrderedList().run()
              }
            >
              <ListOrderedIcon className="h-4 w-4" />
            </Toggle>
          </div>

          {/* INSERT MENU */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1 text-sm">
                <MoreHorizontalIcon className="h-4 w-4" />
                Insert
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-white dark:bg-neutral-800 dark:text-gray-100">
              <DialogHeader>
                <DialogTitle>Insert Options</DialogTitle>
                <DialogDescription>Add images, drawings, or voice</DialogDescription>
              </DialogHeader>

              {/* Insert Image */}
              <div className="border-b border-gray-300 dark:border-neutral-600 py-3">
                <label className="block text-sm font-semibold mb-2">Image</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleInsertImage(file)
                      toast.success("Image inserted!")
                    }
                  }}
                />
              </div>

              {/* Stylus Drawing */}
              <div className="border-b border-gray-300 dark:border-neutral-600 py-3">
                <label className="block text-sm font-semibold mb-2">
                  Stylus Drawing
                </label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Open Drawing Canvas
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl bg-white dark:bg-neutral-800 dark:text-gray-100">
                    <DialogHeader>
                      <DialogTitle>Drawing Canvas</DialogTitle>
                    </DialogHeader>
                    <div className="p-2 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Toggle
                          pressed={shape === "pen"}
                          onPressedChange={() => setShape("pen")}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Toggle>
                        <Toggle
                          pressed={shape === "square"}
                          onPressedChange={() => setShape("square")}
                        >
                          <Square className="h-4 w-4" />
                        </Toggle>
                        <Toggle
                          pressed={shape === "circle"}
                          onPressedChange={() => setShape("circle")}
                        >
                          <Circle className="h-4 w-4" />
                        </Toggle>
                        <Input
                          type="color"
                          value={penColor}
                          onChange={(e) => setPenColor(e.target.value)}
                          className="w-10 h-10 p-0"
                        />
                        <Input
                          type="range"
                          min={1}
                          max={20}
                          value={penSize}
                          onChange={(e) => setPenSize(parseInt(e.target.value))}
                          className="w-32"
                        />
                        <Button variant="outline" size="sm" onClick={clearCanvas}>
                          <EraserIcon className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      </div>
                      <canvas
                        ref={canvasRef}
                        className="border w-full h-[400px]"
                        width={800}
                        height={400}
                        onMouseDown={startDrawing}
                        onMouseUp={stopDrawing}
                        onMouseOut={stopDrawing}
                        onMouseMove={(e) => e.buttons === 1 && draw(e)}
                        onTouchStart={startDrawing}
                        onTouchEnd={stopDrawing}
                        onTouchMove={draw}
                      />
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          handleInsertDrawing()
                          toast("Drawing inserted!")
                        }}
                      >
                        Insert Drawing
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Voice */}
              <div className="py-3">
                <label className="block text-sm font-semibold mb-2">Voice Note</label>
                <Tabs defaultValue="transcription">
                  <TabsList className="mb-2">
                    <TabsTrigger value="transcription">Transcription</TabsTrigger>
                    <TabsTrigger value="audio">Audio</TabsTrigger>
                  </TabsList>
                  <TabsContent value="transcription">
                    {!browserSupportsSpeechRecognition && (
                      <p className="text-sm text-red-500">
                        This browser does not support speech recognition.
                      </p>
                    )}
                    <div className="flex gap-2 mb-2">
                      <Button onClick={startListening} disabled={listening} size="sm">
                        <Mic className="h-4 w-4 mr-1" />
                        {listening ? "Listening..." : "Start"}
                      </Button>
                      <Button
                        onClick={stopListening}
                        disabled={!listening}
                        variant="outline"
                        size="sm"
                      >
                        <MicOff className="h-4 w-4 mr-1" />
                        Stop
                      </Button>
                      <Button onClick={resetTranscript} variant="outline" size="sm">
                        Reset
                      </Button>
                    </div>
                    <textarea
                      className="w-full h-24 p-2 border rounded text-sm"
                      value={transcript}
                      onChange={(e) => setValue("voiceTranscript", e.target.value)}
                    />
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        if (!transcript) {
                          toast.error("No transcription to insert.")
                          return
                        }
                        // Insert transcript into Tiptap
                        editor?.chain().focus().insertContent(transcript).run()
                        toast.success("Transcript inserted!")
                      }}
                    >
                      Insert Transcript
                    </Button>
                  </TabsContent>
                  <TabsContent value="audio">
                    <div className="flex gap-2 mb-2">
                      {!isRecording ? (
                        <Button onClick={startRecording} size="sm">
                          <Mic className="h-4 w-4 mr-1" />
                          Record
                        </Button>
                      ) : (
                        <Button variant="destructive" onClick={stopRecording} size="sm">
                          <MicOff className="h-4 w-4 mr-1" />
                          Stop
                        </Button>
                      )}
                      <Button onClick={resetRecording} variant="outline" size="sm">
                        Reset
                      </Button>
                    </div>
                    {audioURL && (
                      <audio controls src={audioURL} className="mt-2 w-full">
                        Your browser does not support HTML audio.
                      </audio>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        if (!audioURL) {
                          toast.error("No audio to insert.")
                          return
                        }
                        // Insert an <audio> tag into Tiptap
                        editor
                          ?.chain()
                          .focus()
                          .insertContent(
                            `<p><audio controls src="${audioURL}"></audio></p>`
                          )
                          .run()
                        toast.success("Audio inserted!")
                      }}
                    >
                      Insert Audio
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* MAIN EDITOR AREA */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-4xl mx-auto bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded p-4 shadow-sm">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  )
}
